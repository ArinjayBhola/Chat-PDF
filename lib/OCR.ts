import fs from "fs/promises";
import os from "os";
import path from "path";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import * as pdfjs from "pdfjs-dist";
import { Canvas, Image } from "skia-canvas";

export async function ocrPdfPage(pdfPath: string, pageNumber: number): Promise<string> {
  const tempDir = os.tmpdir();
  
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");

    console.log(`[OCR] Processing page ${pageNumber} with Local Pipeline (PDF.js + Skia + Tesseract)...`);
    
    // 1. Load the PDF
    const data = await fs.readFile(pdfPath);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);

    // 2. Set up viewport and canvas
    const viewport = page.getViewport({ scale: 2.0 }); // High scale for better OCR
    const canvas = new Canvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    // 3. Render the page to canvas
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
    };
    await page.render(renderContext).promise;

    // 4. Get the image buffer
    const buffer = await canvas.toBuffer("png");
    const imagePath = path.join(tempDir, `ocr_${Date.now()}_${pageNumber}.png`);
    await fs.writeFile(imagePath, buffer);

    // 5. --- ADVANCED IMAGE PRE-PROCESSING ---
    const processedImagePath = path.join(tempDir, `processed_${path.basename(imagePath)}`);
    
    await sharp(imagePath)
      .grayscale() // Remove color noise
      .normalize() // Enhance contrast
      .threshold(180) // Convert to black and white for crisp edges
      .sharpen() // Sharpen the text characters
      .toFile(processedImagePath);

    // 6. OCR with Tesseract
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
        fs.unlink(imagePath).catch(() => {}),
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

