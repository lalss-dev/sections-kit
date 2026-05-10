"use client";

import { useEffect, useRef } from "react";
import type { InteractiveSize } from "./types.js";

// ClickSparkle — every click on the page spawns particles from the
// click point that fly outward in random directions and fade. Pure
// DOM via document-attached overlay; no React state, no canvas (so
// the burst doesn't compete with the host's React rendering).
//
// Listener is scoped to the closest `.lp-root` ancestor of the layer
// so editor previews don't fire sparkles when the user clicks chrome
// outside the canvas.

const PARTICLE_LIFETIME = 700;

const SIZE_PRESETS: Record<InteractiveSize, { count: number; dot: number; spread: number }> = {
  small:  { count: 8,  dot: 4, spread: 35 },
  medium: { count: 12, dot: 6, spread: 65 },
  large:  { count: 18, dot: 9, spread: 110 },
};

export function ClickSparkle({
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
    function onClick(e: Event) {
      const me = e as MouseEvent;
      // Skip clicks on form inputs / interactive controls so the
      // sparkle doesn't fire on every text-input keystroke focus.
      const target = me.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [role='button']")) return;
      spawn(layer!, me.clientX, me.clientY, color, preset);
    }
    scope.addEventListener("click", onClick);
    return () => scope.removeEventListener("click", onClick);
  }, [color, size]);

  return <div ref={layerRef} className="skit-fx-click-sparkle" aria-hidden />;
}

function spawn(
  layer: HTMLDivElement,
  x: number,
  y: number,
  color: string | undefined,
  preset: { count: number; dot: number; spread: number },
) {
  for (let i = 0; i < preset.count; i++) {
    const dot = document.createElement("span");
    dot.className = "skit-fx-spark";
    const angle = (i / preset.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = preset.spread * 0.6 + Math.random() * preset.spread * 0.5;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const fill = color ?? `hsl(${Math.floor(Math.random() * 360)}, 90%, 65%)`;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.width = `${preset.dot}px`;
    dot.style.height = `${preset.dot}px`;
    dot.style.setProperty("--sx", `${dx}px`);
    dot.style.setProperty("--sy", `${dy}px`);
    dot.style.background = fill;
    dot.style.boxShadow = `0 0 ${preset.dot + 2}px ${fill}`;
    layer.appendChild(dot);
    setTimeout(() => dot.remove(), PARTICLE_LIFETIME);
  }
}
