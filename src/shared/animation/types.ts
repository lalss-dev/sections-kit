// Animation section — a content block dropped into any landing/link/webstore
// page. Two variants:
//
//   spline   — paste a spline.design embed URL; renders inside an iframe
//              (heavy WebGL runtime stays scoped to the iframe so the host
//              page Lighthouse score is preserved when the section isn't
//              used).
//
//   preset   — pick from a small library of MARKETING-CONTENT presets.
//              Each preset earns its 360px on a landing page by communicating
//              a fact, value prop, or hook — not by spinning decoratively.
//              Lightweight (CSS keyframes + minimal JS), respects theme color,
//              scales cleanly across mobile and desktop.
//
// History: prior version (pre-2026-05-10) shipped 6 decorative spinners
// (sparkle/orbit/confetti/checkmark/pulse/rocket). Bilal: "it's practically
// useless for animation section, find out to make it useful". Replaced with
// 3 marketing-content presets per his pick of "3 high-value over 6 mediocre".

import type { MotionIntensity } from "../motion.js";

export const ANIMATION_VARIANTS = ["spline", "preset"] as const;
export type AnimationVariant = (typeof ANIMATION_VARIANTS)[number];

export const ANIMATION_PRESETS = [
  "counter",    // big number that counts up on scroll-into-view
  "marquee",    // endless horizontal ticker of selling points
  "typewriter", // headline with a cycling typed word
] as const;
export type AnimationPreset = (typeof ANIMATION_PRESETS)[number];

export const ANIMATION_PRESET_META: Record<
  AnimationPreset,
  { label: string; description: string }
> = {
  counter:    { label: "Counter",    description: "Big number that counts up on scroll" },
  marquee:    { label: "Marquee",    description: "Endless ticker of selling points" },
  typewriter: { label: "Typewriter", description: "Headline with rotating typed words" },
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
  // Optional small label rendered below the animation in mono caps.
  caption?: string;

  // ---- Counter preset ----
  counter_value?: number;            // target number to count up to (e.g. 5000)
  counter_prefix?: string;           // before the number (e.g. "Rp" or "$")
  counter_suffix?: string;           // after the number (e.g. "+" or "K")
  counter_label?: string;            // small label under the number (e.g. "pengguna aktif")
  counter_duration_ms?: number;      // count-up duration; default 1500ms

  // ---- Marquee preset ----
  marquee_items?: string;            // comma-separated tokens (e.g. "GRATIS ONGKIR, COD, 24/7")
  marquee_speed?: "slow" | "normal" | "fast"; // default "normal"

  // ---- Typewriter preset ----
  typewriter_prefix?: string;        // static text before the cycling word (e.g. "Kami bantu kamu")
  typewriter_words?: string;         // comma-separated cycling words (e.g. "build,launch,grow")
  typewriter_suffix?: string;        // static text after the cycling word (e.g. "bisnismu")
};

// Default props factory. Consumed by createAnimationSection() in the
// host app's section factories. Counter is the friendliest default —
// authors can drop in a section and it shows a recognizable "1,000
// happy customers" placeholder immediately.
export function defaultAnimationProps(): AnimationProps {
  return {
    variant: "preset",
    preset: "counter",
    height_px: 320,
    counter_value: 1000,
    counter_suffix: "+",
    counter_label: "happy customers",
    counter_duration_ms: 1500,
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
