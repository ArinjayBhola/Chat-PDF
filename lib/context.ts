import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";
import { getPineconeIndex } from "./pinecone-client";

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
  const index = getPineconeIndex();
  try {
    const namespace = convertToAscii(fileKey);
    const queryResult = await index.namespace(namespace).query({
      topK: 8,
      vector: embeddings,
      includeMetadata: true,
    });
    return queryResult.matches || [];
  } catch (error) {
    console.error("Error fetching matches from Pinecone:", error);
    throw error;
  }
}

export async function getContext(query: string, fileKey: string) {
  const queryEmbeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

  const qualifyingDocs = matches.filter((match) => match.score && match.score > 0.5);

  type Metadata = {
    text: string;
    pageNumber: number;
  };

  // De-duplicate chunks (overlapping splits often return near-identical text)
  // and cap total length. ~8000 chars keeps enough grounding while cutting the
  // per-request prompt token cost.
  const seen = new Set<string>();
  const docs: string[] = [];
  for (const match of qualifyingDocs) {
    const text = (match.metadata as Metadata).text;
    if (!text || seen.has(text)) continue;
    seen.add(text);
    docs.push(text);
  }
  return docs.join("\n").substring(0, 8000);
}
