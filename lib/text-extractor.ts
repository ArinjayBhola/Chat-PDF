import fs from "fs";
import path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createWorker } from "tesseract.js";
import { ocrPdfPage } from "./OCR";
import pLimit from "p-limit";
import { getFileCategory } from "./file-utils";

export type ExtractedPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function extractText(filePath: string): Promise<ExtractedPage[]> {
  const category = getFileCategory(filePath);

  switch (category) {
    case "pdf":
      return extractPdf(filePath);
    case "document":
      return extractDocx(filePath);
    case "spreadsheet":
      return extractSpreadsheet(filePath);
    case "presentation":
      return extractPptx(filePath);
    case "image":
      return extractImage(filePath);
    case "text":
    default:
      return extractPlainText(filePath);
  }
}

async function extractPdf(filePath: string): Promise<ExtractedPage[]> {
  const loader = new PDFLoader(filePath);
  const pages = await loader.load();

  const limit = pLimit(10);
  const processedPages = await Promise.all(
    pages.map((page, i) =>
      limit(async () => {
        let text = page.pageContent;
        if (needsOCR(text)) {
          console.log(`OCR fallback → page ${i + 1}`);
          const worker = await createWorker("eng");
          try {
            text = await ocrPdfPage(filePath, i + 1, worker);
          } finally {
            await worker.terminate();
          }
        }
        return {
          pageContent: text,
          metadata: { loc: { pageNumber: i + 1 } },
        };
      }),
    ),
  );

  return processedPages;
}

async function extractDocx(filePath: string): Promise<ExtractedPage[]> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return [
    {
      pageContent: result.value,
      metadata: { loc: { pageNumber: 1 } },
    },
  ];
}

async function extractSpreadsheet(filePath: string): Promise<ExtractedPage[]> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".csv") {
    const content = fs.readFileSync(filePath, "utf-8");
    return [
      {
        pageContent: content,
        metadata: { loc: { pageNumber: 1 } },
      },
    ];
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.readFile(filePath);
  const pages: ExtractedPage[] = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    pages.push({
      pageContent: `Sheet: ${sheetName}\n${csv}`,
      metadata: { loc: { pageNumber: index + 1 } },
    });
  });

  return pages;
}

async function extractPptx(filePath: string): Promise<ExtractedPage[]> {
  try {
    const JSZip = (await import("jszip")).default;
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);

    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
      });

    const pages: ExtractedPage[] = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.files[slideFiles[i]].async("text");
      // Extract text content from XML tags (a:t elements contain text in OOXML)
      const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const text = textMatches.map((m) => m.replace(/<\/?a:t>/g, "")).join(" ");
      pages.push({
        pageContent: text || "",
        metadata: { loc: { pageNumber: i + 1 } },
      });
    }

    return pages.length > 0
      ? pages
      : [{ pageContent: "No text content found in presentation.", metadata: { loc: { pageNumber: 1 } } }];
  } catch (error) {
    console.error("PPTX extraction failed:", error);
    return [
      {
        pageContent: "Could not extract text from this presentation file.",
        metadata: { loc: { pageNumber: 1 } },
      },
    ];
  }
}

async function extractImage(filePath: string): Promise<ExtractedPage[]> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath);
    return [
      {
        pageContent: text || "No text could be extracted from this image.",
        metadata: { loc: { pageNumber: 1 } },
      },
    ];
  } finally {
    await worker.terminate();
  }
}

async function extractPlainText(filePath: string): Promise<ExtractedPage[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  return [
    {
      pageContent: content,
      metadata: { loc: { pageNumber: 1 } },
    },
  ];
}

function needsOCR(text: string) {
  if (!text) return true;
  return text.replace(/\s+/g, "").length < 200;
}
