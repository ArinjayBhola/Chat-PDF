"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  storageKey?: string;
  className?: string;
};

const ResizableSplit = ({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 60,
  minLeftWidth = 30,
  minRightWidth = 30,
  storageKey,
  className,
}: Props) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Load saved position from localStorage
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) {
          setLeftWidth(parsed);
        }
      }
    }
  }, [storageKey]);

  // Save position to localStorage
  const savePosition = useCallback(
    (width: number) => {
      if (storageKey && typeof window !== "undefined") {
        localStorage.setItem(storageKey, width.toString());
      }
    },
    [storageKey],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate new width as percentage
      let newLeftWidth = (mouseX / containerWidth) * 100;

      // Apply constraints
      newLeftWidth = Math.max(minLeftWidth, Math.min(100 - minRightWidth, newLeftWidth));

      setLeftWidth(newLeftWidth);
    },
    [minLeftWidth, minRightWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      setLeftWidth((currentWidth) => {
        savePosition(currentWidth);
        return currentWidth;
      });
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [savePosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn("flex w-full h-full overflow-hidden", className)}>
      {/* Left Panel */}
      <div
        className="h-full overflow-hidden transition-none"
        style={{ width: `${leftWidth}%` }}>
        {leftPanel}
      </div>

      {/* Draggable Divider */}
      <div
        className={cn(
          "relative w-1 h-full bg-slate-300 dark:bg-slate-600 cursor-col-resize flex-shrink-0 group",
          "hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors duration-200",
          isDragging && "bg-blue-500 dark:bg-blue-400",
        )}
        onMouseDown={handleMouseDown}>
        {/* Visual indicator on hover */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-1 h-16 bg-slate-400 dark:bg-slate-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
            isDragging && "opacity-100 bg-blue-500 dark:bg-blue-400",
          )}
        />

        {/* Wider hit area for easier grabbing */}
        <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
      </div>

      {/* Right Panel */}
      <div
        className="h-full overflow-hidden transition-none"
        style={{ width: `${100 - leftWidth}%` }}>
        {rightPanel}
      </div>
    </div>
  );
};

export default ResizableSplit;
