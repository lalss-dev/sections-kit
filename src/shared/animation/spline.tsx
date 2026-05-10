"use client";

import * as React from "react";
import type { AnimationProps, ThreeDInteractivity } from "./types.js";

// 3D scene dispatcher for variant="spline". Three CONTENT-BEARING CSS
// scenes (counter / stats / card) replace the old decorative spinners
// — each carries real numbers or copy with depth + tilt. "custom"
// falls through to spline_url and embeds an iframe.
//
// Interactivity layer: cursor-parallax tilt via CSS vars
//   --skit-3d-tilt-x  rotateX delta (deg)
//   --skit-3d-tilt-y  rotateY delta (deg)
//   --skit-3d-active  0 (idle) | 1 (cursor over) — drives transitions
// Each scene's static idle transform composes with these vars so the
// scene LOOKS great with no cursor and FEELS alive when the cursor
// enters.

export function SplineEmbed({ props }: { props: AnimationProps }) {
  const scene = props.spline_scene ?? "counter";
  const height = props.height_px ?? 360;
  const interactive: ThreeDInteractivity = props.interactive_3d ?? "normal";
  // --skit-anim-h drives BOTH the section's effective height AND the
  // inner stage scale. CSS computes `height: min(--skit-anim-h, natural
  // * 1.4)` so a user picking XL on a small-natural scene doesn't get
  // a tall section with a small scene floating in empty space.
  const colorVar: React.CSSProperties = {
    ["--skit-3d-color" as never]: props.color || "var(--skit-anim-default-color, currentColor)",
    ["--skit-anim-h" as never]: `${height}px`,
  };

  if (scene === "custom") {
    return <CustomSplineEmbed props={props} />;
  }
  return (
    <div className="skit-3d" data-scene={scene} style={colorVar}>
      <div className="skit-3d-stage">
        {scene === "counter" && <ThreeDCounterScene props={props} interactive={interactive} />}
        {scene === "stats" && <ThreeDStatsScene props={props} interactive={interactive} />}
        {scene === "card" && <ThreeDCardScene props={props} interactive={interactive} />}
      </div>
    </div>
  );
}

// ---- useTilt — pointer-parallax tilt on a ref via CSS vars ----
//
// Listens for pointermove on the container, computes a -1..1 delta
// from the cursor's position relative to the element bounds, and
// writes scaled deg values into --skit-3d-tilt-x/y. rAF-throttled so
// we never write more than once per frame even on a 240Hz mouse.
//
// PointerEvent covers mouse + touch + pen. On touch devices a tap
// produces a single move event; we leave the tilt latched for ~600ms
// after touchend so the user briefly sees the response.

type TiltOpts = { intensity: ThreeDInteractivity; punch?: boolean };

function useTilt<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  { intensity, punch = false }: TiltOpts,
) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el || intensity === "off") {
      el?.style.removeProperty("--skit-3d-tilt-x");
      el?.style.removeProperty("--skit-3d-tilt-y");
      el?.style.setProperty("--skit-3d-active", "0");
      return;
    }
    // Bilal: "if i put interactivity here it spins like crazy even for
    // subtle". Halved the max magnitudes — was 8/14/22, now 4/8/14.
    // Multiplied by 2 internally because cursor delta is -0.5..+0.5,
    // so effective tilt is ±max degrees.
    const max = intensity === "subtle" ? 4 : intensity === "dramatic" ? 14 : 8;
    let rafId: number | null = null;
    let nx = 0;
    let ny = 0;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;

    function apply() {
      rafId = null;
      el!.style.setProperty("--skit-3d-tilt-x", `${ny.toFixed(2)}deg`);
      el!.style.setProperty("--skit-3d-tilt-y", `${nx.toFixed(2)}deg`);
      el!.style.setProperty("--skit-3d-active", "1");
    }
    function onMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const fx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5..0.5
      const fy = (e.clientY - rect.top) / rect.height - 0.5;
      nx = fx * max * 2;
      ny = -fy * max * 2;
      if (rafId == null) rafId = requestAnimationFrame(apply);
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
    }
    function onLeave() {
      // Latch briefly on touch so the user sees the tilt; settle on mouse.
      const settleDelay = 0;
      leaveTimer = setTimeout(() => {
        el!.style.setProperty("--skit-3d-tilt-x", "0deg");
        el!.style.setProperty("--skit-3d-tilt-y", "0deg");
        el!.style.setProperty("--skit-3d-active", "0");
      }, settleDelay);
    }
    function onDown() {
      if (!punch) return;
      el!.classList.add("skit-3d-punch");
      window.setTimeout(() => el!.classList.remove("skit-3d-punch"), 320);
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.style.setProperty("--skit-3d-active", "0");
    el.style.setProperty("--skit-3d-tilt-x", "0deg");
    el.style.setProperty("--skit-3d-tilt-y", "0deg");
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      if (rafId != null) cancelAnimationFrame(rafId);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [intensity, punch, ref]);
}

// ---- 3D Counter ----

