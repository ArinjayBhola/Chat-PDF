export async function getEmbeddings(text: string): Promise<number[]> {
  const mode = process.env.EMBED_MODE;

  if (mode === "local") {
    // dynamic import — NOT bundled in prod
    const { getLocalEmbedding } = await import("./embeddings.local");
    return getLocalEmbedding(text);
  }

  const { getApiEmbedding } = await import("./embeddings.api");
  return getApiEmbedding(text);
}
