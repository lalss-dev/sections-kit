"use client";

import { useEffect, useRef } from "react";

// ClickSparkle — every click on the page spawns 12 small dots from the
// click point that fly outward in random directions and fade. Pure
// DOM via document-attached overlay; no React state, no canvas (so
// the burst doesn't compete with the host's React rendering).

const PARTICLE_COUNT = 12;
const PARTICLE_LIFETIME = 700;

export function ClickSparkle() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    function onClick(e: MouseEvent) {
      // Skip clicks on form inputs / interactive controls so the
      // sparkle doesn't fire on every text-input keystroke focus.
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [role='button']")) return;
      spawn(layer!, e.clientX, e.clientY);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return <div ref={layerRef} className="skit-fx-click-sparkle" aria-hidden />;
}

function spawn(layer: HTMLDivElement, x: number, y: number) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const dot = document.createElement("span");
    dot.className = "skit-fx-spark";
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 40 + Math.random() * 50;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const hue = Math.floor(Math.random() * 360);
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.setProperty("--sx", `${dx}px`);
    dot.style.setProperty("--sy", `${dy}px`);
    dot.style.background = `hsl(${hue}, 90%, 65%)`;
    dot.style.boxShadow = `0 0 8px hsl(${hue}, 90%, 65%)`;
    layer.appendChild(dot);
    setTimeout(() => dot.remove(), PARTICLE_LIFETIME);
  }
}
