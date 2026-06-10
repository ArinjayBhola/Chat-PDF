import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";
import { getPineconeIndex } from "./pinecone-client";

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
  const index = getPineconeIndex();
  try {
    const namespace = convertToAscii(fileKey);
    const queryResult = await index.namespace(namespace).query({
      topK: 12,
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

  const docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
  return docs.join("\n").substring(0, 12000);
}
