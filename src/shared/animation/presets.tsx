"use client";

import * as React from "react";
import type {
  AnimationProps,
  AnimationPreset,
  CounterStat,
  MarqueeDirection,
  MarqueeRows,
  MarqueeStyle,
  TypewriterHighlight,
} from "./types.js";

// Marketing-content preset library. Each preset converts the Animation
// section's vertical real estate into a meaningful unit:
//
//   counter    — 1, 2 or 3 stats that count up on scroll
//   marquee    — endless ticker(s) — direction, rows, pill/clean style
//   typewriter — rotating typed word with 4 highlight styles
//
// CSS lives next door in presets.css and is namespaced under
// .skit-anim-preset so it can't bleed into the host page.

export function PresetRender({ props }: { props: AnimationProps }) {
  const preset: AnimationPreset = props.preset ?? "counter";
  const height = props.height_px ?? 320;
  const color = props.color || undefined;
  const style: React.CSSProperties = {
    ["--skit-anim-color" as never]: color || "var(--skit-anim-default-color, currentColor)",
    ["--skit-anim-h" as never]: `${height}px`,
  };

  return (
    <div className="skit-anim-preset" data-preset={preset} style={style}>
      {preset === "counter" && <CounterPreset props={props} />}
      {preset === "marquee" && <MarqueePreset props={props} />}
      {preset === "typewriter" && <TypewriterPreset props={props} />}
    </div>
  );
}

// ---------- Counter ----------
//
// 1, 2, or 3 stats arranged in a CSS grid. Each stat counts from 0
// to its target on scroll-into-view via IntersectionObserver +
// requestAnimationFrame.

function CounterPreset({ props }: { props: AnimationProps }) {
  const layout = props.counter_layout ?? "single";
  const stats = resolveCounterStats(props);
  const cols = stats.length;
  const duration = Math.max(200, props.counter_duration_ms ?? 1500);

  return (
    <div className={`skit-counter-grid skit-counter-grid-${layout}`} data-cols={cols}>
      {stats.map((stat, i) => (
        <CounterCell
          key={i}
          stat={stat}
          duration={duration}
          delay={i * 200}
          rank={cols === 1 ? "hero" : "small"}
        />
      ))}
    </div>
  );
}

function resolveCounterStats(props: AnimationProps): CounterStat[] {
  // Prefer the new multi-stat array. Fall back to the legacy single-stat
  // fields so older pages keep rendering identically.
  if (props.counter_stats && props.counter_stats.length > 0) {
    return props.counter_stats.slice(0, 3);
  }
  return [
    {
      value: props.counter_value ?? 0,
      prefix: props.counter_prefix,
      suffix: props.counter_suffix,
      label: props.counter_label,
    },
  ];
}

function CounterCell({
  stat,
  duration,
  delay,
  rank,
}: {
  stat: CounterStat;
  duration: number;
  delay: number;
  rank: "hero" | "small";
}) {
  const target = Math.max(0, Math.floor(stat.value ?? 0));
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
          window.setTimeout(() => {
            const start = performance.now();
            function tick(now: number) {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              out!.textContent = formatNumber(Math.round(target * eased));
              if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }, delay);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [target, duration, delay]);

  return (
    <div ref={ref} className={`skit-counter-cell skit-counter-cell-${rank}`}>
      <div className="skit-counter-number">
        {stat.prefix && <span className="skit-counter-affix">{stat.prefix}</span>}
        <span ref={numberRef} className="skit-counter-value">{formatNumber(0)}</span>
        {stat.suffix && <span className="skit-counter-affix">{stat.suffix}</span>}
      </div>
      {stat.label && <div className="skit-counter-label">{stat.label}</div>}
    </div>
  );
}

// Fixed en-US locale so SSR + client renders match. Without this,
// servers in en-* locales emit "5,000" and clients in id-ID emit
// "5.000" → React hydration mismatch on the very first counter cell.
function formatNumber(n: number): string {
  try {
    return new Intl.NumberFormat("en-US").format(n);
  } catch {
    return String(n);
  }
}

// ---------- Marquee ----------
//
// One or two horizontal rows. Each row is a doubled track that loops
// via translateX 0 ↔ -50%. Direction reverses the keyframe; second
// row scrolls opposite for visual balance.

