export async function getApiEmbedding(text: string): Promise<number[]> {
  const model = "nomic-ai/nomic-embed-text-v1";

  const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API Error ${response.status}: ${response.statusText} → ${errorText}`);
  }

  const data = await response.json();
  // The API returns a nested array like [[embedding_vector]] or [embedding_vector]
  let embedding: number[];

  if (Array.isArray(data)) {
    if (Array.isArray(data[0])) {
      embedding = data[0]; // Handle [[embedding]]
    } else {
      embedding = data; // Handle [embedding]
    }
  } else {
    throw new Error("Unexpected embedding API response format");
  }

  // Ensure it's a flat array of numbers
  const flatEmbedding = embedding.flat().map((v) => (typeof v === "number" ? v : parseFloat(v)));

  return flatEmbedding;
}
