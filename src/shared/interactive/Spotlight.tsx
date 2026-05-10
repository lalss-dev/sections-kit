"use client";

import { useEffect, useMemo, useRef } from "react";
import type { InteractiveSize } from "./types.js";

// Spotlight — single soft-light circle that follows the pointer. CSS
// radial-gradient on a fixed div, position updated via translate3d
// on every mousemove (rAF coalesced). Cheaper than spawning a new DOM
// node per move (cursor-trail) since it's literally one element.
//
// Listener scoped to the closest `.lp-root` ancestor of the layer so
// editor previews don't drag the spotlight across the surrounding
// chrome.

const SIZE_PRESETS: Record<InteractiveSize, { px: number; coreAlpha: number; midAlpha: number }> = {
  small:  { px: 240, coreAlpha: 0.14, midAlpha: 0.06 },
  medium: { px: 400, coreAlpha: 0.18, midAlpha: 0.08 },
  large:  { px: 640, coreAlpha: 0.24, midAlpha: 0.11 },
};

export function Spotlight({
  color,
  size = "medium",
}: {
  color?: string;
  size?: InteractiveSize;
} = {}) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const preset = SIZE_PRESETS[size];

  // When a custom color is supplied, derive a softer + harder stop
  // from it so the radial gradient still fades out rather than
  // showing a solid disc. We let the browser parse the color via
  // a synthetic computed style so any CSS color value works.
  const inlineStyle = useMemo<React.CSSProperties>(() => {
    const half = preset.px / 2;
    const out: React.CSSProperties = {
      width: `${preset.px}px`,
      height: `${preset.px}px`,
      ["--skit-spotlight-half" as never]: `${half}px`,
    };
    if (color) {
      out.background = `radial-gradient(circle at center, ${withAlpha(color, preset.coreAlpha)} 0%, ${withAlpha(color, preset.midAlpha)} 30%, transparent 70%)`;
    } else {
      // Default purple, scaled by size preset.
      out.background = `radial-gradient(circle at center, rgba(168, 85, 247, ${preset.coreAlpha}) 0%, rgba(168, 85, 247, ${preset.midAlpha}) 30%, transparent 70%)`;
    }
    return out;
  }, [color, preset]);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;
    const scope = dot.parentElement?.closest(".lp-root") ?? document;
    const half = preset.px / 2;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    function onMove(e: Event) {
      const me = e as MouseEvent;
      lastX = me.clientX;
      lastY = me.clientY;
      if (rafId === null) rafId = requestAnimationFrame(flush);
    }
    function flush() {
      rafId = null;
      // translate3d so the compositor handles it; no layout / paint.
      dot!.style.transform = `translate3d(${lastX - half}px, ${lastY - half}px, 0)`;
    }
    scope.addEventListener("mousemove", onMove);
    return () => {
      scope.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [preset]);

  return <div ref={dotRef} className="skit-fx-spotlight" style={inlineStyle} aria-hidden />;
}

// Best-effort alpha mixer. Handles #rgb / #rrggbb / rgb()/rgba()/hsl()/hsla()
// and named colors by deferring to color-mix when the format isn't a hex.
function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}
