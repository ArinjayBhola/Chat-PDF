import Bytez from "bytez.js";

export async function getEmbeddings(text: string): Promise<number[] | undefined> {
  const key = process.env.BYTEZ_API_KEY!;
  const sdk = new Bytez(key);

  // choose nomic-embed-text-v1.5
  const model = sdk.model("nomic-ai/nomic-embed-text-v1.5");

  // send input to model
  try {
    const { output } = await model.run(text);
    // let embedding: number[] = [];

    // if (Array.isArray(output)) {
    //   if (Array.isArray(output[0])) {
    //     embedding = output[0]; // Handle [[embedding]]
    //   } else {
    //     embedding = output; // Handle [embedding]
    //   }
    // } else {
    //   throw new Error("Unexpected embedding API response format");
    // }

    // // Ensure it's a flat array of numbers
    const flatEmbedding = output.flat().map((v: any) => {
      const n = Number(v);
      if (Number.isNaN(n)) {
        throw new Error("Non-numeric value in embedding");
      }
      return n;
    });

    return flatEmbedding as number[];
  } catch (error) {
    console.error("Error fetching embeddings:", error);
    return undefined;
  }
}
