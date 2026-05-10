# appstore-screenshots-generator

A small Next.js app for designing and exporting localized iOS App Store screenshots.
Pick a template, drop in your app screenshots, write your copy per locale, choose an
iPhone or iPad size, and export PNGs at the exact dimensions Apple requires.

The repo ships with a generic 6-slide example (in English and German) that points
every slide at a single placeholder image, so a fresh clone renders without any
per-app assets. Swap [`public/content/config.json`](public/content/config.json)
and drop your screenshots into `public/content/screenshots/` to make it yours.

## Features

- 14 layout templates (Center Stage, Dual Showcase, Right/Left Caption, Light Right,
  Glass Card, Bold Type, Angled Duo, Light Bold Left, Feature Steps, etc.)
- iPhone 17 Pro Max and iPad Pro mockups out of the box; upload your own from the UI
- All Apple-required sizes: iPhone 6.9" / 6.5" / 6.3" / 6.1" and iPad 13" / 12.9"
  in both portrait and landscape
- Per-locale copy and images, with a side-by-side editor and live preview
- Single-slide / single-locale / batch (every locale × every slide) export
- Config import/export so you can version-control your slides as JSON

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3002.

## Customize the content

```
public/
  example-screenshot.jpg   # tracked placeholder used by the default config
  content/
    config.json            # locales + slides (copy, image paths, template ids)
    screenshots/           # your app screenshots — gitignored, drop yours here
```

The default `config.json` references `/example-screenshot.jpg` for every slide
so a fresh clone renders without any per-app assets. Replace with your own
screenshots (any `/content/screenshots/...` path or a `data:` URL) and the
editor picks them up immediately.

### `public/content/config.json` shape

```jsonc
{
  "locales": [
    { "code": "en", "name": "English" },
    { "code": "de", "name": "Deutsch" }
  ],
  "activeLocale": "en",
  "slides": [
    {
      "id": "slide-1",
      "slug": "feature-one",          // used in exported PNG filenames
      "templateId": "dual-showcase",  // see template ids below
      "content": {
        "en": {
          "menuLabel": "01",
          "eyebrow": "Feature One",
          "title": ["Two phones,", "one big idea."],
          "body": "A short sentence that sells the feature in one breath.",
          "chips": ["Tag", "Tag", "Tag"]
        },
        "de": { /* ... same shape per locale ... */ }
      },
      "images": {
        "en": {
          "primary":   "/example-screenshot.jpg",
          "secondary": "/example-screenshot.jpg"
        },
        "de": { /* ... */ }
      }
    }
  ]
}
```

The shape is validated at boot — if a required field is missing the dev server fails
with a precise message pointing at the problem.

### Template IDs

`center-stage`, `dual-showcase`, `right-caption`, `left-caption`, `light-right`,
`split-vertical`, `gradient-overlay`, `minimal-float`, `bold-type`, `glass-card`,
`top-phone`, `angled-duo`, `light-bold-left`, `feature-steps`.

Pick the right `phoneCount` for your slide: `dual-showcase` and `angled-duo` use
both `images.<locale>.primary` and `images.<locale>.secondary`; the others only
need `primary`.

### Replacing screenshots

Drop your `.jpg` / `.png` files into `public/content/screenshots/` (gitignored,
so per-deployment uploads stay out of the repo) and reference them from
`config.json` with the `/content/screenshots/...` URL prefix. The bundled
`/example-screenshot.jpg` placeholder lives at `public/example-screenshot.jpg`
and is the only image committed to git by default. Image paths starting with
`data:` (e.g. paste from clipboard via the editor) are also accepted and
round-tripped via the JSON import/export.

## Exporting

The toolbar Export button gives you three modes:

- **Current Slide** — exports just the active slide for the active locale
- **Current Locale** — exports every slide for the active locale
- **All Locales** — exports every slide × every locale (e.g. 6 slides × 2 locales = 12 PNGs)

Filenames follow `<index>-<slug>-<locale>-iphone-<mockup-slug>-<WxH>.png`.

## Layout adjustments

System defaults (theme colors, typography, mockups, App Store size presets) live
in [`src/lib/defaults.ts`](src/lib/defaults.ts) — edit there if you want different
brand colors, font sizes, or to add a new mockup. Per-template positioning lives
in [`src/lib/templates.tsx`](src/lib/templates.tsx).

## Development

```bash
npm run dev          # Next.js dev server on :3002
npx tsc --noEmit     # typecheck
npx playwright test  # full e2e suite (26 tests)
```

## Tech stack

- Next.js 16 (webpack) + React 19
- [`html-to-image`](https://github.com/bubkoo/html-to-image) for rasterizing the canvas
- Playwright for e2e
- No external state library — single config object in React context

## License

MIT.
