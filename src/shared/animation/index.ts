// Public surface for the animation section. Hosts import:
//
//   import {
//     AnimationRender,
//     defaultAnimationProps,
//     ANIMATION_PRESET_META,
//     type AnimationProps,
//     type AnimationVariant,
//     type AnimationPreset,
//     type AnimationSectionFields,
//   } from "@lalss/sections-kit/animation";
//
// The CSS for both variants ships in @lalss/sections-kit/styles.css —
// import that once at the host's app shell so the keyframes are
// available wherever the kit renders.

export {
  ANIMATION_VARIANTS,
  ANIMATION_PRESETS,
  ANIMATION_PRESET_META,
  defaultAnimationProps,
  type AnimationVariant,
  type AnimationPreset,
  type AnimationProps,
  type AnimationSectionFields,
} from "./types.js";
export { AnimationRender } from "./render.js";
export { SplineEmbed } from "./spline.js";
export { PresetRender } from "./presets.js";
