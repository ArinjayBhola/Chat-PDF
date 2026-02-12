import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { ocrPdfPage } from "./OCR";
import { createWorker } from "tesseract.js";
import pLimit from "p-limit";

// Schema for the structured output we want from Gemini
const SummarySchema = z.object({
  summary: z.string().describe("A concise 3-5 line summary of the PDF document."),
  suggestedQuestions: z
    .array(z.string())
    .length(5)
    .describe("5 high-quality, context-aware questions based on the PDF content."),
});

export async function generateSummaryAndQuestions(file_key: string) {
  try {
    console.log("Generating summary and questions for", file_key);
    // 1. Download PDF
    const file_name = await downloadFromS3(file_key);
    if (!file_name) {
      throw new Error("Failed to download file from S3");
    }

    // 2. Extract Text
    const loader = new PDFLoader(file_name);
    const pages = await loader.load();

    // 2.5 Run OCR fallback for image-only pages
    const limit = pLimit(5);
    const processedPages = await Promise.all(
      pages.map((page, i) =>
        limit(async () => {
          let text = page.pageContent;
          if (needsOCR(text)) {
            console.log(`Summary OCR fallback → page ${i + 1}`);
            const worker = await createWorker("eng");
            try {
              text = await ocrPdfPage(file_name, i + 1, worker);
            } catch (e) {
              console.error(`OCR failed on page ${i + 1}`, e);
            } finally {
              await worker.terminate();
            }
          }
          return text;
        }),
      ),
    );
    
    // Concatenate text from all pages
    let fullText = processedPages.join("\n");
    if (fullText.length > 50000) {
        fullText = fullText.substring(0, 50000) + "...(truncated)";
    }

    // 3. Generate Summary & Questions using Gemini
    const { object } = await generateObject({
      model: google("gemini-2.5-flash-preview-09-2025"), // Using the same model as chat
      schema: SummarySchema,
      prompt: `
        You are an intelligent document assistant. 
        Analyze the following text extracted from a PDF document.
        
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

function needsOCR(text: string) {
  if (!text) return true;
  return text.replace(/\s+/g, "").length < 200;
}
