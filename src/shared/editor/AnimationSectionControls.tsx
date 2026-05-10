"use client";

import * as React from "react";
import {
  ANIMATION_PRESET_META,
  ANIMATION_PRESETS,
  type AnimationPreset,
  type AnimationProps,
  type AnimationVariant,
} from "../animation/types.js";

// Shared editor cluster for the Animation section's properties. Owned
// by the kit so PoS / CRM landing / CRM link-pages all stay in lockstep
// — adding a new preset (or new per-preset content field) only touches
// this file.
//
// Storage-agnostic: consumers pass the section's `props` and an
// onChange that receives the FULL next props object.

export function AnimationSectionControls({
  value,
  onChange,
}: {
  value: AnimationProps;
  onChange: (next: AnimationProps) => void;
}) {
  const variant: AnimationVariant = value.variant ?? "preset";
  const preset: AnimationPreset = value.preset ?? "counter";

  function patch(diff: Partial<AnimationProps>) {
    const next = { ...value, ...diff };
    // Keep variant in sync if the diff included it (defensive).
    if (diff.variant) next.variant = diff.variant;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Layout</Label>
        <div className="grid grid-cols-2 gap-2">
          <VariantTile
            active={variant === "spline"}
            label="Spline 3D"
            onClick={() => patch({ variant: "spline" })}
            glyph={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden>
                <path d="M24 6 L40 14 L40 34 L24 42 L8 34 L8 14 Z" />
                <path d="M8 14 L24 22 L40 14" />
                <path d="M24 22 L24 42" />
              </svg>
            }
          />
          <VariantTile
            active={variant === "preset"}
            label="Preset"
            onClick={() => patch({ variant: "preset" })}
            glyph={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" aria-hidden>
                <path d="M24 6 C26 18, 30 22, 42 24 C30 26, 26 30, 24 42 C22 30, 18 26, 6 24 C18 22, 22 18, 24 6 Z" />
              </svg>
            }
          />
        </div>
      </div>

      {variant === "spline" && (
        <div>
          <Label>Spline embed URL</Label>
          <input
            value={value.spline_url ?? ""}
            onChange={(e) => patch({ spline_url: e.target.value })}
            placeholder="https://my.spline.design/abc123/"
            spellCheck={false}
            className={inputCls}
          />
          <Helper>Paste the public scene URL from spline.design — we auto-append /embed.</Helper>
        </div>
      )}

      {variant === "preset" && (
        <div>
          <Label>Preset</Label>
          <div className="grid grid-cols-3 gap-2">
            {ANIMATION_PRESETS.map((p) => (
              <PresetTile
                key={p}
                active={preset === p}
                label={ANIMATION_PRESET_META[p].label}
                description={ANIMATION_PRESET_META[p].description}
                onClick={() => patch({ preset: p })}
                glyph={PRESET_GLYPH[p]}
              />
            ))}
          </div>
          <Helper>{ANIMATION_PRESET_META[preset].description}</Helper>

          {preset === "counter" && <CounterFields value={value} patch={patch} />}
          {preset === "marquee" && <MarqueeFields value={value} patch={patch} />}
          {preset === "typewriter" && <TypewriterFields value={value} patch={patch} />}
        </div>
      )}

      <div>
        <Label>Height (px)</Label>
        <input
          type="number"
          min={120}
          max={1200}
          step={20}
          value={value.height_px ?? 320}
          onChange={(e) => patch({ height_px: Math.max(120, Number(e.target.value) || 320) })}
          className={inputCls}
        />
      </div>

      <div>
        <Label>Color (optional)</Label>
        <input
          value={value.color ?? ""}
          onChange={(e) => patch({ color: e.target.value || undefined })}
          placeholder="#ff6b6b — leave blank for theme accent"
          className={inputCls}
        />
      </div>

      <div>
        <Label>Caption (optional)</Label>
        <input
          value={value.caption ?? ""}
          onChange={(e) => patch({ caption: e.target.value || undefined })}
          placeholder="rendered below in small mono caps"
          className={inputCls}
        />
      </div>
    </div>
  );
}

// ---- Per-preset content fields ----

