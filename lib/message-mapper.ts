import { UIMessage } from "ai";

type DBMessage = {
  id: string;
  role: "user" | "system" | "assistant";
  content: string;
};

export function dbMessageToUIMessage(m: DBMessage): UIMessage {
  return {
    id: m.id,
    role: m.role === "system" ? "assistant" : m.role,
    parts: [
      {
        type: "text",
        text: m.content,
      },
    ],
  };
}
