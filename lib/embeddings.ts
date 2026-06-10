import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function getEmbeddings(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent({
      taskType: "RETRIEVAL_DOCUMENT",
      content: { parts: [{ text: text.replace(/\n/g, " ") }] },
      outputDimensionality: 768,
    } as any);
    return result.embedding.values;
  } catch (error) {
    console.log("error calling gemini embedding api", error);
    throw error;
  }
}

/**
 * Embed many texts in a single API call. Falls back to concurrent single-text
 * calls if the batch endpoint is unavailable or returns an unexpected shape, so
 * indexing keeps working regardless of the model's batch support.
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.batchEmbedContents({
      requests: texts.map((text) => ({
        taskType: "RETRIEVAL_DOCUMENT",
        content: { parts: [{ text: text.replace(/\n/g, " ") }] },
        outputDimensionality: 768,
      })),
    } as any);

    const embeddings = result.embeddings?.map((e: any) => e.values);
    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error(
        `Batch embed returned ${embeddings?.length ?? 0} vectors for ${texts.length} inputs`,
      );
    }
    return embeddings;
  } catch (error) {
    console.warn(
      "Batch embedding unavailable, falling back to per-item embedding:",
      error instanceof Error ? error.message : error,
    );
    return Promise.all(texts.map((t) => getEmbeddings(t)));
  }
}
