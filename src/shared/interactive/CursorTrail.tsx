"use client";

import { useEffect, useRef } from "react";

// CursorTrail — every mousemove samples the pointer position and
// drops a dot that fades out. Throttled via rAF so it stays at one
// spawn per browser frame regardless of mouse-event rate.
//
// Skips touch devices automatically (they generate touchmove, not
// mousemove, so the listener never fires).

const LIFETIME = 800;

export function CursorTrail() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let pending = false;

    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      pending = true;
      if (rafId === null) rafId = requestAnimationFrame(flush);
    }
    function flush() {
      rafId = null;
      if (!pending) return;
      pending = false;
      spawn(layer!, lastX, lastY);
    }
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={layerRef} className="skit-fx-cursor-trail" aria-hidden />;
}

function spawn(layer: HTMLDivElement, x: number, y: number) {
  const dot = document.createElement("span");
  dot.className = "skit-fx-trail-dot";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  layer.appendChild(dot);
  setTimeout(() => dot.remove(), LIFETIME);
}
