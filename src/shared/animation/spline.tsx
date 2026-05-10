"use client";

import * as React from "react";
import type { AnimationProps } from "./types.js";

// 3D scene dispatcher for variant="spline". Three CONTENT-BEARING CSS
// scenes (counter / stats / card) replace the old decorative spinners
// — each carries real numbers or copy with depth + tilt. "custom"
// falls through to spline_url and embeds an iframe so authors who DO
// want their own Spline scene still have a path.

export function SplineEmbed({ props }: { props: AnimationProps }) {
  const scene = props.spline_scene ?? "counter";
  const height = props.height_px ?? 360;
  const colorVar: React.CSSProperties = {
    ["--skit-3d-color" as never]: props.color || "var(--skit-anim-default-color, currentColor)",
    minHeight: height,
  };

  if (scene === "custom") {
    return <CustomSplineEmbed props={props} />;
  }
  return (
    <div className="skit-3d" data-scene={scene} style={colorVar}>
      <div className="skit-3d-stage">
        {scene === "counter" && <ThreeDCounterScene props={props} />}
        {scene === "stats" && <ThreeDStatsScene props={props} />}
        {scene === "card" && <ThreeDCardScene props={props} />}
      </div>
    </div>
  );
}

// ---- 3D Counter — uses the same counter_* fields as the CSS counter ----

function ThreeDCounterScene({ props }: { props: AnimationProps }) {
  const stat =
    props.counter_stats && props.counter_stats[0]
      ? props.counter_stats[0]
      : {
          value: props.counter_value ?? 1000,
          prefix: props.counter_prefix,
          suffix: props.counter_suffix ?? "+",
          label: props.counter_label ?? "happy customers",
        };
  const target = Math.max(0, Math.floor(stat.value ?? 0));
  const duration = Math.max(200, props.counter_duration_ms ?? 1500);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const numberRef = React.useRef<HTMLSpanElement | null>(null);
  const playedRef = React.useRef(false);

  React.useEffect(() => {
    const root = ref.current;
    const out = numberRef.current;
    if (!root || !out) return;
    out.textContent = formatNumber(0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || playedRef.current) continue;
          playedRef.current = true;
          const start = performance.now();
          function tick(now: number) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            out!.textContent = formatNumber(Math.round(target * eased));
            if (t < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="skit-3d-counter">
      <div className="skit-3d-counter-number">
        {stat.prefix && <span className="skit-3d-counter-affix">{stat.prefix}</span>}
        <span ref={numberRef} className="skit-3d-counter-value">{formatNumber(0)}</span>
        {stat.suffix && <span className="skit-3d-counter-affix">{stat.suffix}</span>}
      </div>
      {stat.label && <div className="skit-3d-counter-label">{stat.label}</div>}
    </div>
  );
}

// ---- 3D Stats — 3 floating glass badges around a tilted plane.
// Reuses counter_stats so the same authoring data drives both the CSS
// counter trio AND the 3D stats scene. Falls back to placeholders.

function ThreeDStatsScene({ props }: { props: AnimationProps }) {
  const stats =
    props.counter_stats && props.counter_stats.length > 0
      ? padStats(props.counter_stats, 3)
      : [
          { value: 5000, suffix: "+", label: "customers" },
          { value: 99, suffix: "%", label: "uptime" },
          { value: 24, suffix: "/7", label: "support" },
        ];
  const positions = ["a", "b", "c"] as const;
  return (
    <div className="skit-3d-stats">
      <span className="skit-3d-stats-platform" aria-hidden />
      {stats.map((s, i) => (
        <div key={i} className={`skit-3d-stat-badge skit-3d-stat-badge-${positions[i]}`}>
          <div className="skit-3d-stat-value">
            {s.prefix && <span className="skit-3d-stat-affix">{s.prefix}</span>}
            <span>{formatNumber(s.value ?? 0)}</span>
            {s.suffix && <span className="skit-3d-stat-affix">{s.suffix}</span>}
          </div>
          {s.label && <div className="skit-3d-stat-label">{s.label}</div>}
        </div>
      ))}
    </div>
  );
}

function padStats<T>(arr: T[], n: number): T[] {
  if (arr.length >= n) return arr.slice(0, n);
  // Repeat the last entry rather than emit blank slots.
  const out = [...arr];
  while (out.length < n) out.push(arr[arr.length - 1]);
  return out;
}

// ---- 3D Card — tilted glass card with eyebrow / headline / subhead / tag.

function ThreeDCardScene({ props }: { props: AnimationProps }) {
  const eyebrow = props.card_eyebrow ?? "BARU · 2026";
  const headline = props.card_headline ?? "Built for the next decade.";
  const subhead = props.card_subhead ?? "A design system that grows with your team — every primitive, every token, every story.";
  const tag = props.card_tag ?? "READ THE LAUNCH NOTES";
  return (
    <div className="skit-3d-card">
      {eyebrow && <div className="skit-3d-card-eyebrow">{eyebrow}</div>}
      {headline && <div className="skit-3d-card-headline">{headline}</div>}
      {subhead && <div className="skit-3d-card-subhead">{subhead}</div>}
      {tag && <span className="skit-3d-card-tag">{tag}</span>}
    </div>
  );
}

function formatNumber(n: number): string {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
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
