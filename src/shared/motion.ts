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

// motion_speed — separate knob for animation duration. "Intensity" now
// controls only distance (the visible amount of motion). Speed controls
// duration. They're orthogonal, so authors can pair "subtle" intensity
// with "slow" speed for a luxurious feel, or "dramatic" with "fast" for
// a punchy hero. Default "normal".
export const MOTION_SPEEDS = ["slow", "normal", "fast"] as const;
export type MotionSpeed = (typeof MOTION_SPEEDS)[number];

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

// Play a one-shot reveal animation on an element via the Web Animations
// API. Used by the editor when a user picks a Reveal/Intensity chip so
// they see what the effect looks like immediately. Independent of the
// scroll-driven CSS path — it just runs the same keyframes against
// duration. If the element is currently hidden / display:none, the
// animation runs but won't be visible (caller's responsibility to
// scroll the element into view first).
//
// Returns the Animation handle so callers can cancel / chain. Returns
// null if reveal === "none" or duration would be 0.
export function playRevealPreview(
  el: Element,
  reveal: Reveal,
  intensity: MotionIntensity = "normal",
  speed: MotionSpeed = "normal",
): Animation | null {
  if (reveal === "none" || intensity === "off") return null;
  if (typeof (el as HTMLElement).animate !== "function") return null;

  // Match the values motionVars(intensity, speed) emits.
  const y = INTENSITY_Y[intensity];
  const duration = SPEED_MS[speed];
  if (duration === 0) return null;

  let from: Keyframe;
  switch (reveal) {
    case "fade-up":    from = { opacity: 0, transform: `translateY(${y}px)` }; break;
    case "fade-down":  from = { opacity: 0, transform: `translateY(${-y}px)` }; break;
    case "fade-left":  from = { opacity: 0, transform: `translateX(${y * 1.5}px)` }; break;
    case "fade-right": from = { opacity: 0, transform: `translateX(${-y * 1.5}px)` }; break;
    case "scale-in":   from = { opacity: 0, transform: "scale(0.94)" }; break;
    case "blur-in":    from = { opacity: 0, filter: "blur(12px)" }; break;
    default: return null;
  }
  const to: Keyframe = { opacity: 1, transform: "none", filter: "none" };

  return (el as HTMLElement).animate([from, to], {
    duration,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    fill: "none",
  });
}

export type MotionVars = {
  "--skit-motion-y": string;
  "--skit-motion-dur": string;
  "--skit-motion-stagger": string;
  // When "off", the .lp-anim-base reveal-on-scroll baseline becomes a
  // no-op via this short-circuit on the data-attribute (see motion.css).
  "data-skit-motion": MotionIntensity;
};

// Distance map (intensity controls how far elements move).
const INTENSITY_Y: Record<MotionIntensity, number> = {
  "off": 0,
  "subtle": 8,
  "normal": 14,
  "dramatic": 32,
};
// Duration map (speed controls how long animations take).
const SPEED_MS: Record<MotionSpeed, number> = {
  "slow": 1100,
  "normal": 700,
  "fast": 400,
};
// Stagger derived from speed.
const SPEED_STAGGER: Record<MotionSpeed, number> = {
  "slow": 180,
  "normal": 100,
  "fast": 60,
};

export function motionVars(
  intensity: MotionIntensity = "normal",
  speed: MotionSpeed = "normal",
): MotionVars {
  if (intensity === "off") {
    // off short-circuits everything; values still set so children that
    // read them don't NaN.
    return {
      "--skit-motion-y": "0px",
      "--skit-motion-dur": "0ms",
      "--skit-motion-stagger": "0ms",
      "data-skit-motion": "off",
    };
  }
  return {
    "--skit-motion-y": `${INTENSITY_Y[intensity]}px`,
    "--skit-motion-dur": `${SPEED_MS[speed]}ms`,
    "--skit-motion-stagger": `${SPEED_STAGGER[speed]}ms`,
    "data-skit-motion": intensity,
  };
}

// Spread onto a React element to apply the motion CSS vars. Strips the
// data-attribute (handled separately) and casts the rest to React's
// CSSProperties shape since custom CSS vars aren't typed by default.
export function motionStyle(
  intensity: MotionIntensity = "normal",
  speed: MotionSpeed = "normal",
): React.CSSProperties {
  const v = motionVars(intensity, speed);
  return {
    ["--skit-motion-y" as never]: v["--skit-motion-y"],
    ["--skit-motion-dur" as never]: v["--skit-motion-dur"],
    ["--skit-motion-stagger" as never]: v["--skit-motion-stagger"],
  };
}

// Public maps so editors can render "Slow / Normal / Fast" labels and
// know the underlying ms (used by playRevealPreview when an explicit
// duration is needed).
export const MOTION_SPEED_MS = SPEED_MS;
export const MOTION_INTENSITY_Y = INTENSITY_Y;

// Empty type import so React's CSSProperties is in scope for motionStyle().
// We intentionally avoid `import type * from "react"` since the kit is
// peer-deps-on-react.
import type React from "react";
