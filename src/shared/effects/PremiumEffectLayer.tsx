import { Aurora } from "./Aurora.js";
import { Butterflies } from "./Butterflies.js";
import { Particles } from "./Particles.js";
import { Matrix } from "./Matrix.js";
import type { PremiumEffect } from "./types.js";

// Page-level effect overlay. Hosts mount this near the top of their
// renderer's tree (right after the background paint) and pass the
// chosen effect from content.customization.premium_effect.
//
// Each effect renders into its own fixed/absolute container. Pointer
// events disabled so the effect never blocks clicks on content. Wrapped
// in <div data-skit-fx>; CSS in effects.css scopes everything to that
// attribute so the host's own classes can never conflict.
export function PremiumEffectLayer({ effect }: { effect: PremiumEffect | undefined }) {
  if (!effect || effect === "none") return null;
  return (
    <div data-skit-fx={effect} className="skit-fx-layer" aria-hidden>
      {effect === "aurora" && <Aurora />}
      {effect === "butterflies" && <Butterflies />}
      {effect === "particles" && <Particles />}
      {effect === "matrix" && <Matrix />}
    </div>
  );
}
