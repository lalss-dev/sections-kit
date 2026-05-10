// Federated font system shared across PoS / CRM landing / CRM link-pages.
//
// Two responsibilities:
//   1. Primitives — LandingFontPick type, LANDING_FONTS preset catalog,
//      resolveFontStack, buildFontStylesheetHrefs, plus the @font-face
//      data: URL helpers used by the upload tab of FontChooser.
//   2. Single source of truth — replaces the per-app fonts.ts modules
//      that drifted (different export names, different preset lists,
//      different LandingFontPick shape).
//
// The editor-side <FontChooser> lives in `../editor/FontChooser.tsx`.

export type FontCategory = "sans" | "serif" | "display" | "handwriting" | "mono";

export type LandingFont = {
  key: string;
  family: string;
  category: FontCategory;
  weights: number[];
  // CSS font-family value (already wrapped in quotes + fallbacks).
  stack: string;
};

function fallbackFor(category: FontCategory): string {
  switch (category) {
    case "serif":       return "Georgia, 'Times New Roman', serif";
    case "mono":        return "ui-monospace, SFMono-Regular, Menlo, monospace";
    case "handwriting": return "cursive";
    default:            return "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  }
}

function buildStack(family: string, category: FontCategory): string {
  return `"${family}", ${fallbackFor(category)}`;
}

function f(key: string, family: string, category: FontCategory, weights: number[]): LandingFont {
  return { key, family, category, weights, stack: buildStack(family, category) };
}

// Curated Google Fonts catalog. Keep weights small (2-3 per family) so
// the loader payload stays under control.
export const LANDING_FONTS: LandingFont[] = [
  // Sans
  f("inter", "Inter", "sans", [400, 500, 600, 700]),
  f("poppins", "Poppins", "sans", [400, 500, 600, 700]),
  f("dm-sans", "DM Sans", "sans", [400, 500, 700]),
  f("montserrat", "Montserrat", "sans", [400, 500, 600, 700]),
  f("lato", "Lato", "sans", [400, 700]),
  f("nunito", "Nunito", "sans", [400, 600, 700]),
  f("work-sans", "Work Sans", "sans", [400, 500, 600, 700]),
  f("plus-jakarta-sans", "Plus Jakarta Sans", "sans", [400, 500, 600, 700]),
  // Serif
  f("playfair-display", "Playfair Display", "serif", [400, 600, 700]),
  f("lora", "Lora", "serif", [400, 500, 600, 700]),
  f("merriweather", "Merriweather", "serif", [400, 700]),
  f("cormorant-garamond", "Cormorant Garamond", "serif", [400, 500, 600]),
  f("dm-serif-display", "DM Serif Display", "serif", [400]),
  // Display / impact
  f("bebas-neue", "Bebas Neue", "display", [400]),
  f("oswald", "Oswald", "display", [400, 500, 700]),
  f("anton", "Anton", "display", [400]),
  // Handwriting
  f("caveat", "Caveat", "handwriting", [400, 700]),
  f("dancing-script", "Dancing Script", "handwriting", [400, 700]),
  // Mono
  f("space-mono", "Space Mono", "mono", [400, 700]),
  f("jetbrains-mono", "JetBrains Mono", "mono", [400, 500, 700]),
];

export const FONT_BY_KEY: Record<string, LandingFont> = Object.fromEntries(
  LANDING_FONTS.map((font) => [font.key, font]),
);

// Storage value for a font pick. Either a preset key string (resolves
// via FONT_BY_KEY) or a custom { family, href } pair from the editor's
// Upload or URL tab.
export type LandingFontPick =
  | string
  | { family: string; href: string };

// Build a single Google Fonts CSS2 URL loading every preset key in one
// request. Returns null when no presets are picked.
export function buildGoogleFontsHref(keys: (string | null | undefined)[]): string | null {
  const uniq = Array.from(new Set(keys.filter((k): k is string => !!k && k in FONT_BY_KEY)));
  if (uniq.length === 0) return null;
  const families = uniq
    .map((k) => {
      const ff = FONT_BY_KEY[k];
      const name = ff.family.replace(/ /g, "+");
      return `family=${name}:wght@${ff.weights.join(";")}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// Resolve a pick to a CSS font-family stack. Returns undefined when the
// pick is empty or invalid so callers can fall back to a default.
export function resolveFontStack(
  pick: LandingFontPick | null | undefined,
): string | undefined {
  if (!pick) return undefined;
  if (typeof pick === "string") return FONT_BY_KEY[pick]?.stack;
  if (!pick.family) return undefined;
  return `"${pick.family}", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
}

// Walk a list of picks (page-level + every section.font) and return the
// list of stylesheet URLs to inject. Preset keys collapse into one
// consolidated Google Fonts URL; each custom href emits its own <link>.
// Order-preserving + deduped.
export function buildFontStylesheetHrefs(
  picks: ReadonlyArray<LandingFontPick | null | undefined>,
): string[] {
  const presetKeys: string[] = [];
  const customHrefs: string[] = [];
  for (const p of picks) {
    if (!p) continue;
    if (typeof p === "string") presetKeys.push(p);
    else if (p.href) customHrefs.push(p.href);
  }
  const hrefs: string[] = [];
  const presetHref = buildGoogleFontsHref(presetKeys);
  if (presetHref) hrefs.push(presetHref);
  for (const h of customHrefs) if (!hrefs.includes(h)) hrefs.push(h);
  return hrefs;
}

// ---- @font-face data URL helpers (used by FontChooser's Upload tab) ----
//
// When a user uploads a font file, we get a public URL from object
// storage. Browsers won't apply that file as a font without a
// stylesheet — so we synthesize a data:text/css URL containing one
// @font-face rule pointing at the public URL. That data: URL becomes
// the LandingFontPick.href.

export function fontFormatFor(filename: string): string {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  if (ext === "ttf") return "truetype";
  if (ext === "otf") return "opentype";
  return "truetype";
}

export function buildFontFaceDataUrl(
  family: string,
  fileUrl: string,
  filename: string,
): string {
  const format = fontFormatFor(filename);
  const css =
    `@font-face{font-family:'${family.replace(/'/g, "\\'")}';` +
    `src:url('${fileUrl}') format('${format}');` +
    `font-display:swap;}`;
  return `data:text/css;charset=utf-8,${encodeURIComponent(css)}`;
}

export function familyFromFilename(filename: string): string {
  return filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractFontUrlFromDataCss(href: string): string | null {
  if (!href.startsWith("data:text/css")) return null;
  const decoded = (() => {
    try {
      const idx = href.indexOf(",");
      return idx >= 0 ? decodeURIComponent(href.slice(idx + 1)) : "";
    } catch {
      return "";
    }
  })();
  const match = decoded.match(/url\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : null;
}

export function extractFontFilename(href: string): string {
  const url = extractFontUrlFromDataCss(href);
  if (!url) return "";
  return url.split("/").pop() ?? "";
}
