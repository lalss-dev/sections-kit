import type React from "react";

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
  // Premium reveals — richer animations for premium tier later. Each
  // fires once when the section enters viewport, then leaves the
  // section in its natural state. None of them perpetually animate, so
  // they don't bother reading.
  "glitch",     // RGB-split + jitter, then resolves
  "magnetic",   // overshoot bounce-in (elastic easing)
  "ripple",     // circular clip-path wipe
] as const;
export type Reveal = (typeof REVEALS)[number];

export const REVEAL_META: Record<Reveal, { label: string; description: string; tier: "free" | "premium" }> = {
  "none":       { label: "None",       description: "No reveal animation",                       tier: "free" },
  "fade-up":    { label: "Fade up",    description: "Slide up + fade in (default)",              tier: "free" },
  "fade-down":  { label: "Fade down",  description: "Slide down + fade in",                       tier: "free" },
  "fade-left":  { label: "Fade left",  description: "Slide in from right",                        tier: "free" },
  "fade-right": { label: "Fade right", description: "Slide in from left",                         tier: "free" },
  "scale-in":   { label: "Scale in",   description: "Scale up 0.94→1 + fade",                     tier: "free" },
  "blur-in":    { label: "Blur in",    description: "Defocus → focus + fade",                     tier: "free" },
  "glitch":     { label: "Glitch",     description: "RGB-split + jitter resolves into section",   tier: "premium" },
  "magnetic":   { label: "Magnetic",   description: "Overshoot bounce-in with elastic easing",    tier: "premium" },
  "ripple":     { label: "Ripple",     description: "Circular wipe reveals the section",          tier: "premium" },
};

// CSS class name for a given reveal. `none` returns null so consumers
// can skip applying any class. Also returns null for any value not in
// the current REVEALS list — protects against orphaned classes from
// removed reveals (e.g. saved pages with reveal="swarm" after swarm
// was deprecated would otherwise emit a dead skit-reveal-swarm class).
export function revealClass(r: Reveal | undefined): string | null {
  if (!r || r === "none") return null;
  if (!REVEALS.includes(r)) return null;
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

  // Each reveal demos via the same keyframes the CSS path uses, just
  // run on a fixed duration instead of scroll-tied. Premium reveals
  // each get their own multi-stop keyframes / easing so the demo
  // looks like the real thing.
  switch (reveal) {
    case "fade-up":
      return (el as HTMLElement).animate(
        [{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: "none" }],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
      );
    case "fade-down":
      return (el as HTMLElement).animate(
        [{ opacity: 0, transform: `translateY(${-y}px)` }, { opacity: 1, transform: "none" }],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
      );
    case "fade-left":
      return (el as HTMLElement).animate(
        [{ opacity: 0, transform: `translateX(${y * 1.5}px)` }, { opacity: 1, transform: "none" }],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
      );
    case "fade-right":
      return (el as HTMLElement).animate(
        [{ opacity: 0, transform: `translateX(${-y * 1.5}px)` }, { opacity: 1, transform: "none" }],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
      );
    case "scale-in":
      return (el as HTMLElement).animate(
        [{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "scale(1)" }],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
      );
    case "blur-in":
      return (el as HTMLElement).animate(
        [{ opacity: 0, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0)" }],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
      );
    case "glitch":
      // RGB split + jitter + hue rotation. text-shadow only renders on
      // text descendants but the transform/filter still convey the
      // glitch feel on any section.
      return (el as HTMLElement).animate(
        [
          { offset: 0,    opacity: 0, transform: "translateX(-6px)", filter: "hue-rotate(60deg) saturate(2) contrast(1.4)" },
          { offset: 0.2,  opacity: 1, transform: "translateX(8px)",  filter: "hue-rotate(-60deg) saturate(2) contrast(1.4)" },
          { offset: 0.4,  transform: "translateX(-3px)", filter: "hue-rotate(40deg)" },
          { offset: 0.6,  transform: "translateX(2px)",  filter: "hue-rotate(-20deg)" },
          { offset: 0.8,  transform: "translateX(0)",    filter: "none" },
          { offset: 1,    opacity: 1, transform: "none",  filter: "none" },
        ],
        { duration, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "none" },
      );
    case "magnetic":
      return (el as HTMLElement).animate(
        [
          { opacity: 0, transform: `translateY(${y * 2.5}px) scale(0.85)` },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        // Elastic overshoot — the same cubic-bezier the CSS path uses.
        { duration, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "none" },
      );
    case "ripple":
      return (el as HTMLElement).animate(
        [
          { offset: 0,   opacity: 0, clipPath: "circle(0% at 50% 50%)" },
          { offset: 0.6, opacity: 1, clipPath: "circle(60% at 50% 50%)" },
          { offset: 1,   opacity: 1, clipPath: "circle(150% at 50% 50%)" },
        ],
        { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
      );
    default:
      return null;
  }
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
// Duration map. Each tier deliberately distinct in absolute terms,
// not just ratio. Bilal feedback 2026-05-11: the old 8x ratio
// (2000/750/250ms) read as "all kind of fast" — fast tier wasn't
// snappy enough, normal wasn't deliberate enough, slow wasn't
// cinematic. Re-tuned to:
//   fast=60ms — near-instant, reads as a UI flick
//   normal=1800ms — clearly deliberate animation the eye can read
//   slow=6000ms — cinematic crawl
// 100x ratio between fast and slow. CRM/PoS/Lakon link-page +
// landing-page consumers each carried their own consumer-side
// override (LPG_SPEED_DUR_MS / LND_SPEED_DUR_MS); fixing the
// SOURCE means all 3 inherit the right values for free.
const SPEED_MS: Record<MotionSpeed, number> = {
  "slow": 6000,
  "normal": 1800,
  "fast": 60,
};
// Stagger derived from speed (per-section reveal delay multiplier).
const SPEED_STAGGER: Record<MotionSpeed, number> = {
  "slow": 700,
  "normal": 240,
  "fast": 8,
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
// duration is needed). Editors also use MOTION_SPEED_STAGGER_MS when
// staggering the chip-pick demo across multiple sections so the
// stagger scales with speed (slow stagger is much wider than fast).
export const MOTION_SPEED_MS = SPEED_MS;
export const MOTION_SPEED_STAGGER_MS = SPEED_STAGGER;
export const MOTION_INTENSITY_Y = INTENSITY_Y;

