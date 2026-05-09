import type { AnimationProps } from "./types.js";
import { SplineEmbed } from "./spline.js";
import { PresetRender } from "./presets.js";

// AnimationRender — variant dispatcher. Hosts call this from inside
// their section dispatcher when section.kind === "animation".
//
// The wrapper applies .skit-anim-base (motion_intensity reveal-on-scroll)
// so the animation block fades in like other sections — but only when
// the host opts into reveal animations by adding .in-view via their own
// IntersectionObserver. Hosts can disable with motion_intensity="off".

export function AnimationRender({ props }: { props: AnimationProps }) {
  return (
    <div className="skit-anim-block">
      {props.variant === "spline" ? (
        <SplineEmbed props={props} />
      ) : (
        <PresetRender props={props} />
      )}
      {props.caption && <span className="skit-anim-caption">{props.caption}</span>}
    </div>
  );
}
