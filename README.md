# Vastu Vihar — Purnea Lead Generation Landing Page

Static HTML5 + CSS3 + Vanilla JS campaign page. No frameworks, no build step —
deploy the `purnea/` folder as-is to `vastuvihar.org/purnea/`.

## 1. Before going live

Open `script.js` and fill in `CONFIG` at the top of the file:

| Key | What to put there |
|---|---|
| `leadApiUrl` | Your backend endpoint that accepts `POST` JSON lead payloads. Leave blank during QA — leads log to the browser console instead of failing silently. |
| `whatsappNumber` | WhatsApp number in international format, digits only (e.g. `919534095250`). Currently set to the Vastu Vihar customer care number `919534095340` as a placeholder — replace with the Purnea team's WhatsApp number. |
| `phoneNumber` | `tel:` number, e.g. `+919534095340`. |
| `googleAdsConversionId` / `googleAdsConversionLabel` | From Google Ads → Conversions. |
| `metaPixelId` | From Meta Events Manager. |
| `gaMeasurementId` | GA4 property, format `G-XXXXXXXXXX`. |
| `mapEmbedUrl` | A Google Maps "Embed a map" iframe `src` URL for the Purnea site. Until set, the map area shows a placeholder message instead of a broken/fake map. |
| `directionsUrl` | Google Maps directions URL. A generic search-by-name URL is set as a placeholder. |

No API keys or secrets belong in `script.js` — it's public, client-side code.
`leadApiUrl` should point at a backend that itself holds any required secrets.

## 2. Assets — currently hotlinked, self-host before running paid traffic

The page's network sandbox couldn't download binary image files directly, so
the logo and property/gallery photos are **temporarily hotlinked** straight
from the live `vastuvihar.org` site (real, existing assets — nothing
invented). This makes the page look correct out of the box, but hotlinking
is not production-safe: it depends on the old site staying up, its server
allowing cross-site image requests, and it adds an extra DNS/TLS hop that
slows down ad-traffic load times.

**Before running paid traffic**, download each file below and swap the `src`
in `index.html` to the matching local path in `assets/images/`:

| Used for | Current (hotlinked) source | Save as |
|---|---|---|
| Header logo | `https://www.vastuvihar.org/images/VastuNewlogo.png` | `assets/images/logo.png` |
| Footer logo | `https://www.vastuvihar.org/images/VastuNewlogoFooter.png` | `assets/images/logo-white.png` |
| Purnia Phase-1 card + OG/Twitter share image | `https://www.vastuvihar.org/Project_Bihar/Purnia/PH-01/1.jpg` | `assets/images/property-purnia-phase-1.jpg` and `assets/images/og-purnea.jpg` |
| Purnia Phase-2 card | `https://www.vastuvihar.org/Project_Bihar/Purnia/PH-02/1.jpg` | `assets/images/property-purnia-phase-2.jpg` |
| Gallery 1–3 | `.../Purnia/PH-01/2.jpg`, `3.jpg`, `4.jpg` | `assets/images/gallery/purnia-1.jpg`…`3.jpg` |
| Gallery 4–6 | `.../Purnia/PH-02/2.jpg`, `3.jpg`, `4.jpg` | `assets/images/gallery/purnia-4.jpg`…`6.jpg` |

Additional real photos are available if you want a bigger gallery or want to
swap in specific house models — visible on the live
[Purnia project page](https://www.vastuvihar.org/Project_Bihar/Purnia.aspx):

- Model photos: `extra-images/Jayanti/home.JPG`, `extra-images/Yamuna/home.JPG`, `extra-images/Simplex/home.JPG`, `extra-images/Ganga_Flat/home.JPG`, `extra-images/Chota_Flat/home.JPG`, `extra-images/Godawari/home.JPG`
- Full gallery: `Project_Bihar/Purnia/PH-01/1.jpg` through `12.jpg`, and `Project_Bihar/Purnia/PH-02/1.jpg` through `12.jpg`

No `favicon.png` was available to hotlink (not present at a stable URL on the
old site) — add one manually to `assets/icons/`.

Once real assets are self-hosted, use WebP where possible and keep files
under ~200KB for fast ad-traffic load times. The page degrades gracefully
(fallback text/logo, no broken-image icons) if any path is missing, so it's
safe to deploy at any stage of asset readiness.

## 3. Property & content data

Property names, configurations, addresses and contact numbers were sourced
from the live Purnia Phase-1 and Phase-2 project pages on vastuvihar.org.
Update `index.html` directly (search for `property-card`) if pricing,
availability, or project details change — everything is in plain HTML, no CMS.

## 4. Tracking / GTM

All key actions push to `window.dataLayer` (`page_view`, `form_start`,
`generate_lead`, `whatsapp_click`, `phone_click`, `site_visit_request`,
`view_property`), so you can connect Google Tag Manager without further code
changes. GA4, Meta Pixel and Google Ads conversion tracking load automatically
once their IDs are set in `CONFIG` — no code changes needed.

First-touch and last-touch UTM attribution (`utm_source`, `utm_medium`,
`utm_campaign`, `utm_content`, `utm_term`) is captured in `localStorage` and
sent with every lead, so you can report cost-per-lead and conversion rate by
platform/campaign/creative.

## 5. Header/branding refinement (latest pass)

The header, logo and hero were refined for closer alignment with Vastu
Vihar's official branding — no HTML structure, sections, forms, or JS were
rewritten:

- Logo stays pinned left via `.logo { margin-right: auto; flex-shrink: 0; }`,
  scaled with `width` + `height: auto` at each breakpoint (165px desktop →
  148px ≤1024px → 138px ≤768px → 126px ≤480px → 118px ≤390px), so it never
  stretches or distorts.
- Header keeps its cream/white sticky background but gained a subtle
  `box-shadow` alongside the existing border for more depth.
- Hero background gradients were softened (opacity reduced) for a calmer,
  more premium feel rather than a busy multi-gradient look.
- Added `overflow-x: hidden` on `html`/`body` as a safety net against
  horizontal scroll at narrow widths (360–390px).

All existing IDs, classes, form logic, tracking calls, and `script.js` are
unchanged.

## 6. Files

```
purnea/
├── index.html      — all markup, SEO tags, schema.org JSON-LD
├── style.css        — design tokens + all styling, no external CSS framework
├── script.js         — CONFIG, tracking, UTM capture, form validation/submit, UI
├── README.md
└── assets/
    ├── images/
    └── icons/
```
