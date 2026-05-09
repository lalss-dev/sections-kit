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

// Page-level effects are AMBIENT BG ONLY. Bilal: "minimal only that
// won't bother reading experience." So matrix (full-screen character
// cascade) is intentionally excluded — it's too dominant for content
// reading. Aurora opacity dropped to 0.25, butterflies to 12 sprites
// at 0.45 opacity, particles already minimal at 60 small dots.
//
// The "thousand butterfly become one" / matrix-form / etc. are PER-
// SECTION REVEAL effects (see motion.ts Reveal type) — they fire on
// scroll-into-view, animate, then leave the section in its natural
// state. They don't bother reading because they happen ONCE per
// section as you scroll past.
export const PREMIUM_EFFECTS = [
  "none",
  "aurora",
  "butterflies",
  "particles",
] as const;
export type PremiumEffect = (typeof PREMIUM_EFFECTS)[number];

export const PREMIUM_EFFECT_META: Record<
  PremiumEffect,
  { label: string; description: string; tier: "free" | "premium" }
> = {
  "none":         { label: "None",         description: "No page overlay",                                    tier: "free" },
  "aurora":       { label: "Aurora",       description: "Subtle flowing color blobs (low opacity)",          tier: "premium" },
  "butterflies":  { label: "Butterflies",  description: "12 ambient fluttering butterflies (low opacity)",    tier: "premium" },
  "particles":    { label: "Particles",    description: "60 soft floating dots drifting upward",              tier: "premium" },
};
