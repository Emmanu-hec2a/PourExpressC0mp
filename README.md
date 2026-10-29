# PourXpress public website

Local-only redesign of the public website. Production customer/rider apps,
merchant dashboard, backend and Super Admin portal are outside this repository's
changes. Nothing has been deployed.

## Develop and verify

Use a Node version supported by the locked Vite release (8.2.4:
Node ^20.19 or >=22.12). The implementation was verified on Node 20.20.2;
confirm a supported compatible runtime for your CI. Free disk space first:
the final optional Lighthouse install encountered ENOSPC on C:.

```powershell
npm ci
npm run dev
```

```powershell
npm run lint
npm test
npm run build
npm run test:browser
npm run preview
```

Preview: http://127.0.0.1:4173. This serves built static pages with real 404s,
rather than falling back to the homepage for every request.

Browser checks require installed Chrome. To use another Chrome binary:

```powershell
$env:POUR_SMOKE_CHROME = 'C:\path\to\chrome.exe'
npm run test:browser
Remove-Item Env:POUR_SMOKE_CHROME
```

The supplied browser script uses Node 20's experimental WebSocket flag; Node 22+
also works. It starts and stops its own loopback server/browser, blocks external
requests and submissions, and tests the **built** output. Optional screenshots:

```powershell
$env:POUR_WEBSITE_SCREENSHOTS = Join-Path $env:TEMP 'pourexpress-website-review'
npm run test:browser
Remove-Item Env:POUR_WEBSITE_SCREENSHOTS
```

## Structure

- `src/pages/`: 11 independently composed public pages.
- `src/components/`: shared layout, navigation, FAQs and download actions.
- `src/config/site.js`: approved URLs, shared customer/rider Android listing,
  honest iOS status, asset references and content publication flags.
- `src/config/routes.js`: route manifest and page metadata.
- `src/content/`: shared pricing, navigation and FAQs.
- `src/index.css`: forest-green/cream/orange design system and responsive rules.
- `scripts/prerender.mjs`: builds HTML, 404, sitemap and robots.
- `scripts/preview.mjs`: local static preview with exact-case routes.
- `scripts/generate-qr.mjs`: offline QR from the approved Play URL.
- `scripts/prepare-assets.ps1`: Windows image optimization; input rider/tracking
  files must already be redacted. It is not a privacy-redaction tool.
- `tests/`: content, metadata, static-output and preview-server tests.

The customer and rider download destinations intentionally match:
https://play.google.com/store/apps/details?id=com.pourexpress.sip.
App Store is coming soon with no guessed URL or launch date.

## Build and hosting contract

`npm run build` makes static route folders in `dist/`, plus `404.html`,
`sitemap.xml`, `robots.txt` and hashed assets. Upload **dist only** after separate
deployment approval. `.prerender/` is build-time output, not a hosted Node service.
Do not run `scripts/prerender.mjs` twice against already prerendered output;
rerun the full build instead.

Actual hosting/provider settings have not been changed or verified. The host
must serve each known route's `index.html` on direct load/refresh, send unknown
pages to `404.html` **with HTTP 404**, and never return homepage HTML for missing
assets. Test both slash forms and choose a consistent host-level redirect policy.
Keep the existing /about, /privacy and /terms addresses.

For a noindex preview build:

```powershell
$env:SITE_PREVIEW = '1'
npm run build
Remove-Item Env:SITE_PREVIEW
npm run preview
```

A normal subsequent `npm run build` is needed to restore production indexability.
Noindex/robots is **not authentication or privacy protection**.

Before releasing: confirm host HTTPS, security headers, HTML revalidation,
immutable caching for hashed assets, canonical origin, real 404s and rollback.
Do not infer production behavior from local preview tests. No provider config
or deployment has been guessed.

## Content and image safety

Only owner-approved contact URLs/prices were used. Terms fees were aligned
with explicit permission; production billing was not changed. Existing Privacy
and other Terms claims remain and need content/legal-owner review. Account
deletion guidance is withheld until the existing process is verified.

Only redacted rider/tracking derivatives belong in public assets. Never copy
the supplied private originals into `public/`. App screenshots illustrate the
app, not current website inventory/prices. The generated About image is labelled
illustrative, not a real product listing.

See [ASSET_PROVENANCE.txt](ASSET_PROVENANCE.txt) for saved paths, sources and
built-in image-edit prompt specifications.

## Handover

### Search appearance and brand assets

The approved public brand is **PourXpress**. **PourExpress** is retained only
as a recognized alternate name in structured data. Domains, app identifiers,
merchant destinations, pricing and production product code are unchanged.

The canonical homepage includes a single initial-HTML WebSite node plus
Organization data. Client navigation adds/removes the homepage node correctly.
Favicon: /images/favicon.png (96x96); editable vector: /images/brand-mark.svg;
Apple touch icon: /images/apple-touch-icon.png (180x180). The main truck logo
is retained. To regenerate the code-native icons and sharing card on Windows:

```powershell
powershell -NoProfile -File scripts/prepare-brand-assets.ps1
```

After separately approved website deployment, inspect the homepage in Google
Search Console, test the live URL, then request indexing. Google decides the
displayed site name/favicon; updates require recrawling and are not guaranteed.
See [site-name guidance](https://developers.google.com/search/docs/appearance/site-names)
and [favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search).
Do not submit indexing requests or deploy as part of a local build.

[Implementation and verification report](POUREXPRESS_WEBSITE_IMPLEMENTATION_REPORT.txt)
contains exact completed checks, security/bundle results, manual-review limits
and the release checklist. See also the [original plan and implementation
addendum](POUREXPRESS_WEBSITE_REDESIGN_IMPLEMENTATION_PLAN.txt).
