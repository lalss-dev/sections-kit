import * as React from "react";
import type { AnimationProps } from "./types.js";

// 3D scene dispatcher for variant="spline". Three pure-CSS 3D scenes
// (cube / orbs / tower) cover the common "modern / tech-forward" hero
// needs without forcing the author to design a Spline scene. The
// "custom" scene falls through to spline_url and embeds an iframe so
// authors who DO want their own Spline scene still have a path.
//
// Why CSS 3D over Spline by default:
//   - 0KB JS runtime. Spline ships ~250-400KB per scene.
//   - Renders in the editor preview immediately (no iframe lazy-load).
//   - Looks intentional rather than blank-with-paste-url-please.

export function SplineEmbed({ props }: { props: AnimationProps }) {
  const scene = props.spline_scene ?? "cube";
  const height = props.height_px ?? 320;
  const colorVar: React.CSSProperties = {
    ["--skit-3d-color" as never]: props.color || "var(--skit-anim-default-color, currentColor)",
    minHeight: height,
  };

  if (scene === "custom") {
    return <CustomSplineEmbed props={props} />;
  }
  return (
    <div className="skit-3d" data-scene={scene} style={colorVar}>
      {scene === "cube" && <CubeScene />}
      {scene === "orbs" && <OrbsScene />}
      {scene === "tower" && <TowerScene />}
    </div>
  );
}

function CubeScene() {
  // Wireframe cube via 6 absolutely-positioned panels rotated into the
  // 6 face positions. Container spins on Y + tumbles on X via CSS
  // animation. Pure transforms; no JS.
  return (
    <div className="skit-3d-stage">
      <div className="skit-3d-cube">
        <span className="skit-3d-face skit-3d-face-front" />
        <span className="skit-3d-face skit-3d-face-back" />
        <span className="skit-3d-face skit-3d-face-right" />
        <span className="skit-3d-face skit-3d-face-left" />
        <span className="skit-3d-face skit-3d-face-top" />
        <span className="skit-3d-face skit-3d-face-bottom" />
      </div>
    </div>
  );
}

function OrbsScene() {
  // Three orbs orbiting on a tilted plane. The orbit ring is drawn via
  // CSS perspective; each orb is a radial-gradient circle that travels
  // around the ring with phase offsets.
  return (
    <div className="skit-3d-stage">
      <div className="skit-3d-orbits">
        <span className="skit-3d-ring" aria-hidden />
        <span className="skit-3d-orb skit-3d-orb-a" />
        <span className="skit-3d-orb skit-3d-orb-b" />
        <span className="skit-3d-orb skit-3d-orb-c" />
        <span className="skit-3d-core" />
      </div>
    </div>
  );
}

function TowerScene() {
  // 5 stacked translucent panels at offsets, gently floating up/down
  // out of phase with each other. Reads as "data tower / layered system".
  return (
    <div className="skit-3d-stage">
      <div className="skit-3d-tower">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="skit-3d-panel"
            style={{
              ["--skit-3d-i" as never]: i,
              ["--skit-3d-delay" as never]: `${i * -0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Custom Spline iframe (advanced) ----

function normalizeSplineUrl(input: string): string | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  // Only honor known Spline hosts to avoid an open redirect / iframe-
  // injection vector. Author-supplied URLs are otherwise low-trust.
  const okHost =
    url.hostname === "my.spline.design" ||
    url.hostname.endsWith(".spline.design") ||
    url.hostname === "prod.spline.design";
  if (!okHost) return null;
  const path = url.pathname.replace(/\/+$/, "");
  const embedded = path.endsWith("/embed") ? path : `${path}/embed`;
  return `https://${url.hostname}${embedded}`;
}

function CustomSplineEmbed({ props }: { props: AnimationProps }) {
  const src = normalizeSplineUrl(props.spline_url || "");
  const height = props.height_px ?? 480;
  if (!src) {
    return (
      <div className="skit-anim-spline-empty" style={{ height, minHeight: 200 }}>
        <span>
          {(props.spline_url || "").trim()
            ? "Unsupported Spline URL — must be on spline.design."
            : "Paste a spline.design embed URL to load the 3D scene."}
        </span>
      </div>
    );
  }
  return (
    <div className="skit-anim-spline-frame" style={{ height }}>
      <iframe
        src={src}
        allow="autoplay; clipboard-read; clipboard-write; gyroscope; accelerometer"
        loading="lazy"
        title={props.caption || "Spline 3D scene"}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
