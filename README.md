# sections-kit

Federated section types + renderers for the lalss editors:

- **mierakigai-crm-ops** — link-pages (`/l/<slug>`) and landing-pages (`/p/<slug>`).
- **anima-pos** — storefront webstore (`/s/<slug>/`).

## Why

Three editors used to ship parallel copies of the same renderers. They drifted twice in one day. This package owns the source of truth; the editors install it via a GitHub URL dependency and consume the kit's components + types directly.

## Scopes

Sections are tagged by which app they apply to:

```
src/
├── shared/      # available in link, landing, and webstore
│   ├── animation/   (Spline embed + CSS/SVG presets)
│   ├── banner/
│   ├── divider/
│   ├── footer/
│   ├── freeform/
│   └── motion.ts    (motion_intensity types + CSS helper)
├── link/        # link-pages only — top_header, links list, social_row, …
├── landing/     # landing+webstore — hero, editorial, inventory, quote, form, …
└── webstore/    # webstore only — catalog grid/list/editorial
```

Each app imports just the scopes it needs.

## Install

Each consumer adds the kit as a github URL dep, pinned to a commit:

```jsonc
// package.json
"dependencies": {
  "@lalss/sections-kit": "github:lalss-dev/sections-kit#<commit-sha>"
}
```

Floating to `#main` is fine for development; pin to a SHA for production deploys.

## Develop

```bash
npm install
npm run build
```

The `prepare` script auto-builds on install, so consumers get fresh `dist/` when they `npm install`.

## Roadmap

- [x] `shared/animation` — Spline embed + 6 CSS/SVG presets
- [x] `shared/motion.ts` — motion_intensity (off/subtle/normal/dramatic), page + per-section
- [ ] `shared/banner` — migrate from app copies
- [ ] `shared/divider`, `shared/freeform`, `shared/footer` — migrate
- [ ] `landing/*` — migrate landing-only kinds (hero, editorial, inventory, quote, form, canvas)
- [ ] `link/*` — migrate link-only kinds (top_header, links, social_row, subscribe, featured, embed, countdown)
- [ ] `webstore/catalog` — migrate webstore-only catalog renderers
