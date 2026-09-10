# Panwar Knitwear — website

A premium redesign of [panwarknitwear.com](https://panwarknitwear.com/).
Plain HTML, CSS and JavaScript — no build step, no framework, no npm install.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 5599
```

Then visit `http://localhost:5599`.

## Files

```
index.html        All markup, in numbered sections (1–20) matching the page order.
css/style.css     All styling, in numbered blocks (1–20). Design tokens are at the top.
js/data.js        The product catalogue + fabric list. Edit content here.
js/main.js        All behaviour, one small init function per feature.
robots.txt        Crawler policy.
sitemap.xml       Single-page sitemap.
```

## Changing things

**Colours, fonts, spacing** — `css/style.css`, block 1 (`:root`). Everything else
uses those variables, so changing `--accent` re-themes the whole site.

```css
--ink:    #08080a;   /* page background */
--bone:   #f5f3ef;   /* text            */
--accent: #c9a86a;   /* champagne gold  */
```

The `--nav-h` token is both the navbar height and the `scroll-padding-top` used
to keep anchor targets clear of the fixed header — change it in one place.

**Products** — `js/data.js`. Copy an object in the `PRODUCTS` array and change the
fields. Order in the array is the order on the page; the first five are the articles
the original homepage featured.

```js
{
  id: "unique-slug",
  name: "Product name",
  brand: "ZONIXA",
  category: "Hoodies",              // must be one of CATEGORIES
  image: "https://…/photo.jpg",
  article: "Article name",          // leave "" to hide the row in the modal
  material: "320 GSM Superior Quality Fabric",
  colors: "Multiple Color Options",
  sizes: ["L", "XL", "XXL"],
  description: "…",
  tags: ["320 GSM"]                 // shown as chips, also searchable
}
```

Empty fields are simply omitted from the product modal, so it's safe to leave
anything blank rather than filling it with a guess.

**Category filter buttons** — the `CATEGORIES` array in `js/data.js`. Counts are
computed automatically.

**Phone number used by every WhatsApp link** — `WA_NUMBER` at the top of
`js/main.js` (currently the bulk-order line, `+91 98157 03769`).

**Switching a feature off** — delete its call from the `BOOT` block at the bottom of
`js/main.js`. Each feature is independent.

## The quote form

The form does not post anywhere. On submit it assembles the filled fields into a
readable message and opens WhatsApp to the bulk-order number. This was chosen
because the original site's contact form posted to `send_mail.php` using the
placeholder address `email@example.com` — there is no real email address to send to.

To wire it to a real backend instead, replace the `window.open(...)` call in
`initQuoteForm()` (`js/main.js`) with a `fetch()` POST to your endpoint.

## Content sourcing

All company information, product names, photography, fabric names, descriptions,
leadership names, phone numbers and external links come from panwarknitwear.com.

Deliberately **not** included, because the existing site does not publish them:

- Certifications or compliance marks
- Client or customer names
- Production capacity, staff count, years in business, order volumes
- Testimonials or review quotes
- Prices (the source site shows the same placeholder `$29.99` on every product)

The four animated statistics use only figures countable from the source site:
2 brands, 8 fabrics, 29 catalogue articles, 320 GSM heaviest fabric weight.

In place of a testimonials section, the "Where To Find Us" block links to the
company's real third-party profiles (IndiaMart, JustDial, Google Maps, Instagram,
LinkedIn, Quora) where genuine reviews already live.

The MSP Sports bottom-wear range is presented with its real description and product
types but no photographs — the original site used unrelated stock images as
placeholders there, so those were not carried over. The range is set as a
typographic index instead.

### About the three editorial images

`who-we-are.jpg`, `our-craftsmanship.jpg` and `our-leadership.jpg` are generic
stock pictures on the source site (boardroom silhouettes and a tailoring
flat-lay), not photographs of the company. They are all still used, in the About
cards, but the gallery is filled with the real catalogue photography only —
a stock boardroom silhouette under a heading that promises the factory floor
worked against the site rather than for it.

They are also wide banner strips (500×160 and 1072×160), so they are shown in
wide, shallow frames. Putting them in tall or square boxes crops most of the
image away and upscales the rest.

## Image handling

Every photograph is hotlinked from `panwarknitwear.com`, so:

- `<link rel="preconnect">` opens that connection during head parsing.
- The hero image the page paints first is preloaded with `fetchpriority="high"`.
- Everything below the fold is `loading="lazy"` and `decoding="async"`.
- Every `<img>` carries `width`/`height`, so nothing shifts as images arrive.
- Frames use the files' own aspect ratios (`982/1147` for catalogue shots,
  `3/1` for the banner strips), so no image is upscaled.

The catalogue files are 982×1147 and are displayed at roughly a quarter of that,
so the one remaining win would be serving resized copies. That needs the images
re-hosted rather than hotlinked, which is a deployment decision, not a code one.

## Accessibility & performance notes

- Skip link to the main content.
- `scroll-padding-top` keeps every anchor target clear of the fixed navbar.
- The product modal and the lightbox are real dialogs: focus moves in, is
  trapped while open, and returns to whatever opened them.
- The mobile menu is `inert` while closed and focus-trapped while open.
- Category filters are toggle buttons with `aria-pressed` (they are not tabs —
  there is no panel per category).
- Result counts are announced through an `aria-live` region.
- Text colours are kept at or above 4.5:1 against the page background.
- Tap targets on touch screens are at least 32px, and 44px in the navbar.
- All animation is disabled under `prefers-reduced-motion: reduce`.
- The hero's idle animation stops when it scrolls off screen or the tab is hidden.
- Scroll handlers are throttled to one animation frame.
- Modal and lightbox close on Escape; the lightbox also takes arrow keys and swipes.
- Reveal animations and the animated counters both have timer-based fallbacks, so
  content still appears if `IntersectionObserver` or `requestAnimationFrame`
  never runs (a background or occluded window throttles both).

## SEO

- Organization and FAQPage structured data are in the markup; an ItemList of the
  catalogue is generated from `PRODUCTS` at runtime by `initProductSchema()`.
- Open Graph and Twitter card tags, including `og:image:alt`.
- `robots.txt` and `sitemap.xml`.

Structured data describes only what the page actually shows — no prices, ratings,
availability or review counts, since the source site publishes none of them.
