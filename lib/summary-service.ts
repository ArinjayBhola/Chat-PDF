import { downloadFromS3 } from "./s3-server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { extractText } from "./text-extractor";
import { getFileCategory } from "./file-utils";

// Schema for the structured output we want from Gemini
const SummarySchema = z.object({
  summary: z.string().describe("A concise 3-5 line summary of the document."),
  suggestedQuestions: z
    .array(z.string())
    .length(5)
    .describe("5 high-quality, context-aware questions based on the document content."),
});

export async function generateSummaryAndQuestions(file_key: string) {
  try {
    console.log("Generating summary and questions for", file_key);
    // 1. Download file
    const file_name = await downloadFromS3(file_key);
    if (!file_name) {
      throw new Error("Failed to download file from S3");
    }

    // 2. Extract text using unified extractor
    const pages = await extractText(file_name);
    const fileCategory = getFileCategory(file_key);

    // Concatenate text from all pages
    let fullText = pages.map((p) => p.pageContent).join("\n");
    if (fullText.length > 50000) {
        fullText = fullText.substring(0, 50000) + "...(truncated)";
    }

    // 3. Generate Summary & Questions using Gemini
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"), // Using the same model as chat
      schema: SummarySchema,
      prompt: `
        You are an intelligent document assistant.
        Analyze the following text extracted from a ${fileCategory} file.

        1. Generate a concise summary (3-5 lines) that captures the main idea.
        2. Generate exactly 5 relevant, high-quality questions that a user might ask about this document.

        DOCUMENT TEXT:
        ${fullText}
      `,
    });

    return object;

  } catch (error) {
    console.error("Error generating summary:", error);
    // Return nulls so we don't block the whole flow if this fails
    return { summary: null, suggestedQuestions: [] };
  }
}
