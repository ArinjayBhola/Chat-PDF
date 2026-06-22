// UI REDESIGN
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LuBrain,
  LuLoaderCircle,
  LuRefreshCw,
  LuMinus,
  LuPlus,
  LuMaximize,
  LuX,
} from "react-icons/lu";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type MindNode = {
  label: string;
  page?: number;
  summary?: string;
  children?: MindNode[];
};

type Props = {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
};

type LaidOutNode = MindNode & {
  id: string;
  depth: number;
  x: number;
  y: number;
  parentId?: string;
};

const STORAGE_KEY = (chatId: string) => `mindmap:${chatId}`;

// Tree layout constants
const X_GAP = 240;
const Y_GAP = 64;
const NODE_W = 200;
const NODE_H = 56;

function layoutTree(root: MindNode): { nodes: LaidOutNode[]; width: number; height: number } {
  const nodes: LaidOutNode[] = [];
  let nextLeafY = 0;

  const walk = (node: MindNode, depth: number, parentId: string | undefined, idx: number): LaidOutNode => {
    const id = `${parentId ?? "root"}-${idx}`;
    const x = depth * X_GAP;

    if (!node.children || node.children.length === 0) {
      const y = nextLeafY * Y_GAP;
      nextLeafY += 1;
      const laid: LaidOutNode = {
        ...node,
        id,
        depth,
        x,
        y,
        parentId,
      };
      nodes.push(laid);
      return laid;
    }

    const childLaid: LaidOutNode[] = node.children.map((c, i) => walk(c, depth + 1, id, i));
    const minY = childLaid[0].y;
    const maxY = childLaid[childLaid.length - 1].y;
    const y = (minY + maxY) / 2;

    const laid: LaidOutNode = {
      ...node,
      id,
      depth,
      x,
      y,
      parentId,
    };
    nodes.push(laid);
    return laid;
  };

  walk(root, 0, undefined, 0);

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const width = (Math.max(...xs) - Math.min(...xs)) + NODE_W + 80;
  const height = (Math.max(...ys) - Math.min(...ys)) + NODE_H + 80;
  return { nodes, width, height };
}

const DEPTH_COLOR = [
  { fill: "var(--primary)", text: "var(--primary-foreground)", ring: "var(--primary)" },
  { fill: "color-mix(in oklab, var(--primary) 18%, var(--background))", text: "var(--foreground)", ring: "color-mix(in oklab, var(--primary) 60%, transparent)" },
  { fill: "var(--muted)", text: "var(--foreground)", ring: "var(--border)" },
];

