import { pipeline } from "@huggingface/transformers";

let localPipe: ((text: string) => Promise<unknown>) | null = null;

export async function getLocalEmbedding(text: string): Promise<number[]> {
  const model = "nomic-ai/nomic-embed-text-v1";
  if (!localPipe) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    localPipe = (await pipeline("feature-extraction", model)) as any;
  }

  if (!localPipe) {
    throw new Error("Failed to initialize local pipeline");
  }

  // Run embedding inference
  const output = (await localPipe(text)) as unknown;

  let embedding: number[];

  if (output && typeof output === "object" && "data" in output && output.data) {
    const tensor = output as {
      data: ArrayLike<number> | number[];
      dims?: number[];
      size?: number[];
      shape?: number[];
    };

    const dims = tensor.dims || tensor.size || tensor.shape;
    const dataArray = Array.isArray(tensor.data) ? tensor.data : Array.from(tensor.data);

    // If we have shape/dims info, use it to extract the correct slice
    if (dims && dims.length >= 2) {
      const embeddingDim = dims[dims.length - 1];
      const batchSize = dims[0];

      // Extract the first embedding vector
      if (batchSize === 1 && dataArray.length >= embeddingDim) {
        // Simple case: [1, embedding_dim] - take first embeddingDim values
        embedding = dataArray.slice(0, embeddingDim) as number[];
      } else if (batchSize > 1) {
        // Multiple batches - take first batch's embedding
        embedding = dataArray.slice(0, embeddingDim) as number[];
      } else {
        // Fallback: use entire data if dimensions don't make sense
        embedding = dataArray.slice(0, Math.min(embeddingDim, dataArray.length)) as number[];
      }
    } else {
      const reasonableDims = [384, 512, 768, 1024, 1536];
      let foundDim = reasonableDims.find((dim) => Math.abs(dataArray.length - dim) < 10);

      if (!foundDim && dataArray.length > 1000) {
        foundDim = 768;
        console.warn(`Large data array (${dataArray.length}), assuming 768 dimensions`);
      }

      if (foundDim) {
        embedding = dataArray.slice(0, foundDim) as number[];
      } else {
        // Fallback: use entire array but warn
        console.warn(`Using entire data array of length ${dataArray.length} as embedding`);
        embedding = dataArray as number[];
      }
    }
  } else if (Array.isArray(output)) {
    // Handle nested arrays [[embedding]] or [embedding]
    if (Array.isArray(output[0])) {
      if (Array.isArray(output[0][0])) {
        embedding = output[0][0] as number[];
      } else {
        embedding = output[0] as number[];
      }
    } else {
      embedding = output as number[];
    }
  } else {
    throw new Error(
      `Unexpected embedding output format: ${typeof output}, keys: ${
        output && typeof output === "object" ? Object.keys(output).join(", ") : "N/A"
      }`,
    );
  }

  // Ensure it's a flat array of numbers
  const flatEmbedding = embedding.flat(Infinity).map((v) => {
    const num = typeof v === "number" ? v : parseFloat(String(v));
    if (isNaN(num)) {
      throw new Error(`Invalid embedding value: ${v}`);
    }
    return num;
  });

  // Log embedding dimension for debugging
  return flatEmbedding;
}
