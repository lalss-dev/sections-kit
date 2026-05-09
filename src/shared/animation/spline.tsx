import type { AnimationProps } from "./types.js";

// SplineEmbed — iframe-loads a spline.design viewer URL. Iframe vs the
// <spline-viewer> web component is intentional: the WebGL runtime
// (~250-400KB depending on scene) stays scoped to the iframe, so a page
// without an animation section pays nothing. Trade-off: an extra HTTP
// request per Spline section, but they're full-width hero blocks so the
// count is normally one or two per page.
//
// Accepts either form of URL the spline.design dashboard hands authors:
//
//   https://my.spline.design/<id>/         (viewer)
//   https://my.spline.design/<id>/embed    (explicit embed)
//
// We append /embed when missing so the rendered page doesn't show
// Spline's own viewer chrome (logo, "open in spline" button).

function normalizeSplineUrl(input: string): string | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;
  // Allow protocol-relative or http for sandbox previews; default to https.
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
  // Strip query/hash, keep path; ensure it ends with /embed.
  const path = url.pathname.replace(/\/+$/, "");
  const embedded = path.endsWith("/embed") ? path : `${path}/embed`;
  return `https://${url.hostname}${embedded}`;
}

export function SplineEmbed({ props }: { props: AnimationProps }) {
  const src = normalizeSplineUrl(props.spline_url || "");
  const height = props.height_px ?? 480;

  if (!src) {
    // No URL or unsafe host. Render a placeholder so the editor preview
    // shows the section size instead of collapsing to zero height.
    return (
      <div
        className="skit-anim-spline-empty"
        style={{ height, minHeight: 200 }}
      >
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
        // Allow the Spline runtime to use webgl + accelerometer/gyroscope
        // for tilt-controlled scenes. No fullscreen — we keep the embed
        // sized to the section.
        allow="autoplay; clipboard-read; clipboard-write; gyroscope; accelerometer"
        loading="lazy"
        title={props.caption || "Spline 3D scene"}
        // referrerpolicy=no-referrer keeps the host page URL out of
        // Spline's analytics, which the author probably doesn't want
        // leaking either way.
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
