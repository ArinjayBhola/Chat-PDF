import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
  });
  const index = pinecone.index("chat-pdf");
  try {
    const namespace = convertToAscii(fileKey);
    const queryResult = await index.namespace(namespace).query({
      topK: 5,
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

  const qualifyingDocs = matches.filter((match) => match.score && match.score > 0.7);

  type Metadata = {
    text: string;
    pageNumber: number;
  };

  const docs = matches.map((match) => (match.metadata as Metadata).text);
  return docs.join("\n").substring(0, 3000);
}
