import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { RecursiveCharacterTextSplitter, Document } from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import md5 from "md5";
import { convertToAscii } from "./utils";
import { extractText, ExtractedPage } from "./text-extractor";

export async function loadS3IntoPinecode(file_key: string) {
  // 1. Download file from S3
  const file_name = await downloadFromS3(file_key);
  if (!file_name) {
    throw new Error("Failed to download file from S3");
  }

  // 2. Extract text using unified extractor (handles PDF, DOCX, XLSX, images, etc.)
  const pages = await extractText(file_name);

  // 3. Split into documents
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. Vectorize and embed the documents
  const allDocuments = documents.flat();
  const vectors: PineconeRecord<RecordMetadata>[] = [];

  // Batch processing for embeddings to avoid rate limits
  const EMBEDDING_BATCH_SIZE = 5;
  for (let i = 0; i < allDocuments.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = allDocuments.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchVectors = await Promise.all(batch.map(embedDocument));
    vectors.push(...batchVectors);
    console.log(
      `Embedded batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(
        allDocuments.length / EMBEDDING_BATCH_SIZE,
      )}`,
    );
  }

  // 4. Use chunked upsert to upload the vectors in chunks (to avoid hitting rate limits)
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
  });

  const indexName = process.env.PINECONE_INDEX_NAME || "chatpdf";

  const namespace = convertToAscii(file_key);
  const pineconeIndex = pc.index(indexName);
  const index = pineconeIndex.namespace(namespace);

  let BATCH_SIZE = 10; // Reduced from 100 to avoid 2MB limit
  const MAX_REQUEST_SIZE = 2 * 1024 * 1024; // 2MB in bytes

  // Helper function to estimate batch size in bytes
  const estimateBatchSize = (batch: typeof vectors): number => {
    return JSON.stringify(batch).length;
  };

  let i = 0;
  let batchNumber = 1;

  while (i < vectors.length) {
    let batch = vectors.slice(i, i + BATCH_SIZE);
    let batchSize = estimateBatchSize(batch);

    // If batch is too large, reduce batch size
    while (batchSize > MAX_REQUEST_SIZE * 0.9 && batch.length > 1) {
      // Reduce batch size by 1
      BATCH_SIZE = Math.max(1, batch.length - 1);
      batch = vectors.slice(i, i + BATCH_SIZE);
      batchSize = estimateBatchSize(batch);
    }

    try {
      await index.upsert(batch);
      console.log(`Uploaded batch ${batchNumber} (${batch.length} vectors, ~${(batchSize / 1024).toFixed(2)}KB)`);
      i += batch.length;
      batchNumber++;

      // Gradually increase batch size if successful (adaptive batching)
      if (batchSize < MAX_REQUEST_SIZE * 0.5 && BATCH_SIZE < 50) {
        BATCH_SIZE = Math.min(50, BATCH_SIZE + 2);
      }
    } catch (error: unknown) {
      // If error is due to request size, reduce batch and retry
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("size") && (errorMessage.includes("exceeds") || errorMessage.includes("maximum"))) {
        BATCH_SIZE = Math.max(1, Math.floor(BATCH_SIZE / 2));
        console.log(`Request size error detected, reducing batch size to ${BATCH_SIZE}`);
        continue;
      }
      throw error;
    }
  }
}

// ---------- Helper functions ----------

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    // Validate embeddings format - must be a flat array of numbers
    if (!Array.isArray(embeddings)) {
      throw new Error(`Embeddings must be an array, got ${typeof embeddings}`);
    }

    if (embeddings.length === 0) {
      throw new Error("Embeddings array is empty");
    }

    // Ensure all values are numbers
    const validEmbeddings = embeddings.map((v: unknown) => {
      if (typeof v !== "number" || isNaN(v)) {
        throw new Error(`Invalid embedding value: ${v}`);
      }
      return v;
    });

    // Validate embedding dimension (Pinecone index expects 1536 for this setup)
    // Common embedding dimensions: 384, 512, 768, 1024, 1536
    if (validEmbeddings.length > 2000) {
      throw new Error(
        `Embedding dimension ${validEmbeddings.length} is too large. This usually indicates incorrect tensor extraction. Expected around 768 or 1536.`,
      );
    }

    return {
      id: hash,
      values: validEmbeddings,
      metadata: {
        text: String(doc.metadata.text || doc.pageContent || ""),
        pageNumber: Number(doc.metadata.pageNumber || 0),
      },
    };
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const encoder = new TextEncoder();
  return new TextDecoder("utf-8").decode(encoder.encode(str).slice(0, bytes));
};

async function prepareDocument(page: ExtractedPage) {
  const { metadata } = page;
  const pageContent = page.pageContent.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  // spit the docs
  const spitter = new RecursiveCharacterTextSplitter();
  const docs = await spitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
