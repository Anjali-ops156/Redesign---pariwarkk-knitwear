# Panwar Knitwear — website

A premium, multi-page redesign of [panwarknitwear.com](https://panwarknitwear.com/).
Plain HTML, CSS and JavaScript — no build step, no framework, no npm install,
no backend and no database. Everything is static frontend.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 5599
```

Then visit `http://localhost:5599`.

## Pages

```
index.html        Home - hero, stats, brand tiles, 8 featured articles,
                  process teaser, bulk CTA, gallery strip, listings.
products.html     Full ZONIXA catalogue - 29 articles, search, category
                  filters, product detail modal.
brands.html       ZONIXA (top wear) and MSP Sports (bottom wear) in full.
about.html        Who we are, leadership, the 7-stage process, quality,
                  the fabric library, why choose us.
gallery.html      All 29 catalogue photographs with a keyboard- and
                  swipe-driven lightbox.
contact.html      Contact numbers, the WhatsApp quote form, and the FAQ.
```

Supporting files:

```
css/style.css     All styling, in numbered blocks. Design tokens at the top.
js/data.js        The product catalogue + fabric list. Edit content here.
js/main.js        All behaviour, one small init function per feature.
robots.txt        Crawler policy.
sitemap.xml       Lists all six pages.
```

### Shared header and footer

The navbar, mobile menu and footer markup are repeated in each page. With no
build step there is no include mechanism, and injecting them with JavaScript
would leave the nav missing for crawlers and for anyone without JS.

They were generated from one shared template so they start identical. **If you
edit the nav or footer, edit it in all six pages.** A quick check:

```bash
grep -c 'foot__col' *.html
```

Each page marks its own nav link with `class="active" aria-current="page"`.

## Changing things

**Colours, fonts, spacing** — `css/style.css`, block 1 (`:root`). Everything else
uses those variables, so changing `--accent` re-themes the whole site.

```css
--ink:    #08080a;   /* page background */
--bone:   #f5f3ef;   /* text            */
--accent: #c9a86a;   /* champagne gold  */
```

`--nav-h` is both the navbar height and the `scroll-padding-top` that keeps
anchor targets clear of the fixed header — change it in one place.

**Products** — `js/data.js`. Copy an object in the `PRODUCTS` array and change the
fields. Order in the array is the order on the page.

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

Empty fields are omitted from the product modal, so it is safe to leave anything
blank rather than filling it with a guess.

**Category filter buttons** — the `CATEGORIES` array in `js/data.js`. Counts are
computed automatically.

**Phone number used by every WhatsApp link** — `WA_NUMBER` at the top of
`js/main.js` (currently the bulk-order line, `+91 98157 03769`).

**How many articles the home page shows** — the `data-limit` attribute on
`#pgrid` in `index.html`. The same attribute on `#ggrid` sets the gallery strip.
A grid with no `data-limit` renders the whole set, which is how `products.html`
and `gallery.html` work.

**Switching a feature off** — delete its call from the `BOOT` block at the bottom
of `js/main.js`. Each feature is independent and every one exits quietly on
pages where its markup is absent, which is what lets a single script serve all
six pages.

## Linking between pages

Two query parameters wire the pages together, both handled in `js/main.js`:

- `products.html?cat=Hoodies` opens the catalogue filtered to that category.
  The footer's product links use this.
- `contact.html?product=<article name>` pre-selects that article in the quote
  form's dropdown. A product modal's "Request a quote" button builds this link,
  so an enquiry starts from the article the buyer was looking at.

## The quote form

The form does not post anywhere — there is no backend. On submit it assembles the
filled fields into a readable message and opens WhatsApp to the bulk-order
number. This was chosen because the original site's contact form posted to
`send_mail.php` using the placeholder address `email@example.com`, so there is no
real address to send to.

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

In place of a testimonials section, the "Where To Find Us" block on the home page
links to the company's real third-party profiles (IndiaMart, JustDial, Google
Maps, Instagram, LinkedIn, Quora) where genuine reviews already live.

The MSP Sports bottom-wear range is presented with its real description and
product types but no photographs — the original site used unrelated stock images
as placeholders there, so those were not carried over. The range is set as a
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
Note that the site also depends on that host staying up.

## Accessibility & performance notes

- Skip link to the main content on every page.
- `scroll-padding-top` keeps every anchor target clear of the fixed navbar.
- Breadcrumbs on every sub-page.
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

### One trap worth remembering

`[hidden] { display: none !important; }` sits near the top of `style.css` and is
load-bearing. The `hidden` attribute only sets `display: none` in the *user-agent*
stylesheet, so any author `display` rule silently overrides it — and both
`.modal` and `.lightbox` set `display: grid`. Without that rule, two invisible
full-screen panels sit at `z-index: 150` over the page and swallow every click,
which makes the whole site appear unresponsive. Do not remove it, and be careful
adding `display` to anything that relies on the `hidden` attribute.

## SEO

- Per-page `<title>`, meta description, canonical URL, Open Graph and Twitter tags.
- Organization structured data on the home page; FAQPage data on `contact.html`
  mirrors the questions published there.
- An ItemList of the catalogue is generated from `PRODUCTS` at runtime by
  `initProductSchema()`, and only on `products.html`, which is the page that
  actually lists all of it.
- `robots.txt` and a `sitemap.xml` covering all six pages.

Structured data describes only what each page actually shows — no prices,
ratings, availability or review counts, since the source site publishes none.
