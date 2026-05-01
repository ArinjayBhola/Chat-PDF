import fs from "fs/promises";
import os from "os";
import path from "path";
import { createWorker } from "tesseract.js";
import sharp from "sharp";

export async function ocrPdfPage(pdfPath: string, pageNumber: number): Promise<string> {
  const tempDir = os.tmpdir();
  const { fromPath } = await import("pdf2pic");
  
  const options = {
    density: 300, // Increased density for better Gemini vision
    format: "png",
    savePath: tempDir,
    width: 2000,
    height: 2000,
  };

  try {
    console.log(`[OCR] Processing page ${pageNumber} with Local Pipeline (Sharp + Tesseract)...`);
    const converter = fromPath(pdfPath, options);
    const page = await converter(pageNumber);

    if (!page.path) {
      throw new Error("Failed to generate image from PDF page");
    }

    // --- ADVANCED IMAGE PRE-PROCESSING ---
    const processedImagePath = path.join(tempDir, `processed_${path.basename(page.path)}`);
    
    await sharp(page.path)
      .grayscale() // Remove color noise
      .normalize() // Enhance contrast
      .threshold(180) // Convert to black and white for crisp edges
      .sharpen() // Sharpen the text characters
      .toFile(processedImagePath);

    const worker = await createWorker("eng");
    
    try {
      // Configure Tesseract for better local results
      await (worker as any).setParameters({
        tessedit_pageseg_mode: "1", // Automatic page segmentation with OSD
        tessedit_ocr_engine_mode: "1", // LSTM only (more accurate)
      });

      const { data: { text } } = await worker.recognize(processedImagePath);
      
      // Cleanup
      await Promise.all([
        fs.unlink(page.path).catch(() => {}),
        fs.unlink(processedImagePath).catch(() => {})
      ]);
      
      return text;
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    console.error(`[OCR] Local OCR error on page ${pageNumber}:`, error);
    return "";
  }
}