function ThreeDCounterScene({ props, interactive }: { props: AnimationProps; interactive: ThreeDInteractivity }) {
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
  const tiltRef = React.useRef<HTMLDivElement | null>(null);
  const counterRef = React.useRef<HTMLDivElement | null>(null);
  const numberRef = React.useRef<HTMLSpanElement | null>(null);
  const playedRef = React.useRef(false);

  useTilt(tiltRef, { intensity: interactive, punch: true });

  React.useEffect(() => {
    const root = counterRef.current;
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
    <div ref={tiltRef} className="skit-3d-tilt skit-3d-counter-tilt" data-interactive={interactive !== "off" ? "" : undefined}>
      <div ref={counterRef} className="skit-3d-counter">
        <div className="skit-3d-counter-number">
          {stat.prefix && <span className="skit-3d-counter-affix">{stat.prefix}</span>}
          <span ref={numberRef} className="skit-3d-counter-value">{formatNumber(0)}</span>
          {stat.suffix && <span className="skit-3d-counter-affix">{stat.suffix}</span>}
        </div>
        {stat.label && <div className="skit-3d-counter-label">{stat.label}</div>}
      </div>
    </div>
  );
}

// ---- 3D Stats (rewritten 2026-05-10) ----
//
// Old design: 3 absolute-positioned badges with per-card translateX/Y/Z
// + rotateY(±18°), an implied dashed-ring "platform", parent rotateX(20°).
// Problems:
//   - cards "fanned" toward center, looked like they were spinning
//     when the parent's cursor-tilt rotated the whole assembly
//   - the platform foreshortened to a single dashed stripe at any
//     angle and was never useful
//   - empty space leaked because the absolute layout assumed a
//     280px tall stage but the visible badges only filled ~140px
//
// New design: 3 flat-facing glass cards in a flexbox row with a
// subtle Z-stagger (middle card forward 40px, sides 20px). No
// per-card rotateY — when the parent tilts under cursor parallax,
// the cards stay together as one plane instead of swinging.

function ThreeDStatsScene({ props, interactive }: { props: AnimationProps; interactive: ThreeDInteractivity }) {
  const stats =
    props.counter_stats && props.counter_stats.length > 0
      ? padStats(props.counter_stats, 3)
      : [
          { value: 5000, suffix: "+", label: "customers" },
          { value: 99, suffix: "%", label: "uptime" },
          { value: 24, suffix: "/7", label: "support" },
        ];
  const tiltRef = React.useRef<HTMLDivElement | null>(null);
  useTilt(tiltRef, { intensity: interactive });

  return (
    <div ref={tiltRef} className="skit-3d-tilt skit-3d-stats-tilt" data-interactive={interactive !== "off" ? "" : undefined}>
      <div className="skit-3d-stats">
        {stats.map((s, i) => (
          <div key={i} className={`skit-3d-stat-card skit-3d-stat-card-${i}`}>
            <div className="skit-3d-stat-value">
              {s.prefix && <span className="skit-3d-stat-affix">{s.prefix}</span>}
              <span>{formatNumber(s.value ?? 0)}</span>
              {s.suffix && <span className="skit-3d-stat-affix">{s.suffix}</span>}
            </div>
            {s.label && <div className="skit-3d-stat-label">{s.label}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function padStats<T>(arr: T[], n: number): T[] {
  if (arr.length >= n) return arr.slice(0, n);
  const out = [...arr];
  while (out.length < n) out.push(arr[arr.length - 1]);
  return out;
}

// ---- 3D Card ----

function ThreeDCardScene({ props, interactive }: { props: AnimationProps; interactive: ThreeDInteractivity }) {
  const eyebrow = props.card_eyebrow ?? "BARU · 2026";
  const headline = props.card_headline ?? "Built for the next decade.";
  const subhead = props.card_subhead ?? "A design system that grows with your team — every primitive, every token, every story.";
  const tag = props.card_tag ?? "READ THE LAUNCH NOTES";
  const tagHref = props.card_tag_href;
  const tiltRef = React.useRef<HTMLDivElement | null>(null);
  useTilt(tiltRef, { intensity: interactive, punch: true });

  // External-only tags open in a new tab; mailto:/tel:/wa.me URLs
  // open in their respective handlers.
  const isExternal = !!tagHref && !tagHref.startsWith("#");

  return (
    <div ref={tiltRef} className="skit-3d-tilt skit-3d-card-tilt" data-interactive={interactive !== "off" ? "" : undefined}>
      <div className="skit-3d-card">
        <span className="skit-3d-card-glare" aria-hidden />
        {eyebrow && <div className="skit-3d-card-eyebrow">{eyebrow}</div>}
        {headline && <div className="skit-3d-card-headline">{headline}</div>}
        {subhead && <div className="skit-3d-card-subhead">{subhead}</div>}
        {tag && (
          tagHref ? (
            <a
              href={tagHref}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="skit-3d-card-tag skit-3d-card-tag-link"
            >
              {tag}
            </a>
          ) : (
            <span className="skit-3d-card-tag">{tag}</span>
          )
        )}
      </div>
    </div>
  );
}

// Fixed en-US locale so SSR + client renders match. See note in
// presets.tsx#formatNumber.
function formatNumber(n: number): string {
  try {
    return new Intl.NumberFormat("en-US").format(n);
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
