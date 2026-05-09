import { ClickSparkle } from "./ClickSparkle.js";
import { CursorTrail } from "./CursorTrail.js";
import { Spotlight } from "./Spotlight.js";
import type { InteractiveEffect } from "./types.js";

// Interactive effect dispatcher. Hosts mount this once per page,
// pass the chosen effect from content.customization.interactive_effect.
// Each child component manages its own document-level event listeners
// internally — there's no ambient animation, only response to user
// pointer activity, which is why these don't bother reading.
export function InteractiveEffectLayer({
  effect,
}: {
  effect: InteractiveEffect | undefined;
}) {
  if (!effect || effect === "none") return null;
  return (
    <>
      {effect === "click-sparkle" && <ClickSparkle />}
      {effect === "cursor-trail" && <CursorTrail />}
      {effect === "spotlight" && <Spotlight />}
    </>
  );
}
