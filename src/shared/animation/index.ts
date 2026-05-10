// Public surface for the animation section.

export {
  ANIMATION_VARIANTS,
  ANIMATION_PRESETS,
  ANIMATION_PRESET_META,
  ANIMATION_3D_SCENES,
  ANIMATION_3D_SCENE_META,
  COUNTER_LAYOUTS,
  MARQUEE_DIRECTIONS,
  MARQUEE_ROWS,
  MARQUEE_STYLES,
  TYPEWRITER_HIGHLIGHTS,
  defaultAnimationProps,
  type AnimationVariant,
  type AnimationPreset,
  type Animation3DScene,
  type AnimationProps,
  type AnimationSectionFields,
  type CounterLayout,
  type CounterStat,
  type MarqueeDirection,
  type MarqueeRows,
  type MarqueeStyle,
  type TypewriterHighlight,
} from "./types.js";
export { AnimationRender } from "./render.js";
export { SplineEmbed } from "./spline.js";
export { PresetRender } from "./presets.js";
