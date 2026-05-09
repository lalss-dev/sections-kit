import type React from "react";
import { SWARM_SEEDS, spawnSwarmParticles } from "./swarm-reveal.js";

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
  "swarm",      // ~30 butterflies converge into the section position
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
  "swarm":      { label: "Butterflies", description: "Dozens of butterflies converge into form",  tier: "premium" },
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
    case "swarm":
      // Mount 30 butterfly sprites on the section, run the converge
      // animation per-particle via WAAPI, then clean up. This makes
      // the chip-pick demo show the actual "thousand butterflies
      // become one" effect (same shape as the live render).
      return playSwarmDemo(el as HTMLElement, duration);
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
// Duration map (speed controls how long animations take). The range is
// intentionally wide (8x slow:fast) so the perceptual difference is
// obvious on high-refresh-rate monitors where smooth animations feel
// faster than they are. Slow = luxurious; fast = snappy.
const SPEED_MS: Record<MotionSpeed, number> = {
  "slow": 2000,
  "normal": 750,
  "fast": 250,
};
// Stagger derived from speed.
const SPEED_STAGGER: Record<MotionSpeed, number> = {
  "slow": 280,
  "normal": 100,
  "fast": 30,
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

// Editor-side demo for the swarm reveal. Spawns ~80 glowing-dot sprites
// inside `el`, animates each via WAAPI through a curved arc (spawn →
// per-particle midpoint → center) matching the live CSS, then removes
// the sprites once the animation settles. Returns the section
// animation handle so callers can chain.
//
// Why WAAPI per-particle instead of toggling the .in-view class?
// In the editor preview, the section may not have the
// .skit-reveal-swarm class on it (revealCls is suppressed in
// previewMode to avoid the "outside box" effect). WAAPI is
// independent — works regardless of CSS class state. We also briefly
// swap the section's position to "relative" so the absolute-
// positioned sprites anchor to the section bounds.
export function playSwarmDemo(el: HTMLElement, baseDuration = 1800): Animation | null {
  if (typeof document === "undefined") return null;
  if (typeof (el as HTMLElement).animate !== "function") return null;
  const swarmDur = Math.max(1200, baseDuration * 1.6);

  // Anchor for absolute children. Restore on cleanup.
  const prevPos = el.style.position;
  if (getComputedStyle(el).position === "static") el.style.position = "relative";

  const cleanup = spawnSwarmParticles(el);

  for (let i = 0; i < SWARM_SEEDS.length; i++) {
    const seed = SWARM_SEEDS[i];
    const sprite = el.querySelectorAll<HTMLElement>(".skit-reveal-swarm-particle")[i];
    if (!sprite) continue;
    sprite.animate(
      [
        { offset: 0,    opacity: 0,            transform: `translate(${seed.sx}, ${seed.sy}) scale(0.7)` },
        { offset: 0.10, opacity: seed.opacity, transform: `translate(calc(${seed.sx} * 0.9), calc(${seed.sy} * 0.9)) scale(0.85)` },
        { offset: 0.55, opacity: seed.opacity, transform: `translate(${seed.mx}, ${seed.my}) scale(0.95)` },
        { offset: 0.78, opacity: seed.opacity, transform: `translate(0, 0) scale(1)` },
        { offset: 1,    opacity: 0,            transform: `translate(0, 0) scale(0.6)` },
      ],
      {
        duration: swarmDur,
        delay: seed.delay * 1000,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
  }

  // Section content stays invisible while particles fly in, fades in
  // behind the settled swarm, then particles dissolve on top — same
  // shape as the live CSS keyframes so the demo matches.
  const sectionAnim = (el as HTMLElement).animate(
    [
      { offset: 0,    opacity: 0 },
      { offset: 0.65, opacity: 0 },
      { offset: 0.85, opacity: 1 },
      { offset: 1,    opacity: 1 },
    ],
    { duration: swarmDur, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" },
  );

  // Cleanup once the longest tail finishes. Fall back to setTimeout if
  // the animation handle is null (shouldn't be).
  const finishTimer = setTimeout(() => {
    cleanup();
    if (prevPos) el.style.position = prevPos;
    else el.style.removeProperty("position");
  }, swarmDur + 600);

  // If something cancels the section animation, still clean up.
  sectionAnim.addEventListener("cancel", () => {
    clearTimeout(finishTimer);
    cleanup();
    if (prevPos) el.style.position = prevPos;
    else el.style.removeProperty("position");
  });

  return sectionAnim;
}

