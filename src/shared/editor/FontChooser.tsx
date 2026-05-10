"use client";

import * as React from "react";
import {
  LANDING_FONTS,
  buildFontFaceDataUrl,
  extractFontFilename,
  extractFontUrlFromDataCss,
  familyFromFilename,
  resolveFontStack,
  type LandingFontPick,
} from "../fonts/index.js";

// Federated font chooser used everywhere a per-page or per-section
// font is picked. Three tabs:
//
//   Catalog — preset dropdown, grouped by sans/serif/display/etc
//   Upload  — pick a .woff2 / .woff / .ttf / .otf, hand it to the
//             consumer-supplied onUpload callback (which uploads to
//             whatever Supabase bucket that app owns), then synthesize
//             an @font-face data URL pointing at the returned public URL
//   URL     — paste any stylesheet URL (Google Fonts CSS2, Adobe Fonts,
//             self-hosted) + the matching font-family name
//
// Storage-agnostic: the kit doesn't import @supabase/* or any app
// state. Each consumer plugs in `onUpload` which returns
// { publicUrl, filename } so the chooser can build the @font-face
// data URL itself.

export type FontUploadResult = {
  publicUrl: string;
  filename: string;
};

export function FontChooser({
  label,
  value,
  onChange,
  onUpload,
  previewText = "The quick brown fox",
  previewSize = 18,
  previewWeight = 500,
}: {
  label: string;
  value: LandingFontPick | undefined;
  onChange: (pick: LandingFontPick | undefined) => void;
  // Uploads the font file to the consumer's storage and returns the
  // public URL so the chooser can build the @font-face data URL. When
  // omitted, the Upload tab shows a "not configured" message.
  onUpload?: (file: File) => Promise<FontUploadResult>;
  previewText?: string;
  previewSize?: number;
  previewWeight?: number;
}) {
  const isCustom = !!value && typeof value === "object";
  const isUploaded = isCustom && value.href.startsWith("data:");
  const [tab, setTab] = React.useState<"preset" | "upload" | "custom">(
    isUploaded ? "upload" : isCustom ? "custom" : "preset",
  );
  const customFamily = isCustom ? value.family : "";
  const customHref = isCustom ? value.href : "";
  const presetKey = !isCustom && typeof value === "string" ? value : "";

  const [uploading, setUploading] = React.useState(false);
  const [uploadErr, setUploadErr] = React.useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    isUploaded ? extractFontUrlFromDataCss(customHref) : null,
  );
  const [uploadedFilename, setUploadedFilename] = React.useState<string>(
    isUploaded ? extractFontFilename(customHref) : "",
  );

  const stack = resolveFontStack(value);

  async function handleUpload(file: File) {
    if (!onUpload) {
      setUploadErr("Upload isn't configured for this app yet.");
      return;
    }
    setUploadErr(null);
    setUploading(true);
    try {
      const { publicUrl, filename } = await onUpload(file);
      const family = customFamily || familyFromFilename(filename);
      const href = buildFontFaceDataUrl(family, publicUrl, filename);
      setUploadedFileUrl(publicUrl);
      setUploadedFilename(filename);
      onChange({ family, href });
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  function rebuildHrefForUpload(nextFamily: string) {
    if (!uploadedFileUrl || !uploadedFilename) return;
    if (!nextFamily) {
      onChange(undefined);
      return;
    }
    onChange({
      family: nextFamily,
      href: buildFontFaceDataUrl(nextFamily, uploadedFileUrl, uploadedFilename),
    });
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        <div className="inline-flex overflow-hidden rounded-md border border-card-border text-[10px] font-semibold uppercase tracking-wider">
          {(["preset", "upload", "custom"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-2 py-0.5 transition-colors ${
                tab === t
                  ? "bg-brand-purple text-white"
                  : "bg-background text-muted hover:bg-background/60 hover:text-foreground"
              }`}
            >
              {t === "preset" ? "Catalog" : t === "upload" ? "Upload" : "URL"}
            </button>
          ))}
        </div>
      </div>

      {tab === "preset" && (
        <select
          value={presetKey}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-brand-purple"
        >
          <option value="">Default</option>
          {(["sans", "serif", "display", "handwriting", "mono"] as const).map((cat) => {
            const items = LANDING_FONTS.filter((f) => f.category === cat);
            if (items.length === 0) return null;
            return (
              <optgroup key={cat} label={cat[0].toUpperCase() + cat.slice(1)}>
                {items.map((f) => (
                  <option key={f.key} value={f.key}>{f.family}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
      )}

      {tab === "upload" && (
        <div className="grid gap-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-card-border bg-background px-3 py-3 text-xs font-semibold text-muted transition-colors hover:border-brand-purple hover:bg-brand-purple/5 hover:text-foreground">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 11V2m0 0L4 6m4-4l4 4" />
              <path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
            </svg>
            <span>
              {uploadedFilename
                ? `Replace · ${uploadedFilename}`
                : uploading
                  ? "Uploading…"
                  : "Pick a font file (.woff2 / .woff / .ttf / .otf)"}
            </span>
            <input
              type="file"
              accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf,application/font-woff2,application/font-woff,application/x-font-ttf,application/x-font-otf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
                e.currentTarget.value = "";
              }}
              className="hidden"
              disabled={uploading || !onUpload}
            />
          </label>
          {!onUpload && (
            <p className="text-[11px] leading-relaxed text-muted">
              Upload isn&apos;t wired up for this editor yet. Use the URL tab to paste a stylesheet link instead.
            </p>
          )}
          {uploadErr && <p className="text-[11px] text-red-500">Upload failed: {uploadErr}</p>}
          {uploadedFileUrl && (
            <input
              value={customFamily}
              onChange={(e) => rebuildHrefForUpload(e.target.value.trim())}
              placeholder="What should we call this font? (e.g. Brand Sans)"
              className="w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-brand-purple"
            />
          )}
          <p className="text-[10px] leading-relaxed text-muted">
            .woff2 is best for the web. We&apos;ll host the file and apply it wherever this picker is used.
          </p>
        </div>
      )}

      {tab === "custom" && (
        <div className="grid gap-1.5">
          <input
            value={customFamily}
            onChange={(e) => {
              const family = e.target.value.trim();
              if (!family && !customHref) onChange(undefined);
              else onChange({ family, href: customHref });
            }}
            placeholder="Family name (e.g. Open Sans)"
            className="w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-brand-purple"
          />
          <input
            value={customHref}
            onChange={(e) => {
              const href = e.target.value.trim();
              if (!customFamily && !href) onChange(undefined);
              else onChange({ family: customFamily, href });
            }}
            placeholder="Stylesheet URL (Google Fonts CSS2, Adobe Fonts, etc.)"
            className="w-full rounded-md border border-card-border bg-background px-2 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-brand-purple"
          />
          <p className="text-[10px] leading-relaxed text-muted">
            Paste the CSS URL Google/Adobe gives you and the exact{" "}
            <code>font-family</code> name (case-sensitive).
          </p>
        </div>
      )}

      <div
        className="mt-2 rounded-md border border-card-border bg-background px-3 py-2 text-foreground"
        style={{
          fontFamily: stack ?? "inherit",
          fontSize: previewSize,
          fontWeight: previewWeight,
          lineHeight: 1.2,
        }}
      >
        {previewText}
      </div>
    </div>
  );
}
