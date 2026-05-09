// Interactive effects fire on user input — click bursts, cursor
// trails, soft spotlight following the pointer. Unlike page effects
// (which animate perpetually and bother reading), these are silent
// until the user moves or clicks. Bilal: "explode when click,
// decaying cursor etc nothing distracting."
//
// Triggered by content.customization.interactive_effect (or the
// link-page equivalent at root). Default "none" = no interaction.

export const INTERACTIVE_EFFECTS = [
  "none",
  "click-sparkle",
  "cursor-trail",
  "spotlight",
] as const;
export type InteractiveEffect = (typeof INTERACTIVE_EFFECTS)[number];

export const INTERACTIVE_EFFECT_META: Record<
  InteractiveEffect,
  { label: string; description: string; tier: "free" | "premium" }
> = {
  "none":          { label: "None",          description: "No interactive effect",                  tier: "free" },
  "click-sparkle": { label: "Click sparkle", description: "Burst of particles at click point",      tier: "premium" },
  "cursor-trail":  { label: "Cursor trail",  description: "Fading dots follow the cursor",          tier: "premium" },
  "spotlight":     { label: "Spotlight",     description: "Soft light follows the cursor",          tier: "premium" },
};
