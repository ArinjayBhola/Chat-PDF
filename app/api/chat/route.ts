import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
      model: google("gemini-2.5-flash-preview-09-2025"),
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}
