"use client";

import * as React from "react";
import {
  ANIMATION_3D_SCENE_META,
  ANIMATION_3D_SCENES,
  ANIMATION_PRESET_META,
  ANIMATION_PRESETS,
  COUNTER_LAYOUTS,
  MARQUEE_DIRECTIONS,
  MARQUEE_ROWS,
  MARQUEE_STYLES,
  THREE_D_INTERACTIVITY,
  TYPEWRITER_HIGHLIGHTS,
  type Animation3DScene,
  type AnimationPreset,
  type AnimationProps,
  type AnimationVariant,
  type CounterLayout,
  type CounterStat,
  type MarqueeDirection,
  type MarqueeRows,
  type MarqueeStyle,
  type ThreeDInteractivity,
  type TypewriterHighlight,
} from "../animation/types.js";

// Shared editor cluster for the Animation section's properties. Owned
// by the kit so PoS / CRM landing / CRM link-pages all stay in lockstep.
//
// Storage-agnostic: consumer passes the section's `props` and an
// onChange that receives the FULL next props object.
//
// `variant` is taken from the consumer (section.variant) so it never
// drifts from the wrapping section's variant.

export function AnimationSectionControls({
  variant,
  value,
  onChange,
}: {
  variant?: AnimationVariant;
  value: AnimationProps;
  onChange: (next: AnimationProps) => void;
}) {
  const v: AnimationVariant = variant ?? value.variant ?? "preset";
  const preset: AnimationPreset = value.preset ?? "counter";

  function patch(diff: Partial<AnimationProps>) {
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

      <HeightChips value={value.height_px} onChange={(v2) => patch({ height_px: v2 })} />

      <ColorPicker
        label="Color"
        value={value.color}
        onChange={(v2) => patch({ color: v2 })}
        helper="Leave empty to inherit the page theme accent."
      />

      <div>
        <Label>Caption</Label>
        <AutoGrowTextarea
          value={value.caption ?? ""}
          onChange={(v2) => patch({ caption: v2 || undefined })}
          placeholder="optional — small mono caps under the animation"
        />
      </div>
    </div>
  );
}

// ---- 3D / Spline variant ----

