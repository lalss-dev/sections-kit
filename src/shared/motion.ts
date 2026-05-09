// motion_intensity — one knob that scales reveal-on-scroll animations
// across every kit section. Lives at the page-level (consumers stamp
// it on their root container) AND at the per-section level (per-section
// overrides are applied via inline style on the section wrapper).
//
// Drives three CSS variables used by the .skit-reveal-* classes:
//   --skit-motion-y      translate distance during fade-in (px)
//   --skit-motion-dur    transition duration (ms)
//   --skit-motion-stagger between-section delay multiplier (ms)
//
// "off" sets opacity:1 + transform:none + transition:none on the
// reveal class so animations are fully disabled (also matches the
// prefers-reduced-motion media query). Useful for accessibility and
// for clients who hate motion.

export const MOTION_INTENSITIES = ["off", "subtle", "normal", "dramatic"] as const;
export type MotionIntensity = (typeof MOTION_INTENSITIES)[number];

// reveal — per-section enter-the-viewport animation type. Implemented
// via CSS scroll-driven animations (animation-timeline: view()) on
// modern browsers (Chrome 115+, Safari 26+, Firefox 130+) with
// IntersectionObserver `.in-view` fallback for older browsers.
//
// "none" opts out entirely — useful for sections that already animate
// (like the kit's own animation section), or for the "Off" page-level
// motion intensity.
//
// Effects modeled on what landing pages actually use in production:
//   fade-up      — modern default; gentle slide up + fade
//   fade-down    — slide DOWN + fade (hero callouts, banners)
//   fade-left    — slide in from right (left-aligned content)
//   fade-right   — slide in from left (right-aligned content)
//   scale-in     — scale 0.94 → 1 + fade (hero / featured)
//   blur-in      — filter blur(12px) → 0 + fade (premium feel)
export const REVEALS = [
  "none",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
  "scale-in",
  "blur-in",
] as const;
export type Reveal = (typeof REVEALS)[number];

export const REVEAL_META: Record<Reveal, { label: string; description: string }> = {
  "none": { label: "None", description: "No reveal animation" },
  "fade-up": { label: "Fade up", description: "Slide up + fade in (default)" },
  "fade-down": { label: "Fade down", description: "Slide down + fade in" },
  "fade-left": { label: "Fade left", description: "Slide in from right" },
  "fade-right": { label: "Fade right", description: "Slide in from left" },
  "scale-in": { label: "Scale in", description: "Scale up 0.94→1 + fade" },
  "blur-in": { label: "Blur in", description: "Defocus → focus + fade" },
};

// CSS class name for a given reveal. `none` returns null so consumers
// can skip applying any class.
export function revealClass(r: Reveal | undefined): string | null {
  if (!r || r === "none") return null;
  return `skit-reveal-${r}`;
}

export type MotionVars = {
  "--skit-motion-y": string;
  "--skit-motion-dur": string;
  "--skit-motion-stagger": string;
  // When "off", the .lp-anim-base reveal-on-scroll baseline becomes a
  // no-op via this short-circuit on the data-attribute (see motion.css).
  "data-skit-motion": MotionIntensity;
};

export function motionVars(intensity: MotionIntensity = "normal"): MotionVars {
  switch (intensity) {
    case "off":
      // values still set so children that read them don't NaN; the
      // data-attribute short-circuit kills the transition.
      return {
        "--skit-motion-y": "0px",
        "--skit-motion-dur": "0ms",
        "--skit-motion-stagger": "0ms",
        "data-skit-motion": "off",
      };
    case "subtle":
      return {
        "--skit-motion-y": "8px",
        "--skit-motion-dur": "500ms",
        "--skit-motion-stagger": "60ms",
        "data-skit-motion": "subtle",
      };
    case "dramatic":
      return {
        "--skit-motion-y": "32px",
        "--skit-motion-dur": "1100ms",
        "--skit-motion-stagger": "180ms",
        "data-skit-motion": "dramatic",
      };
    case "normal":
    default:
      return {
        "--skit-motion-y": "14px",
        "--skit-motion-dur": "700ms",
        "--skit-motion-stagger": "100ms",
        "data-skit-motion": "normal",
      };
  }
}

// Spread onto a React element to apply the motion CSS vars. Strips the
// data-attribute (handled separately) and casts the rest to React's
// CSSProperties shape since custom CSS vars aren't typed by default.
export function motionStyle(intensity: MotionIntensity = "normal"): React.CSSProperties {
  const v = motionVars(intensity);
  return {
    ["--skit-motion-y" as never]: v["--skit-motion-y"],
    ["--skit-motion-dur" as never]: v["--skit-motion-dur"],
    ["--skit-motion-stagger" as never]: v["--skit-motion-stagger"],
  };
}

// Empty type import so React's CSSProperties is in scope for motionStyle().
// We intentionally avoid `import type * from "react"` since the kit is
// peer-deps-on-react.
import type React from "react";
