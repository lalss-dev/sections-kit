"use client";

import { useEffect, useRef } from "react";
import type { InteractiveSize } from "./types.js";

// CursorTrail — every mousemove samples the pointer position and
// drops a dot that fades out. Throttled via rAF so it stays at one
// spawn per browser frame regardless of mouse-event rate.
//
// Skips touch devices automatically (they generate touchmove, not
// mousemove, so the listener never fires).
//
// Listener is scoped to the closest `.lp-root` ancestor of the layer
// — only mousemoves over the actual page content spawn dots.

const SIZE_PRESETS: Record<InteractiveSize, { dot: number; lifetime: number }> = {
  small:  { dot: 5,  lifetime: 500 },
  medium: { dot: 8,  lifetime: 800 },
  large:  { dot: 14, lifetime: 1200 },
};

export function CursorTrail({
  color,
  size = "medium",
}: {
  color?: string;
  size?: InteractiveSize;
} = {}) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const scope = layer.parentElement?.closest(".lp-root") ?? document;
    const preset = SIZE_PRESETS[size];

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let pending = false;

    function onMove(e: Event) {
      const me = e as MouseEvent;
      lastX = me.clientX;
      lastY = me.clientY;
      pending = true;
      if (rafId === null) rafId = requestAnimationFrame(flush);
    }
    function flush() {
      rafId = null;
      if (!pending) return;
      pending = false;
      spawn(layer!, lastX, lastY, color, preset);
    }
    scope.addEventListener("mousemove", onMove);
    return () => {
      scope.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [color, size]);

  return <div ref={layerRef} className="skit-fx-cursor-trail" aria-hidden />;
}

function spawn(
  layer: HTMLDivElement,
  x: number,
  y: number,
  color: string | undefined,
  preset: { dot: number; lifetime: number },
) {
  const dot = document.createElement("span");
  dot.className = "skit-fx-trail-dot";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  dot.style.width = `${preset.dot}px`;
  dot.style.height = `${preset.dot}px`;
  dot.style.animationDuration = `${preset.lifetime}ms`;
  if (color) {
    dot.style.background = color;
    dot.style.boxShadow = `0 0 ${preset.dot + 2}px ${color}`;
  }
  layer.appendChild(dot);
  setTimeout(() => dot.remove(), preset.lifetime);
}
