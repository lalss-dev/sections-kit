"use client";

import { useEffect, useMemo, useRef } from "react";

// Spotlight — single soft-light circle that follows the pointer. CSS
// radial-gradient on a fixed div, position updated via translate3d
// on every mousemove (rAF coalesced). Cheaper than spawning a new DOM
// node per move (cursor-trail) since it's literally one element.
//
// Listener scoped to the closest `.lp-root` ancestor of the layer so
// editor previews don't drag the spotlight across the surrounding
// chrome.

export function Spotlight({ color }: { color?: string } = {}) {
  const dotRef = useRef<HTMLDivElement | null>(null);

  // When a custom color is supplied, derive a softer + harder stop
  // from it so the radial gradient still fades out rather than
  // showing a solid disc. We let the browser parse the color via
  // a synthetic computed style so any CSS color value works.
  const inlineGradient = useMemo(() => {
    if (!color) return undefined;
    return `radial-gradient(circle at center, ${withAlpha(color, 0.18)} 0%, ${withAlpha(color, 0.08)} 30%, transparent 70%)`;
  }, [color]);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;
    const scope = dot.parentElement?.closest(".lp-root") ?? document;

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
      dot!.style.transform = `translate3d(${lastX - 200}px, ${lastY - 200}px, 0)`;
    }
    scope.addEventListener("mousemove", onMove);
    return () => {
      scope.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      className="skit-fx-spotlight"
      style={inlineGradient ? { background: inlineGradient } : undefined}
      aria-hidden
    />
  );
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