function SplineFields({
  value,
  patch,
}: {
  value: AnimationProps;
  patch: (diff: Partial<AnimationProps>) => void;
}) {
  const scene = value.spline_scene ?? "counter";
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

      {scene === "counter" && (
        <div className="mt-3 rounded-md border border-card-border bg-background/40 p-3">
          <CounterStatEditor
            stat={singleCounterStat(value)}
            onChange={(stat) => patchCounterStats(patch, [stat], "single")}
            heroLabels
          />
        </div>
      )}
      {scene === "stats" && (
        <div className="mt-3 space-y-2 rounded-md border border-card-border bg-background/40 p-3">
          <Helper>3 stat badges floating around a tilted plane. Edit each below.</Helper>
          {[0, 1, 2].map((i) => (
            <CounterStatEditor
              key={i}
              stat={(value.counter_stats ?? [])[i] ?? defaultStatForIndex(i)}
              onChange={(stat) => {
                const next = [...(value.counter_stats ?? [])];
                while (next.length < 3) next.push(defaultStatForIndex(next.length));
                next[i] = stat;
                patchCounterStats(patch, next.slice(0, 3), "trio");
              }}
              compact
              numberLabel={`Stat ${i + 1}`}
            />
          ))}
        </div>
      )}
      {scene === "card" && (
        <div className="mt-3 space-y-2 rounded-md border border-card-border bg-background/40 p-3">
          <div>
            <Label>Eyebrow (small caps)</Label>
            <input
              value={value.card_eyebrow ?? ""}
              onChange={(e) => patch({ card_eyebrow: e.target.value || undefined })}
              placeholder="BARU · 2026"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Headline</Label>
            <AutoGrowTextarea
              value={value.card_headline ?? ""}
              onChange={(s) => patch({ card_headline: s || undefined })}
              placeholder="Built for the next decade."
            />
          </div>
          <div>
            <Label>Subhead</Label>
            <AutoGrowTextarea
              value={value.card_subhead ?? ""}
              onChange={(s) => patch({ card_subhead: s || undefined })}
              placeholder="One supporting sentence about what's inside."
            />
          </div>
          <div>
            <Label>Tag (small chip)</Label>
            <input
              value={value.card_tag ?? ""}
              onChange={(e) => patch({ card_tag: e.target.value || undefined })}
              placeholder="READ THE LAUNCH NOTES"
              className={inputCls}
            />
          </div>
        </div>
      )}
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

      {scene !== "custom" && (
        <div className="mt-3">
          <Label>Interactivity</Label>
          <ChipRow
            options={THREE_D_INTERACTIVITY.map((m) => ({
              value: m,
              label: m === "off" ? "Off" : m === "subtle" ? "Subtle" : m === "normal" ? "Normal" : "Dramatic",
            }))}
            value={value.interactive_3d ?? "normal"}
            onChange={(m) => patch({ interactive_3d: m as ThreeDInteractivity })}
          />
          <Helper>Cursor parallax tilts the scene in 3D — Off keeps it static, Dramatic gives ±22° follow.</Helper>
        </div>
      )}
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
  const layout: CounterLayout = value.counter_layout ?? "single";
  const target = layout === "single" ? 1 : layout === "pair" ? 2 : 3;

  // Pull stats from the new array OR migrate the legacy single fields.
  const baseStats: CounterStat[] = value.counter_stats?.length
    ? value.counter_stats
    : [singleCounterStat(value)];
  const stats: CounterStat[] = [];
  for (let i = 0; i < target; i++) {
    stats.push(baseStats[i] ?? defaultStatForIndex(i));
  }

  function writeStats(next: CounterStat[]) {
    patchCounterStats(patch, next, layout);
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-card-border bg-background/40 p-3">
      <div>
        <Label>Layout</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {COUNTER_LAYOUTS.map((l) => {
            const active = layout === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => {
                  const newTarget = l === "single" ? 1 : l === "pair" ? 2 : 3;
                  const next: CounterStat[] = [];
                  for (let i = 0; i < newTarget; i++) {
                    next.push(stats[i] ?? defaultStatForIndex(i));
                  }
                  patchCounterStats(patch, next, l);
                }}
                title={LAYOUT_DESCRIPTIONS[l]}
                className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold capitalize transition-all ${
                  active
                    ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                    : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
        <Helper>{LAYOUT_DESCRIPTIONS[layout]}</Helper>
      </div>

      {stats.map((stat, i) => (
        <CounterStatEditor
          key={i}
          stat={stat}
          onChange={(next) => {
            const out = [...stats];
            out[i] = next;
            writeStats(out);
          }}
          numberLabel={target === 1 ? undefined : `Stat ${i + 1}`}
          compact={target > 1}
          heroLabels={target === 1}
        />
      ))}
    </div>
  );
}

const LAYOUT_DESCRIPTIONS: Record<CounterLayout, string> = {
  single: "One oversized hero number.",
  pair:   "Two stats side-by-side.",
  trio:   "Three stats in a row.",
};

function CounterStatEditor({
  stat,
  onChange,
  numberLabel,
  compact = false,
  heroLabels = false,
}: {
  stat: CounterStat;
  onChange: (next: CounterStat) => void;
  numberLabel?: string;
  compact?: boolean;
  heroLabels?: boolean;
}) {
  return (
    <div className={compact ? "rounded-md border border-card-border bg-card/50 p-2 space-y-2" : "space-y-2"}>
      {numberLabel && <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{numberLabel}</div>}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>{heroLabels ? "Prefix" : ""}</Label>
          <input
            value={stat.prefix ?? ""}
            onChange={(e) => onChange({ ...stat, prefix: e.target.value || undefined })}
            placeholder="Rp"
            className={inputCls}
          />
        </div>
        <div>
          <Label>{heroLabels ? "Number" : ""}</Label>
          <input
            type="number"
            min={0}
            value={stat.value ?? ""}
            onChange={(e) => onChange({ ...stat, value: Number(e.target.value) || 0 })}
            placeholder="5000"
            className={inputCls}
          />
        </div>
        <div>
          <Label>{heroLabels ? "Suffix" : ""}</Label>
          <input
            value={stat.suffix ?? ""}
            onChange={(e) => onChange({ ...stat, suffix: e.target.value || undefined })}
            placeholder="+"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <Label>{heroLabels ? "Label under number" : "Label"}</Label>
        <AutoGrowTextarea
          value={stat.label ?? ""}
          onChange={(v) => onChange({ ...stat, label: v || undefined })}
          placeholder="happy customers"
        />
      </div>
    </div>
  );
}

function singleCounterStat(value: AnimationProps): CounterStat {
  if (value.counter_stats && value.counter_stats[0]) return value.counter_stats[0];
  return {
    value: value.counter_value ?? 1000,
    prefix: value.counter_prefix,
    suffix: value.counter_suffix,
    label: value.counter_label,
  };
}

function defaultStatForIndex(i: number): CounterStat {
  return [
    { value: 5000, suffix: "+", label: "customers" },
    { value: 99, suffix: "%", label: "uptime" },
    { value: 24, suffix: "/7", label: "support" },
  ][i % 3];
}

function patchCounterStats(
  patch: (diff: Partial<AnimationProps>) => void,
  stats: CounterStat[],
  layout: CounterLayout,
) {
  const first = stats[0] ?? {};
  patch({
    counter_stats: stats,
    counter_layout: layout,
    // Mirror first-stat into legacy fields so older renderers keep working.
    counter_value: first.value,
    counter_prefix: first.prefix,
    counter_suffix: first.suffix,
    counter_label: first.label,
  });
}

function MarqueeFields({
  value,
  patch,
}: {
  value: AnimationProps;
  patch: (diff: Partial<AnimationProps>) => void;
}) {
  const speed = value.marquee_speed ?? "normal";
  const direction: MarqueeDirection = value.marquee_direction ?? "left";
  const rows: MarqueeRows = value.marquee_rows ?? 1;
  const style: MarqueeStyle = value.marquee_style ?? "clean";
  return (
    <div className="mt-3 space-y-3 rounded-md border border-card-border bg-background/40 p-3">
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
        <ChipRow
          options={[
            { value: "slow", label: "Slow" },
            { value: "normal", label: "Normal" },
            { value: "fast", label: "Fast" },
          ]}
          value={speed}
          onChange={(s) => patch({ marquee_speed: s as "slow" | "normal" | "fast" })}
        />
      </div>
      <div>
        <Label>Direction</Label>
        <ChipRow
          options={MARQUEE_DIRECTIONS.map((d) => ({
            value: d,
            label: d === "left" ? "← Left" : "Right →",
          }))}
          value={direction}
          onChange={(d) => patch({ marquee_direction: d as MarqueeDirection })}
        />
      </div>
      <div>
        <Label>Rows</Label>
        <ChipRow
          options={MARQUEE_ROWS.map((r) => ({ value: String(r), label: `${r} row${r === 1 ? "" : "s"}` }))}
          value={String(rows)}
          onChange={(r) => patch({ marquee_rows: (Number(r) as MarqueeRows) })}
        />
        {rows === 2 && (
          <Helper>Second row scrolls the opposite direction for visual balance.</Helper>
        )}
      </div>
      <div>
        <Label>Style</Label>
        <ChipRow
          options={MARQUEE_STYLES.map((s) => ({ value: s, label: s === "clean" ? "Clean" : "Pill" }))}
          value={style}
          onChange={(s) => patch({ marquee_style: s as MarqueeStyle })}
        />
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
  const highlight: TypewriterHighlight = value.typewriter_highlight ?? "underline";
  return (
    <div className="mt-3 space-y-3 rounded-md border border-card-border bg-background/40 p-3">
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
      <div>
        <Label>Highlight</Label>
        <ChipRow
          options={TYPEWRITER_HIGHLIGHTS.map((h) => ({
            value: h,
            label: h === "underline" ? "Underline" : h === "box" ? "Box" : h === "brackets" ? "[Brackets]" : "Gradient",
          }))}
          value={highlight}
          onChange={(h) => patch({ typewriter_highlight: h as TypewriterHighlight })}
        />
      </div>
    </div>
  );
}

// ---- Reusable primitives ----

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-all ${
              active
                ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                : "border-card-border bg-background text-muted hover:border-brand-purple/60 hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

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

// ---- Tiles + glyphs ----

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

const SCENE_GLYPH: Record<Animation3DScene, React.ReactNode> = {
  counter: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 18 L7 6 L11 18 Z" />
      <path d="M14 6 H19" />
      <path d="M14 12 H19" />
      <path d="M14 18 H19" />
    </svg>
  ),
  stats: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="14" rx="9" ry="3.5" />
      <rect x="3"  y="6" width="6" height="5" rx="1.5" />
      <rect x="9"  y="3" width="6" height="5" rx="1.5" />
      <rect x="15" y="6" width="6" height="5" rx="1.5" />
    </svg>
  ),
  card: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden>
      <path d="M5 6 L19 5 L20 18 L4 19 Z" />
      <path d="M7 10 L15 10" />
      <path d="M7 14 L13 14" />
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

const inputCls =
  "w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/30";

function Label({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
      {children}
    </div>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[10px] leading-relaxed text-muted">{children}</p>;
}