function CounterFields({
  value,
  patch,
}: {
  value: AnimationProps;
  patch: (diff: Partial<AnimationProps>) => void;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-md border border-card-border bg-background/40 p-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <Label>Prefix</Label>
          <input
            value={value.counter_prefix ?? ""}
            onChange={(e) => patch({ counter_prefix: e.target.value || undefined })}
            placeholder="Rp"
            className={inputCls}
          />
        </div>
        <div className="col-span-1">
          <Label>Number</Label>
          <input
            type="number"
            min={0}
            value={value.counter_value ?? ""}
            onChange={(e) => patch({ counter_value: Number(e.target.value) || 0 })}
            placeholder="5000"
            className={inputCls}
          />
        </div>
        <div className="col-span-1">
          <Label>Suffix</Label>
          <input
            value={value.counter_suffix ?? ""}
            onChange={(e) => patch({ counter_suffix: e.target.value || undefined })}
            placeholder="+"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <Label>Label under number</Label>
        <input
          value={value.counter_label ?? ""}
          onChange={(e) => patch({ counter_label: e.target.value || undefined })}
          placeholder="happy customers"
          className={inputCls}
        />
      </div>
    </div>
  );
}

function MarqueeFields({
  value,
  patch,
}: {
  value: AnimationProps;
  patch: (diff: Partial<AnimationProps>) => void;
}) {
  const speed = value.marquee_speed ?? "normal";
  return (
    <div className="mt-3 space-y-2 rounded-md border border-card-border bg-background/40 p-3">
      <div>
        <Label>Items (comma-separated)</Label>
        <input
          value={value.marquee_items ?? ""}
          onChange={(e) => patch({ marquee_items: e.target.value || undefined })}
          placeholder="GRATIS ONGKIR, COD, 24/7 SUPPORT"
          className={inputCls}
        />
      </div>
      <div>
        <Label>Speed</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {(["slow", "normal", "fast"] as const).map((s) => {
            const active = speed === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => patch({ marquee_speed: s })}
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
  );
}

function TypewriterFields({
  value,
  patch,
}: {
  value: AnimationProps;
  patch: (diff: Partial<AnimationProps>) => void;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-md border border-card-border bg-background/40 p-3">
      <div>
        <Label>Prefix (static)</Label>
        <input
          value={value.typewriter_prefix ?? ""}
          onChange={(e) => patch({ typewriter_prefix: e.target.value || undefined })}
          placeholder="Kami bantu kamu"
          className={inputCls}
        />
      </div>
      <div>
        <Label>Cycling words (comma-separated)</Label>
        <input
          value={value.typewriter_words ?? ""}
          onChange={(e) => patch({ typewriter_words: e.target.value || undefined })}
          placeholder="build, launch, grow"
          className={inputCls}
        />
      </div>
      <div>
        <Label>Suffix (static, optional)</Label>
        <input
          value={value.typewriter_suffix ?? ""}
          onChange={(e) => patch({ typewriter_suffix: e.target.value || undefined })}
          placeholder="bisnismu"
          className={inputCls}
        />
      </div>
    </div>
  );
}

// ---- Tiles + primitives ----

function VariantTile({
  active,
  label,
  glyph,
  onClick,
}: {
  active: boolean;
  label: string;
  glyph: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
        active
          ? "border-brand-purple bg-brand-purple/10 text-brand-purple shadow-sm"
          : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
      }`}
    >
      <span>{glyph}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function PresetTile({
  active,
  label,
  description,
  glyph,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  glyph: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={description}
      className={`flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 transition-all ${
        active
          ? "border-brand-purple bg-brand-purple/10 text-brand-purple shadow-sm"
          : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
      }`}
    >
      <span>{glyph}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

const PRESET_GLYPH: Record<AnimationPreset, React.ReactNode> = {
  counter: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17 V8 L7 17" />
      <path d="M3 13 H7" />
      <path d="M11 8 H15 a2 2 0 0 1 2 2 v0 a2 2 0 0 1 -2 2 H11 v5 H17" />
      <path d="M21 8 v9" />
    </svg>
  ),
  marquee: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12 H22" />
      <path d="M18 8 L22 12 L18 16" />
      <circle cx="6" cy="12" r="0.6" fill="currentColor" />
      <circle cx="10" cy="12" r="0.6" fill="currentColor" />
      <circle cx="14" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  typewriter: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 6 H14" />
      <path d="M4 12 H18" />
      <path d="M4 18 H10" />
      <line x1="13" y1="16" x2="13" y2="20" />
    </svg>
  ),
};

const inputCls =
  "w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/30";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
      {children}
    </div>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[10px] leading-relaxed text-muted">{children}</p>;
}
