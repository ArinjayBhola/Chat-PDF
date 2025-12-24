import Bytez from "bytez.js";

export async function getEmbeddings(text: string): Promise<number[]> {
  if (!text || !text.trim()) {
    throw new Error("Cannot embed empty text");
  }

  const sdk = new Bytez(process.env.BYTEZ_API_KEY!);
  const model = sdk.model("nomic-ai/nomic-embed-text-v1.5");
  
  const { output, error } = await model.run(text);

  if (error) {
    throw new Error(`Bytez embedding error: ${error}`);
  }

  if (!output) {
    throw new Error("Bytez returned null output");
  }

  let embedding: unknown;

  // ---- Shape handling ----
  if (Array.isArray(output)) {
    // [embedding] or [[embedding]]
    if (Array.isArray(output[0])) {
      embedding = Array.isArray(output[0][0]) ? output[0][0] : output[0];
    } else {
      embedding = output;
    }
  } else if (typeof output === "object" && output !== null) {
    // Structured response
    if (Array.isArray(output.embedding)) {
      embedding = output.embedding;
    } else if (Array.isArray(output.data)) {
      embedding = output.data[0];
    } else {
      throw new Error(`Unexpected Bytez output shape: ${Object.keys(output).join(", ")}`);
    }
  } else {
    throw new Error(`Invalid Bytez output type: ${typeof output}`);
  }

  // ---- Normalize ----
  const flatEmbedding = (embedding as any[]).flat(Infinity).map((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) {
      throw new Error(`Invalid embedding value: ${v}`);
    }
    return n;
  });

  if (flatEmbedding.length === 0) {
    throw new Error("Empty embedding vector returned");
  }

  return flatEmbedding;
}
