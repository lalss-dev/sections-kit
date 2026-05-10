"use client";

import * as React from "react";
import type { AnimationProps, AnimationPreset } from "./types.js";

// Marketing-content preset library. Each preset converts the Animation
// section's 360px of vertical real estate into a meaningful unit:
//
//   counter    — "5,000+ happy customers" (number counts up on scroll)
//   marquee    — "GRATIS ONGKIR · COD · 24/7" (endless ticker)
//   typewriter — "Kami bantu kamu BUILD" (rotating typed word)
//
// All presets honor:
//   --skit-anim-color   resolved from props.color || currentColor
// CSS lives next door in presets.css and is namespaced under
// .skit-anim-preset so it can't bleed into the host page.

export function PresetRender({ props }: { props: AnimationProps }) {
  const preset: AnimationPreset = props.preset ?? "counter";
  const height = props.height_px ?? 320;
  const color = props.color || undefined;
  const style: React.CSSProperties = {
    minHeight: height,
    ["--skit-anim-color" as never]: color || "var(--skit-anim-default-color, currentColor)",
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
// Big number that animates from 0 to counter_value over counter_duration_ms
// the first time the section scrolls into view. Pure JS via
// IntersectionObserver + requestAnimationFrame — no animation libs.

function CounterPreset({ props }: { props: AnimationProps }) {
  const target = Math.max(0, Math.floor(props.counter_value ?? 0));
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
            // ease-out cubic
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
    <div ref={ref} className="skit-counter">
      <div className="skit-counter-number">
        {props.counter_prefix && <span className="skit-counter-affix">{props.counter_prefix}</span>}
        <span ref={numberRef} className="skit-counter-value">{formatNumber(0)}</span>
        {props.counter_suffix && <span className="skit-counter-affix">{props.counter_suffix}</span>}
      </div>
      {props.counter_label && (
        <div className="skit-counter-label">{props.counter_label}</div>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  // Thousands separator that respects the page's locale, with a sane
  // fallback if Intl isn't available.
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

// ---------- Marquee ----------
//
// Endless horizontal scroll of items separated by a bullet. Items
// duplicated once so the loop seams cleanly with translateX(-50%).

function MarqueePreset({ props }: { props: AnimationProps }) {
  const items = (props.marquee_items ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const placeholder = items.length === 0;
  const display = placeholder ? ["Add items, comma-separated"] : items;
  const speed = props.marquee_speed ?? "normal";
  const dur = speed === "slow" ? "60s" : speed === "fast" ? "18s" : "32s";

  // Doubled so the second copy slides into where the first finishes.
  const sequence = [...display, ...display];

  return (
    <div className="skit-marquee" data-placeholder={placeholder ? "" : undefined}>
      <div className="skit-marquee-track" style={{ animationDuration: dur }}>
        {sequence.map((item, i) => (
          <span key={i} className="skit-marquee-item">
            <span className="skit-marquee-text">{item}</span>
            <span className="skit-marquee-bullet" aria-hidden>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- Typewriter ----------
//
// Static prefix + a cycling word that types in, holds, deletes, and
// advances to the next word. Pure setTimeout chain — no deps. Caret
// blinks via CSS keyframe.

function TypewriterPreset({ props }: { props: AnimationProps }) {
  const words = (props.typewriter_words ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const display = words.length === 0 ? ["build", "launch", "grow"] : words;

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
    // Re-bind on words change so editor edits hot-swap cleanly.
  }, [display.join("|")]);

  return (
    <div className="skit-typewriter">
      <div className="skit-typewriter-line">
        {props.typewriter_prefix && (
          <span className="skit-typewriter-prefix">{props.typewriter_prefix}&nbsp;</span>
        )}
        <span className="skit-typewriter-word">
          {text}
          <span className="skit-typewriter-caret" aria-hidden>|</span>
        </span>
        {props.typewriter_suffix && (
          <span className="skit-typewriter-suffix">&nbsp;{props.typewriter_suffix}</span>
        )}
      </div>
    </div>
  );
}