function MarqueePreset({ props }: { props: AnimationProps }) {
  const items = (props.marquee_items ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const placeholder = items.length === 0;
  const display = placeholder ? ["Add items, comma-separated"] : items;
  const speed = props.marquee_speed ?? "normal";
  const dur = speed === "slow" ? "60s" : speed === "fast" ? "18s" : "32s";
  const direction: MarqueeDirection = props.marquee_direction ?? "left";
  const rows: MarqueeRows = props.marquee_rows ?? 1;
  const style: MarqueeStyle = props.marquee_style ?? "clean";

  return (
    <div
      className={`skit-marquee skit-marquee-style-${style}`}
      data-placeholder={placeholder ? "" : undefined}
      data-rows={rows}
    >
      <MarqueeRow items={display} dur={dur} direction={direction} style={style} />
      {rows === 2 && (
        <MarqueeRow
          items={[...display].reverse()}
          dur={dur}
          direction={direction === "left" ? "right" : "left"}
          style={style}
        />
      )}
    </div>
  );
}

function MarqueeRow({
  items,
  dur,
  direction,
  style,
}: {
  items: string[];
  dur: string;
  direction: MarqueeDirection;
  style: MarqueeStyle;
}) {
  const sequence = [...items, ...items];
  return (
    <div className="skit-marquee-row">
      <div
        className="skit-marquee-track"
        style={{
          animationDuration: dur,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {sequence.map((item, i) => (
          <span key={i} className="skit-marquee-item">
            {style === "pill" ? (
              <span className="skit-marquee-pill">{item}</span>
            ) : (
              <>
                <span className="skit-marquee-text">{item}</span>
                <span className="skit-marquee-bullet" aria-hidden>·</span>
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- Typewriter ----------
//
// Static prefix + cycling word that types in, holds, deletes, advances.
// Highlight style picks how the cycling word visually pops:
//   underline (default) — bottom border in the accent color
//   box                 — outlined rectangle around the word
//   brackets            — [bracketed] word
//   gradient            — accent-color gradient fill via background-clip

function TypewriterPreset({ props }: { props: AnimationProps }) {
  const words = (props.typewriter_words ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const display = words.length === 0 ? ["build", "launch", "grow"] : words;
  const highlight: TypewriterHighlight = props.typewriter_highlight ?? "underline";

  const [text, setText] = React.useState("");
  const idxRef = React.useRef(0);
  const phaseRef = React.useRef<"typing" | "holding" | "deleting">("typing");
  const charRef = React.useRef(0);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    function step() {
      const word = display[idxRef.current % display.length];
      if (phaseRef.current === "typing") {
        charRef.current += 1;
        setText(word.slice(0, charRef.current));
        if (charRef.current >= word.length) {
          phaseRef.current = "holding";
          timer = setTimeout(step, 1100);
          return;
        }
        timer = setTimeout(step, 70);
      } else if (phaseRef.current === "holding") {
        phaseRef.current = "deleting";
        timer = setTimeout(step, 50);
      } else {
        charRef.current -= 1;
        setText(word.slice(0, Math.max(0, charRef.current)));
        if (charRef.current <= 0) {
          idxRef.current += 1;
          phaseRef.current = "typing";
          timer = setTimeout(step, 250);
          return;
        }
        timer = setTimeout(step, 40);
      }
    }
    timer = setTimeout(step, 350);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [display.join("|")]);

  return (
    <div className="skit-typewriter">
      <div className="skit-typewriter-line">
        {props.typewriter_prefix && (
          <span className="skit-typewriter-prefix">{props.typewriter_prefix}&nbsp;</span>
        )}
        <span className={`skit-typewriter-word skit-typewriter-hl-${highlight}`}>
          {highlight === "brackets" && (
            <span className="skit-typewriter-bracket" aria-hidden>[</span>
          )}
          <span className="skit-typewriter-word-text">{text}</span>
          <span className="skit-typewriter-caret" aria-hidden>|</span>
          {highlight === "brackets" && (
            <span className="skit-typewriter-bracket" aria-hidden>]</span>
          )}
        </span>
        {props.typewriter_suffix && (
          <span className="skit-typewriter-suffix">&nbsp;{props.typewriter_suffix}</span>
        )}
      </div>
    </div>
  );
}
