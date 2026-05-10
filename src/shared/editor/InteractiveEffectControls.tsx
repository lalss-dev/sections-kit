"use client";

import * as React from "react";
import {
  INTERACTIVE_EFFECT_META,
  type InteractiveEffect,
  type InteractiveSize,
} from "../interactive/types.js";

// Shared editor cluster for the page-level Interactive Effect knobs.
// Owned by the kit so PoS / CRM landing / CRM link-pages all stay in
// lockstep — adding a new effect / option only touches this file.
//
// Dep-free: inline SVG icons, plain HTML buttons. The Tailwind
// utility tokens used here (text-muted, border-card-border, bg-card,
// bg-background, text-foreground, brand-purple) all already resolve
// in every consumer's globals.css.
//
// Storage-agnostic: each consumer maps the kit's flat
// `{ effect, color, size }` to its own document shape.

export type InteractiveEffectControlsValue = {
  effect?: InteractiveEffect;
  color?: string;
  size?: InteractiveSize;
};

export function InteractiveEffectControls({
  value,
  onChange,
}: {
  value: InteractiveEffectControlsValue;
  // Emits the FULL next value (consumer spreads into storage).
  onChange: (next: InteractiveEffectControlsValue) => void;
}) {
  const effect = value.effect ?? "none";
  const color = value.color ?? "";
  const size = value.size ?? "medium";

  return (
    <div>
      <div className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        Interactive effect
        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {INTERACTIVE_TILES.map(({ value: v, label, Icon }) => {
          const active = effect === v;
          const meta = INTERACTIVE_EFFECT_META[v];
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...value, effect: v })}
              title={meta.description}
              className={`relative flex flex-col items-center gap-1 rounded-md border px-1 py-2 transition-all ${
                active
                  ? "border-brand-purple bg-brand-purple/10 text-brand-purple shadow-sm"
                  : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
              }`}
            >
              <Icon active={active} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              {meta.tier === "premium" && (
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400"
                  aria-label="Premium"
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-muted">
        Cursor / click responses — try them right here in the preview.
      </p>

      {effect !== "none" && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Effect color
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hexFor(color)}
                onChange={(e) => onChange({ ...value, color: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-md border border-card-border bg-card"
              />
              <input
                value={color}
                onChange={(e) =>
                  onChange({ ...value, color: e.target.value || undefined })
                }
                placeholder="leave empty for default"
                className="w-full rounded-md border border-card-border bg-background px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/30"
              />
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Empty = Click goes rainbow, Trail and Light go purple.
            </p>
          </div>
          <div>
            <div className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Size
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["small", "medium", "large"] as const).map((s) => {
                const active = size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange({ ...value, size: s })}
                    className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold capitalize transition-all ${
                      active
                        ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                        : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Best-effort hex extraction so the native color input has a valid
// 6-digit hex to seed itself with. Non-hex values (rgba/hsl/named)
// pass through the text input unchanged.
function hexFor(value: string): string {
  return /^#[0-9a-f]{6}$/i.exec(value)?.[0] ?? "#000000";
}

// ---- Inline icons (lucide-style, ~16px stroke) ----
//
// We don't pull lucide-react into the kit — keeps the dep surface
// flat and lets consumers pick their icon library independently.

type IconProps = { active: boolean };

function strokeWidth(active: boolean): number {
  return active ? 2.4 : 2;
}

function NoneIcon({ active }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth(active)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function ClickIcon({ active }: IconProps) {
  // Sparkles
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth(active)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

function TrailIcon({ active }: IconProps) {
  // MousePointer2
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth(active)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
    </svg>
  );
}

function LightIcon({ active }: IconProps) {
  // Lightbulb
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth(active)} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

const INTERACTIVE_TILES: {
  value: InteractiveEffect;
  label: string;
  Icon: React.ComponentType<IconProps>;
}[] = [
  { value: "none",          label: "None",  Icon: NoneIcon },
  { value: "click-sparkle", label: "Click", Icon: ClickIcon },
  { value: "cursor-trail",  label: "Trail", Icon: TrailIcon },
  { value: "spotlight",     label: "Light", Icon: LightIcon },
];
