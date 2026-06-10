import { Pinecone } from "@pinecone-database/pinecone";

// Reuse a single Pinecone client across requests instead of constructing a new
// one (and its underlying HTTP agent) on every query. Survives HMR in dev.
const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined;
};

export function getPineconeClient(): Pinecone {
  if (!globalForPinecone.pinecone) {
    globalForPinecone.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });
  }
  return globalForPinecone.pinecone;
}

export function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME || "chatpdf";
  return getPineconeClient().index(indexName);
}
