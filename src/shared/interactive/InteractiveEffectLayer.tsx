import { ClickSparkle } from "./ClickSparkle.js";
import { CursorTrail } from "./CursorTrail.js";
import { Spotlight } from "./Spotlight.js";
import type { InteractiveEffect, InteractiveSize } from "./types.js";

// Interactive effect dispatcher. Hosts mount this once per page,
// pass the chosen effect from content.customization.interactive_effect.
// Each child component manages its own pointer event listeners scoped
// to the closest `.lp-root` ancestor — so the editor preview only
// reacts to clicks inside the canvas, not the surrounding chrome.
//
// `color` accepts any CSS color string (#hex, rgb(), hsl(), etc.).
// When omitted the components fall back to their built-in palette
// (random hues for click-sparkle, purple for trail/spotlight).
//
// `size` scales each effect — particle count + dot size for click,
// dot size + lifetime for trail, halo radius for spotlight.
export function InteractiveEffectLayer({
  effect,
  color,
  size,
}: {
  effect: InteractiveEffect | undefined;
  color?: string;
  size?: InteractiveSize;
}) {
  if (!effect || effect === "none") return null;
  return (
    <>
      {effect === "click-sparkle" && <ClickSparkle color={color} size={size} />}
      {effect === "cursor-trail" && <CursorTrail color={color} size={size} />}
      {effect === "spotlight" && <Spotlight color={color} size={size} />}
    </>
  );
}
