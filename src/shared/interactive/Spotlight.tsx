"use client";

import { useEffect, useRef } from "react";

// Spotlight — single soft-light circle that follows the pointer. CSS
// radial-gradient on a fixed div, position updated via translate3d
// on every mousemove (rAF coalesced). Cheaper than spawning a new DOM
// node per move (cursor-trail) since it's literally one element.

export function Spotlight() {
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(flush);
    }
    function flush() {
      rafId = null;
      // translate3d so the compositor handles it; no layout / paint.
      dot!.style.transform = `translate3d(${lastX - 200}px, ${lastY - 200}px, 0)`;
    }
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={dotRef} className="skit-fx-spotlight" aria-hidden />;
}
