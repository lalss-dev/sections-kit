import * as React from "react";
import type { AnimationProps, AnimationPreset } from "./types.js";

// CSS/SVG preset library — six self-contained animations modeled on the
// most popular Lottie content (loading dots, success checks, sparkles,
// confetti, pulse hearts, rocket launches). No JS deps; everything is
// CSS keyframes + inline SVG.
//
// All presets honor:
//   --skit-anim-color   resolved from props.color || currentColor
//   --skit-anim-size    set on the host wrapper to props.height_px
//
// CSS lives next door in presets.css and is namespaced under
// .skit-anim-preset so it can't bleed into the host page.

export function PresetRender({ props }: { props: AnimationProps }) {
  const preset: AnimationPreset = props.preset ?? "sparkle";
  const height = props.height_px ?? 360;
  const color = props.color || undefined;
  const style: React.CSSProperties = {
    height,
    ["--skit-anim-color" as never]: color || "var(--skit-anim-default-color, currentColor)",
  };

  return (
    <div className="skit-anim-preset" data-preset={preset} style={style}>
      {preset === "sparkle" && <Sparkle />}
      {preset === "orbit" && <Orbit />}
      {preset === "confetti" && <Confetti />}
      {preset === "checkmark" && <Checkmark />}
      {preset === "pulse" && <Pulse />}
      {preset === "rocket" && <Rocket />}
    </div>
  );
}

// ---------- Individual presets ----------

function Sparkle() {
  // Three stars, each at a different scale and rotation phase so the
  // cluster reads as alive. transform-origin: 50% 50% is implicit on
  // SVG <g>.
  return (
    <svg viewBox="0 0 240 240" className="skit-anim-svg" aria-hidden>
      <g className="skit-sparkle-star skit-sparkle-star-a">
        <path d="M120 30 L132 105 L210 120 L132 135 L120 210 L108 135 L30 120 L108 105 Z" />
      </g>
      <g className="skit-sparkle-star skit-sparkle-star-b">
        <path d="M180 60 L188 95 L222 100 L188 105 L180 140 L172 105 L138 100 L172 95 Z" />
      </g>
      <g className="skit-sparkle-star skit-sparkle-star-c">
        <path d="M60 170 L66 196 L92 200 L66 204 L60 230 L54 204 L28 200 L54 196 Z" />
      </g>
    </svg>
  );
}

function Orbit() {
  // Big center dot + a small dot circling on a 240px-wide orbit.
  return (
    <svg viewBox="0 0 240 240" className="skit-anim-svg" aria-hidden>
      <circle cx="120" cy="120" r="32" className="skit-orbit-center" />
      <g className="skit-orbit-spinner">
        <circle cx="120" cy="40" r="12" className="skit-orbit-moon" />
      </g>
      <circle
        cx="120"
        cy="120"
        r="80"
        className="skit-orbit-ring"
        fill="none"
      />
    </svg>
  );
}

function Confetti() {
  // 14 colored squares falling and spinning at different speeds. Each
  // gets a custom-property delay/x-offset/color so the keyframes share
  // one rule.
  const pieces = Array.from({ length: 14 }).map((_, i) => {
    const x = (i / 13) * 100; // 0..100% across the width
    const delay = (i % 7) * 0.3; // staggered cascade
    const dur = 2.8 + (i % 5) * 0.4; // 2.8..4.4s
    const hue = (i * 53) % 360; // spread around the wheel
    return (
      <span
        key={i}
        className="skit-confetti-piece"
        style={{
          left: `${x}%`,
          ["--skit-confetti-delay" as never]: `${delay}s`,
          ["--skit-confetti-dur" as never]: `${dur}s`,
          ["--skit-confetti-hue" as never]: hue,
        }}
      />
    );
  });
  return <div className="skit-confetti-stage">{pieces}</div>;
}

function Checkmark() {
  // SVG circle outline draws clockwise, then check path strokes from
  // top-left to bottom-right. Both via stroke-dasharray + dashoffset
  // animation. pathLength=100 normalizes the geometry math.
  return (
    <svg viewBox="0 0 240 240" className="skit-anim-svg" aria-hidden>
      <circle
        cx="120"
        cy="120"
        r="96"
        className="skit-check-ring"
        fill="none"
        pathLength={100}
      />
      <path
        d="M68 124 L106 162 L172 90"
        className="skit-check-path"
        fill="none"
        pathLength={100}
      />
    </svg>
  );
}

function Pulse() {
  // Three concentric circles expanding and fading like a sonar ping.
  return (
    <svg viewBox="0 0 240 240" className="skit-anim-svg" aria-hidden>
      <circle cx="120" cy="120" r="20" className="skit-pulse-core" />
      <circle cx="120" cy="120" r="20" className="skit-pulse-wave skit-pulse-wave-a" fill="none" />
      <circle cx="120" cy="120" r="20" className="skit-pulse-wave skit-pulse-wave-b" fill="none" />
      <circle cx="120" cy="120" r="20" className="skit-pulse-wave skit-pulse-wave-c" fill="none" />
    </svg>
  );
}

function Rocket() {
  // Rocket body bobs up; smoke trail puffs below. Two SVG groups so
  // they animate independently. Body translate + rotate slight wobble;
  // smoke uses an opacity stagger across three puffs.
  return (
    <svg viewBox="0 0 240 240" className="skit-anim-svg" aria-hidden>
      <g className="skit-rocket-body">
        {/* Hull */}
        <path
          d="M120 30 C146 30 162 70 162 110 L78 110 C78 70 94 30 120 30 Z"
          className="skit-rocket-fill"
        />
        {/* Window */}
        <circle cx="120" cy="78" r="14" className="skit-rocket-window" />
        {/* Fins */}
        <path
          d="M78 110 L60 140 L78 138 Z"
          className="skit-rocket-fin"
        />
        <path
          d="M162 110 L180 140 L162 138 Z"
          className="skit-rocket-fin"
        />
        {/* Flame */}
        <path
          d="M104 138 Q120 178 136 138 Q126 152 120 158 Q114 152 104 138 Z"
          className="skit-rocket-flame"
        />
      </g>
      <g className="skit-rocket-smoke">
        <circle cx="100" cy="190" r="14" className="skit-smoke-puff skit-smoke-puff-a" />
        <circle cx="120" cy="200" r="18" className="skit-smoke-puff skit-smoke-puff-b" />
        <circle cx="140" cy="190" r="14" className="skit-smoke-puff skit-smoke-puff-c" />
      </g>
    </svg>
  );
}
