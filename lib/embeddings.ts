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
