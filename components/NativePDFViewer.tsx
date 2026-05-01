"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { LuChevronLeft, LuChevronRight, LuPlus, LuMinus, LuRotateCw } from "react-icons/lu";
import { cn } from "@/lib/utils";

// Initialization is handled inside the component

interface Props {
  url: string;
  refreshKey?: number;
}

export default function NativePDFViewer({ url, refreshKey = 0 }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Synchronize with the API version reported in the error (4.4.168)
      const PDFJS_VERSION = "4.4.168";
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.mjs`;
    }
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const nextPage = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const prevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const rotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-muted rounded-md disabled:opacity-30 transition-colors"
          >
            <LuChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-muted-foreground min-w-[80px] text-center">
            PAGE {pageNumber} OF {numPages || "?"}
          </span>
          <button
            onClick={nextPage}
            disabled={numPages ? pageNumber >= numPages : true}
            className="p-1.5 hover:bg-muted rounded-md disabled:opacity-30 transition-colors"
          >
            <LuChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Zoom Out"
          >
            <LuMinus className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Zoom In"
          >
            <LuPlus className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-border mx-1" />
          <button
            onClick={rotate}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Rotate"
          >
            <LuRotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 bg-card custom-scrollbar">
        <div className="relative shadow-2xl ring-1 ring-border rounded-sm bg-white overflow-hidden h-fit w-fit mx-auto">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-muted-foreground animate-pulse">PREPARING PDF...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-20 text-destructive gap-2">
                <p className="font-bold uppercase tracking-tighter">Failed to load PDF</p>
                <p className="text-xs">The file might be corrupted or private.</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              loading={null}
              renderAnnotationLayer={true}
              renderTextLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