export default function MindMapDialog({ chatId, isOpen, onClose, fileName }: Props) {
  const [loading, setLoading] = useState(false);
  const [mindmap, setMindmap] = useState<MindNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<LaidOutNode | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Try cache first when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setHovered(null);
    if (mindmap) return;
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY(chatId));
      if (cached) {
        setMindmap(JSON.parse(cached));
        return;
      }
    } catch {}
    void generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const generate = useCallback(
    async (regenerate: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/mindmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId }),
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to generate mind map");
        }
        const mm = data.mindmap as MindNode;
        setMindmap(mm);
        try {
          sessionStorage.setItem(STORAGE_KEY(chatId), JSON.stringify(mm));
        } catch {}
        if (regenerate) toast.success("Mind map regenerated");
      } catch (e: any) {
        const msg = e?.message || "Failed to generate mind map";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [chatId]
  );

  const layout = useMemo(() => (mindmap ? layoutTree(mindmap) : null), [mindmap]);

  const handleNodeClick = (node: LaidOutNode) => {
    if (!node.page) {
      onClose();
      return;
    }
    window.dispatchEvent(
      new CustomEvent("pdf-jump-to-page", {
        detail: { chatId, page: node.page },
      })
    );
    onClose();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setScale((s) => Math.max(0.3, Math.min(2.5, s + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-mindmap-node]")) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStart.current) return;
    setPan({
      x: panStart.current.px + (e.clientX - panStart.current.x),
      y: panStart.current.py + (e.clientY - panStart.current.y),
    });
  };

  const stopPan = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  const recenter = () => {
    setScale(1);
    setPan({ x: 40, y: 40 });
  };

  // Reset cache when explicitly regenerating
  const handleRegenerate = async () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY(chatId));
    } catch {}
    setMindmap(null);
    await generate(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="!max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <LuBrain className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold tracking-tight truncate">
                Mind Map
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {fileName || "Document"} · click any node to jump to that page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border">
              <button
                onClick={() => setScale((s) => Math.max(0.3, s - 0.15))}
                className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Zoom out"
              >
                <LuMinus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-muted-foreground w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
                className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Zoom in"
              >
                <LuPlus className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-border mx-0.5" />
              <button
                onClick={recenter}
                className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Recenter"
              >
                <LuMaximize className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={loading}
              className="h-8 px-2.5 rounded-lg text-xs font-semibold"
              title="Regenerate"
            >
              <LuRefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Close"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
          className={cn(
            "flex-1 relative overflow-hidden bg-muted/40",
            isPanning ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          {loading && !mindmap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-md">
                  <LuBrain className="w-7 h-7 text-primary" />
                </div>
                <LuLoaderCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-primary animate-spin bg-background rounded-full p-0.5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Building your mind map…</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reading the document and extracting key concepts.
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-6">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <LuX className="w-7 h-7 text-destructive" />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-sm font-bold text-foreground">Could not generate mind map</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={() => generate(true)} size="sm" className="h-8 text-xs">
                <LuRefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Try again
              </Button>
            </div>
          )}

          {layout && (
            <div
              className="absolute top-0 left-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "0 0",
                transition: isPanning ? "none" : "transform 0.18s ease-out",
                willChange: "transform",
              }}
            >
              <svg
                width={layout.width}
                height={layout.height}
                className="block overflow-visible"
              >
                {/* Edges */}
                {layout.nodes.map((n) => {
                  if (!n.parentId) return null;
                  const parent = layout.nodes.find((p) => p.id === n.parentId);
                  if (!parent) return null;
                  const x1 = parent.x + NODE_W;
                  const y1 = parent.y + NODE_H / 2;
                  const x2 = n.x;
                  const y2 = n.y + NODE_H / 2;
                  const mx = (x1 + x2) / 2;
                  return (
                    <path
                      key={`e-${n.id}`}
                      d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth={1.6}
                      className="opacity-80"
                    />
                  );
                })}

                {/* Nodes */}
                {layout.nodes.map((n) => {
                  const palette = DEPTH_COLOR[Math.min(n.depth, DEPTH_COLOR.length - 1)];
                  const isLeaf = !n.children || n.children.length === 0;
                  return (
                    <g
                      key={n.id}
                      data-mindmap-node
                      transform={`translate(${n.x}, ${n.y})`}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered((h) => (h?.id === n.id ? null : h))}
                      onClick={() => handleNodeClick(n)}
                      style={{ cursor: "pointer" }}
                      className="group"
                    >
                      <rect
                        width={NODE_W}
                        height={NODE_H}
                        rx={12}
                        ry={12}
                        fill={palette.fill}
                        stroke={palette.ring}
                        strokeWidth={n.depth === 0 ? 2 : 1.2}
                        className="transition-all duration-150 group-hover:opacity-90"
                        style={{
                          filter:
                            n.depth === 0
                              ? "drop-shadow(0 4px 12px color-mix(in oklab, var(--primary) 35%, transparent))"
                              : "drop-shadow(0 1px 3px rgba(0,0,0,0.08))",
                        }}
                      />
                      <foreignObject x={10} y={6} width={NODE_W - 20} height={NODE_H - 12}>
                        <div
                          // @ts-ignore - xmlns is fine on a div inside foreignObject
                          xmlns="http://www.w3.org/1999/xhtml"
                          style={{
                            color: palette.text,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            overflow: "hidden",
                            fontFamily: "inherit",
                          }}
                        >
                          <div
                            style={{
                              fontSize: n.depth === 0 ? 13 : 12,
                              fontWeight: 700,
                              lineHeight: 1.2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {n.label}
                          </div>
                          {n.page && (
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                opacity: 0.75,
                                marginTop: 2,
                                letterSpacing: 0.4,
                                textTransform: "uppercase",
                              }}
                            >
                              {isLeaf ? "→ " : ""}Page {n.page}
                            </div>
                          )}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Hover summary card */}
          {hovered?.summary && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-md pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="bg-background/95 backdrop-blur border border-border rounded-xl shadow-xl px-4 py-3">
                <p className="text-xs font-bold text-foreground">{hovered.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{hovered.summary}</p>
              </div>
            </div>
          )}

          {/* Hint footer */}
          {layout && !error && (
            <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground/70 font-medium select-none pointer-events-none">
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">Ctrl</kbd>
              {" + scroll to zoom · drag to pan"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
