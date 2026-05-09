"use client";

import { useEffect, useRef } from "react";

// Matrix rain — the iconic Wachowski-green character cascade. Done
// on a <canvas> because thousands of moving glyphs as DOM elements
// would melt low-end devices. Single requestAnimationFrame loop;
// each "column" is a y-offset that ticks down, drawing a new char at
// the head and fading older chars by re-painting a translucent
// black rectangle each frame (the canonical trick).
//
// Respects prefers-reduced-motion — pauses the loop entirely.

const CHARS = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789";
const FONT_SIZE = 14;

export function Matrix() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = typeof window !== "undefined"
      && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Render one static frame so the user still sees the effect's
      // aesthetic but no animation runs.
      sizeCanvas(canvas);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    sizeCanvas(canvas);
    let cols = Math.floor(canvas.width / FONT_SIZE);
    let drops: number[] = Array(cols).fill(1);

    function onResize() {
      sizeCanvas(canvas!);
      cols = Math.floor(canvas!.width / FONT_SIZE);
      drops = Array(cols).fill(1);
    }
    window.addEventListener("resize", onResize);

    let rafId = 0;
    function tick() {
      // Translucent black rect — fades older chars without fully
      // erasing the canvas. Lower alpha = longer trail.
      ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      ctx!.fillStyle = "#0F0";
      ctx!.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const ch = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;
        ctx!.fillText(ch, x, y);

        // Reset to top-ish randomly when past bottom; otherwise step.
        if (y > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="skit-fx-matrix" aria-hidden>
      <canvas ref={canvasRef} className="skit-fx-matrix-canvas" />
    </div>
  );
}

function sizeCanvas(c: HTMLCanvasElement) {
  // Use the layout-box size, not the window size, so the canvas
  // hugs whatever container the host puts it in. The kit's CSS sets
  // the wrapper to position:fixed inset:0, so this resolves to
  // viewport-sized — but that's the host's choice.
  const rect = c.getBoundingClientRect();
  c.width = Math.floor(rect.width || window.innerWidth);
  c.height = Math.floor(rect.height || window.innerHeight);
}
