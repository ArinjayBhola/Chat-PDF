// Helper function for saving notes from other components
export async function saveToNotes(chatId: string, content: string, source: "ai_response" | "user_message" | "manual") {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, content, source }),
  });

  if (!res.ok) {
    throw new Error("Failed to save note");
  }

  return res.json();
}
