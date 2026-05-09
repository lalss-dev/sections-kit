// Premium page-level effects. These are full-page overlays that
// compose ON TOP of the page background — aurora gradient, fluttering
// butterflies, drifting particles, matrix character rain. Each is a
// self-contained component that renders into a fixed/absolute container
// covering the page.
//
// Triggered by content.customization.premium_effect (or root-level
// equivalent on link-pages where customization isn't a sub-object).
// Default "none" = no overlay.
//
// Designed as the visible knob for a premium tier later. For now,
// available to anyone who picks one.

export const PREMIUM_EFFECTS = [
  "none",
  "aurora",
  "butterflies",
  "particles",
  "matrix",
] as const;
export type PremiumEffect = (typeof PREMIUM_EFFECTS)[number];

export const PREMIUM_EFFECT_META: Record<
  PremiumEffect,
  { label: string; description: string; tier: "free" | "premium" }
> = {
  "none":         { label: "None",         description: "No page overlay",                         tier: "free" },
  "aurora":       { label: "Aurora",       description: "Flowing iridescent gradient bg",          tier: "premium" },
  "butterflies":  { label: "Butterflies",  description: "Dozens of fluttering SVG butterflies",    tier: "premium" },
  "particles":    { label: "Particles",    description: "Soft floating dots drifting across",      tier: "premium" },
  "matrix":       { label: "Matrix rain",  description: "Canvas character cascade — green on black", tier: "premium" },
};
