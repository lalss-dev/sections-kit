// Animation section — a flashy block dropped into any landing/link/webstore
// page. Two variants:
//
//   spline   — paste a spline.design embed URL; renders inside an iframe
//              (heavy WebGL runtime stays scoped to the iframe so the host
//              page Lighthouse score is preserved when the section isn't
//              used).
//
//   preset   — pick from a small library of self-contained CSS/SVG
//              animations modeled on the most popular Lottie content
//              (sparkle, orbit, confetti, checkmark, pulse, rocket).
//              Lightweight (no JS lib), respects theme color, scales
//              cleanly across mobile and desktop.

import type { MotionIntensity } from "../motion.js";

export const ANIMATION_VARIANTS = ["spline", "preset"] as const;
export type AnimationVariant = (typeof ANIMATION_VARIANTS)[number];

export const ANIMATION_PRESETS = [
  "sparkle",   // rotating cluster of stars, scale-pulses
  "orbit",     // dot orbiting a larger dot
  "confetti",  // colored squares falling + spinning
  "checkmark", // SVG path stroke draws a tick
  "pulse",     // concentric circles expanding
  "rocket",    // rocket SVG launches with smoke trail
] as const;
export type AnimationPreset = (typeof ANIMATION_PRESETS)[number];

export const ANIMATION_PRESET_META: Record<
  AnimationPreset,
  { label: string; description: string }
> = {
  sparkle: { label: "Sparkle", description: "Rotating star cluster" },
  orbit: { label: "Orbit", description: "Planet orbiting a dot" },
  confetti: { label: "Confetti", description: "Falling colored shapes" },
  checkmark: { label: "Check", description: "Tick draw-in" },
  pulse: { label: "Pulse", description: "Concentric heartbeat" },
  rocket: { label: "Rocket", description: "Launch with smoke trail" },
};

export type AnimationProps = {
  variant: AnimationVariant;
  // For variant="spline": the spline.design embed URL. We accept either
  // the viewer URL (https://my.spline.design/<id>/) or the explicit embed
  // URL (https://my.spline.design/<id>/embed) — the renderer normalizes.
  spline_url?: string;
  // For variant="preset": which preset to render.
  preset?: AnimationPreset;
  // Custom color override for presets (defaults to theme accent / current
  // CSS color). Hex or any CSS <color>.
  color?: string;
  // Min height of the section in px. Animations are full-width by default;
  // height controls the canvas. Default 360. Spline embeds may want
  // 480-600 for showcase 3D scenes.
  height_px?: number;
  // Optional label rendered below the animation (small mono caps).
  caption?: string;
};

// Default props factory. Consumed by createAnimationSection() in the
// host app's section factories. We start with the sparkle preset because
// it works without any author input — a fresh "+ animation" section
// drops something visible immediately.
export function defaultAnimationProps(): AnimationProps {
  return {
    variant: "preset",
    preset: "sparkle",
    height_px: 360,
  };
}

// Section base shape that hosts wrap around AnimationProps. Hosts pull
// this and union it into their LandingSection / LinkSection types so
// the renderer can dispatch on `kind === "animation"`.
export type AnimationSectionFields = {
  kind: "animation";
  variant: AnimationVariant;
  props: AnimationProps;
  motion_intensity?: MotionIntensity;
};
