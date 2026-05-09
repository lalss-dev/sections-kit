import { Aurora } from "./Aurora.js";
import { Butterflies } from "./Butterflies.js";
import { Particles } from "./Particles.js";
import type { PremiumEffect } from "./types.js";

// Page-level AMBIENT effect overlay. Per Bilal's direction, page
// effects are minimal-only — non-distracting bg mood (aurora wash,
// soft butterflies, drifting dots). The dramatic stuff (thousand
// butterfly converge, matrix-form, glitch) lives in the per-section
// reveal system because those are one-shot animations, not perpetual
// page overlays.
export function PremiumEffectLayer({ effect }: { effect: PremiumEffect | undefined }) {
  if (!effect || effect === "none") return null;
  return (
    <div data-skit-fx={effect} className="skit-fx-layer" aria-hidden>
      {effect === "aurora" && <Aurora />}
      {effect === "butterflies" && <Butterflies />}
      {effect === "particles" && <Particles />}
    </div>
  );
}
