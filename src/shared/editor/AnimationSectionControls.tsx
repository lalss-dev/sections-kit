"use client";

import * as React from "react";
import {
  ANIMATION_3D_SCENE_META,
  ANIMATION_3D_SCENES,
  ANIMATION_PRESET_META,
  ANIMATION_PRESETS,
  type Animation3DScene,
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
  variant,
  value,
  onChange,
}: {
  // Section-level variant (spline | preset). Pass `section.variant`
  // directly — the kit never reads props.variant so there's no risk
  // of the two drifting out of sync.
  variant?: AnimationVariant;
  value: AnimationProps;
  onChange: (next: AnimationProps) => void;
}) {
  const v: AnimationVariant = variant ?? value.variant ?? "preset";
  const preset: AnimationPreset = value.preset ?? "counter";

  function patch(diff: Partial<AnimationProps>) {
    // Always stamp the current variant onto props so storage stays
    // self-consistent even if the consumer forgets to mirror it.
    onChange({ ...value, ...diff, variant: v });
  }

  return (
    <div className="space-y-3">
      {v === "spline" && <SplineFields value={value} patch={patch} />}

      {v === "preset" && (
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

      <HeightChips value={value.height_px} onChange={(v) => patch({ height_px: v })} />

      <ColorPicker
        label="Color"
        value={value.color}
        onChange={(v) => patch({ color: v })}
        helper="Leave empty to inherit the page theme accent."
      />

      <div>
        <Label>Caption</Label>
        <AutoGrowTextarea
          value={value.caption ?? ""}
          onChange={(v) => patch({ caption: v || undefined })}
          placeholder="optional — small mono caps under the animation"
        />
      </div>
    </div>
  );
}

// Auto-grow textarea — height tracks content. Enter inserts a newline
// (no implicit submit anywhere in the kit), Shift+Enter same. Used for
// any field where authors may want multi-line marketing copy.
function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  minRows = 1,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      spellCheck={false}
      className={`${inputCls} resize-none overflow-hidden leading-snug`}
    />
  );
}

// ---- Click-driven height + color so authors don't have to type ----

const HEIGHT_PRESETS: { value: number; label: string }[] = [
  { value: 240, label: "S" },
  { value: 320, label: "M" },
  { value: 480, label: "L" },
  { value: 720, label: "XL" },
];

function HeightChips({
  value,
  onChange,
}: {
  value?: number;
  onChange: (next: number) => void;
}) {
  const current = value ?? 320;
  const matchedPreset = HEIGHT_PRESETS.find((p) => p.value === current);
  const [customMode, setCustomMode] = React.useState(!matchedPreset);
  React.useEffect(() => {
    setCustomMode(!HEIGHT_PRESETS.some((p) => p.value === current));
  }, [current]);

  return (
    <div>
      <Label>Height</Label>
      <div className="grid grid-cols-5 gap-1.5">
        {HEIGHT_PRESETS.map((p) => {
          const active = !customMode && current === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                setCustomMode(false);
                onChange(p.value);
              }}
              title={`${p.value}px`}
              className={`rounded-md border px-2 py-2 text-[11px] font-semibold transition-all ${
                active
                  ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                  : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCustomMode(true)}
          className={`rounded-md border px-2 py-2 text-[11px] font-semibold transition-all ${
            customMode
              ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
              : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
          }`}
        >
          Custom
        </button>
      </div>
      {customMode && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            min={120}
            max={900}
            step={10}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-brand-purple"
          />
          <input
            type="number"
            min={120}
            max={1200}
            step={10}
            value={current}
            onChange={(e) => onChange(Math.max(120, Number(e.target.value) || 320))}
            className={`${inputCls} w-20 text-center`}
          />
        </div>
      )}
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  helper?: string;
}) {
  const hex = /^#[0-9a-f]{6}$/i.exec(value ?? "")?.[0] ?? "#a855f7";
  const isSet = !!value;
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-card-border bg-card"
        />
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="theme accent"
          className={`${inputCls} flex-1 font-mono text-xs`}
        />
        {isSet && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-md border border-card-border bg-background px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted transition-all hover:border-brand-purple/60 hover:text-foreground"
            title="Use page theme accent"
          >
            Reset
          </button>
        )}
      </div>
      {helper && <Helper>{helper}</Helper>}
    </div>
  );
}

// ---- Per-preset content fields ----

function SplineFields({
  value,
  patch,
}: {
  value: AnimationProps;
  patch: (diff: Partial<AnimationProps>) => void;
}) {
  const scene = value.spline_scene ?? "cube";
  return (
    <div>
      <Label>3D scene</Label>
      <div className="grid grid-cols-4 gap-1.5">
        {ANIMATION_3D_SCENES.map((s) => {
          const active = scene === s;
          const meta = ANIMATION_3D_SCENE_META[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => patch({ spline_scene: s })}
              title={meta.description}
              className={`flex flex-col items-center gap-1 rounded-md border px-2 py-3 transition-all ${
                active
                  ? "border-brand-purple bg-brand-purple/10 text-brand-purple shadow-sm"
                  : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
              }`}
            >
              <span>{SCENE_GLYPH[s]}</span>
              <span className="text-[11px] font-semibold">{meta.label}</span>
            </button>
          );
        })}
      </div>
      <Helper>{ANIMATION_3D_SCENE_META[scene].description}</Helper>
      {scene === "custom" && (
        <div className="mt-3 rounded-md border border-card-border bg-background/40 p-3">
          <Label>Spline embed URL</Label>
          <input
            value={value.spline_url ?? ""}
            onChange={(e) => patch({ spline_url: e.target.value || undefined })}
            placeholder="https://my.spline.design/abc123/"
            spellCheck={false}
            className={inputCls}
          />
          <Helper>Paste the public scene URL from spline.design — we auto-append /embed.</Helper>
        </div>
      )}
    </div>
  );
}

const SCENE_GLYPH: Record<Animation3DScene, React.ReactNode> = {
  cube: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
      <path d="M12 3 L21 7.5 L21 16.5 L12 21 L3 16.5 L3 7.5 Z" />
      <path d="M3 7.5 L12 12 L21 7.5" />
      <path d="M12 12 L12 21" />
    </svg>
  ),
  orbs: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="12" rx="9" ry="3.5" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <circle cx="3.5" cy="12" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="20.5" cy="12" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  tower: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
      <path d="M5 7 L12 4 L19 7 L12 10 Z" />
      <path d="M5 12 L12 9 L19 12 L12 15 Z" opacity="0.7" />
      <path d="M5 17 L12 14 L19 17 L12 20 Z" opacity="0.5" />
    </svg>
  ),
  custom: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M10 3 L14 3 L14 21 L10 21 Z" />
      <path d="M3 7 L21 7" />
      <path d="M3 17 L21 17" />
    </svg>
  ),
};

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
        <AutoGrowTextarea
          value={value.counter_label ?? ""}
          onChange={(v) => patch({ counter_label: v || undefined })}
          placeholder="happy customers"
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
        <AutoGrowTextarea
          value={value.typewriter_prefix ?? ""}
          onChange={(v) => patch({ typewriter_prefix: v || undefined })}
          placeholder="Kami bantu kamu"
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
        <AutoGrowTextarea
          value={value.typewriter_suffix ?? ""}
          onChange={(v) => patch({ typewriter_suffix: v || undefined })}
          placeholder="bisnismu"
        />
      </div>
    </div>
  );
}

// ---- Tiles + primitives ----

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
