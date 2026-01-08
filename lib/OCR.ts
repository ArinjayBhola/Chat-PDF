import { fromPath } from "pdf2pic";
import { createWorker, Worker } from "tesseract.js";
import fs from "fs/promises";
import os from "os";

export async function ocrPdfPage(pdfPath: string, pageNumber: number, worker?: Worker): Promise<string> {
  const tempDir = os.tmpdir();
  const options = {
    density: 200,
    format: "png",
    savePath: tempDir,
    width: 2000,
    height: 2000,
  };

  const converter = fromPath(pdfPath, options);
  const page = await converter(pageNumber);

  let tempWorker: Worker | null = null;
  const workerToUse = worker || (tempWorker = await createWorker("eng"));

  try {
    if (!page.path) {
      throw new Error("Failed to generate image from PDF page");
    }

    const {
      data: { text },
    } = await workerToUse.recognize(page.path);

    // Cleanup the generated image
    if (page.path) {
      await fs.unlink(page.path).catch((e) => console.error("Failed to delete temp OCR image:", e));
    }

    return text;
  } finally {
    if (tempWorker) {
      await tempWorker.terminate();
    }
  }
}
