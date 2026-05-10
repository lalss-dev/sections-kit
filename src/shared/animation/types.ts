// Animation section — a content block dropped into any landing/link/webstore
// page. Two variants:
//
//   preset   — pick from a marketing-content library (counter, marquee,
//              typewriter). Each preset earns its 360px on a landing page
//              by communicating a fact, value prop, or hook.
//
//   spline   — 3D scenes. Three pure-CSS content-bearing scenes
//              (3D counter, orbiting stat badges, floating glass card)
//              plus a "custom" escape that embeds a Spline URL.
//
// History notes:
//   - Pre 2026-05-10: 6 decorative spinners (sparkle/orbit/confetti/
//     checkmark/pulse/rocket). Replaced with marketing-content presets.
//   - Mid 2026-05-10: 3D variant rebuilt — cube/orbs/tower (decorative
//     CSS scenes) → counter/stats/card (content-bearing scenes).

import type { MotionIntensity } from "../motion.js";

export const ANIMATION_VARIANTS = ["spline", "preset"] as const;
export type AnimationVariant = (typeof ANIMATION_VARIANTS)[number];

export const ANIMATION_PRESETS = [
  "counter",    // big number(s) that count up on scroll-into-view
  "marquee",    // endless horizontal ticker(s) of selling points
  "typewriter", // headline with a cycling typed word
] as const;
export type AnimationPreset = (typeof ANIMATION_PRESETS)[number];

export const ANIMATION_PRESET_META: Record<
  AnimationPreset,
  { label: string; description: string }
> = {
  counter:    { label: "Counter",    description: "Numbers that count up — 1, 2, or 3 stats" },
  marquee:    { label: "Marquee",    description: "Endless ticker of selling points" },
  typewriter: { label: "Typewriter", description: "Headline with rotating typed words" },
};

// Counter layout — single big number, side-by-side pair, or three-stat row.
export const COUNTER_LAYOUTS = ["single", "pair", "trio"] as const;
export type CounterLayout = (typeof COUNTER_LAYOUTS)[number];

// Per-stat shape for the multi-stat counter.
export type CounterStat = {
  value?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
};

// Marquee tweaks.
export const MARQUEE_DIRECTIONS = ["left", "right"] as const;
export type MarqueeDirection = (typeof MARQUEE_DIRECTIONS)[number];
export const MARQUEE_ROWS = [1, 2] as const;
export type MarqueeRows = (typeof MARQUEE_ROWS)[number];
export const MARQUEE_STYLES = ["clean", "pill"] as const;
export type MarqueeStyle = (typeof MARQUEE_STYLES)[number];

// Typewriter highlight style for the cycling word.
export const TYPEWRITER_HIGHLIGHTS = [
  "underline", // bottom border (current default)
  "box",       // outlined rectangle around the word
  "brackets",  // [bracketed] word with the brackets in the accent color
  "gradient",  // word filled with an accent gradient
] as const;
export type TypewriterHighlight = (typeof TYPEWRITER_HIGHLIGHTS)[number];

// 3D scenes for variant="spline". Three content-bearing scenes (counter,
// stats, card) plus "custom" that falls through to spline_url for authors
// who want their own scene.
export const ANIMATION_3D_SCENES = ["counter", "stats", "card", "custom"] as const;
export type Animation3DScene = (typeof ANIMATION_3D_SCENES)[number];

export const ANIMATION_3D_SCENE_META: Record<
  Animation3DScene,
  { label: string; description: string }
> = {
  counter: { label: "Counter", description: "Chunky 3D number tilted in space, counts up on scroll" },
  stats:   { label: "Stats",   description: "Stat badges floating around a tilted plane" },
  card:    { label: "Card",    description: "Glass card with headline + subhead, gently tilting" },
  custom:  { label: "Custom",  description: "Paste your own spline.design embed URL" },
};

export type AnimationProps = {
  variant: AnimationVariant;

  // ---- Spline / 3D variant ----
  // Which 3D scene to render. Defaults to a content-bearing CSS scene.
  // Set to "custom" to fall through to spline_url and embed an iframe.
  spline_scene?: Animation3DScene;
  // For spline_scene="custom": the spline.design embed URL.
  spline_url?: string;

  // ---- Preset variant ----
  preset?: AnimationPreset;
  // Custom color override for presets + 3D scenes (defaults to theme accent /
  // current CSS color). Hex or any CSS <color>.
  color?: string;
  // Min height of the section in px. Default 320 for presets, 480 for spline.
  height_px?: number;
  // Optional small label rendered below the animation in mono caps.
  caption?: string;

  // ---- Counter preset (CSS + 3D) ----
  // Multi-stat array. When set + non-empty, the renderer ignores the legacy
  // single-stat fields. Editor writes both during transition.
  counter_stats?: CounterStat[];
  counter_layout?: CounterLayout;
  counter_duration_ms?: number;       // count-up duration; default 1500ms
  // Legacy single-stat fields (back-compat — editor still writes them when
  // layout is "single" so older renderers keep working).
  counter_value?: number;
  counter_prefix?: string;
  counter_suffix?: string;
  counter_label?: string;

  // ---- Marquee preset ----
  marquee_items?: string;             // comma-separated tokens
  marquee_speed?: "slow" | "normal" | "fast"; // default "normal"
  marquee_direction?: MarqueeDirection; // default "left"
  marquee_rows?: MarqueeRows;          // default 1; second row scrolls opposite
  marquee_style?: MarqueeStyle;        // default "clean"

  // ---- Typewriter preset ----
  typewriter_prefix?: string;         // static text before the cycling word
  typewriter_words?: string;          // comma-separated cycling words
  typewriter_suffix?: string;         // static text after the cycling word
  typewriter_highlight?: TypewriterHighlight; // default "underline"

  // ---- 3D Card scene ----
  card_eyebrow?: string;              // small caps label above the headline
  card_headline?: string;             // main headline (1-3 words)
  card_subhead?: string;              // supporting line
  card_tag?: string;                  // small badge inside the card
  card_tag_href?: string;             // when set, the tag becomes a clickable <a> (opens in new tab)

  // ---- 3D interactivity (applies to all 3D scenes) ----
  // Cursor-parallax tilt + click-punch. "off" is a static idle tilt.
  // "subtle" = ±8deg max, "normal" = ±14deg, "dramatic" = ±22deg.
  interactive_3d?: ThreeDInteractivity;
};

export const THREE_D_INTERACTIVITY = ["off", "subtle", "normal", "dramatic"] as const;
export type ThreeDInteractivity = (typeof THREE_D_INTERACTIVITY)[number];

// Default props factory. Counter is the friendliest default — authors
// drop in a section and immediately see "1,000+ happy customers".
export function defaultAnimationProps(): AnimationProps {
  return {
    variant: "preset",
    preset: "counter",
    height_px: 320,
    counter_layout: "single",
    counter_value: 1000,
    counter_suffix: "+",
    counter_label: "happy customers",
    counter_duration_ms: 1500,
    counter_stats: [
      { value: 1000, suffix: "+", label: "happy customers" },
    ],
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
