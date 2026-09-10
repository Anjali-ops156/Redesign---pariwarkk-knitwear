/* ==========================================================================
   Panwar Knitwear - main.js
   --------------------------------------------------------------------------
   No frameworks, no build step. Plain ES6 that runs in the browser.

   Each feature lives in its own small init function, all called at the very
   bottom of the file. Delete a call to switch a feature off.

     initScrollProgress   - top progress bar + back-to-top button
     initNav              - sticky navbar, hide-on-scroll, active link
     initMobileMenu       - the full-screen mobile menu (focus trapped)
     initReveal           - scroll-triggered fade-ups and line reveals
     initCounters         - animated statistics
     initParallax         - background parallax layers
     initHeroStack        - the 3D hero visual (idles only while on screen)
     initTimeline         - the animated process rail
     initProducts         - render, search + filter, detail modal
     initFabrics          - render the fabric library
     initGallery          - render the gallery + lightbox
     initQuoteForm        - build the WhatsApp enquiry message
     initProductSchema    - ItemList structured data for the catalogue
     initMisc             - footer year, category deep-links, FAQ accordion
   ========================================================================== */

'use strict';

/* --- Small helpers ------------------------------------------------------- */
const $  = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAN_HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* The bulk-order number, used for every WhatsApp link built at runtime. */
const WA_NUMBER = '919815703769';

/* Escape text before putting it into innerHTML. */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Run fn at most once per animation frame. */
function raf(fn) {
  let queued = false;
  return function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
}

/* --- Focus management for the two dialogs --------------------------------
   Both the product modal and the lightbox are real dialogs, so keyboard
   focus has to move into them, stay inside while they are open, and return
   to whatever opened them on close. */
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function trapFocus(container) {
  function onKey(e) {
    if (e.key !== 'Tab') return;
    const items = $$(FOCUSABLE, container).filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}

/* Remembers what had focus so it can be handed back when a dialog closes. */
function makeDialog(el) {
  let lastFocus = null;
  let release = null;

  return {
    open() {
      lastFocus = document.activeElement;
      el.hidden = false;
      document.body.classList.add('is-locked');
      /* Force a style flush so the browser sees the opacity:0 starting state
         before .show flips it to 1, which is what makes the transition run.
         requestAnimationFrame would be throttled in a background or occluded
         window and could leave the dialog open but invisible. */
      void el.offsetWidth;
      el.classList.add('show');
      release = trapFocus(el);
      const target = $(FOCUSABLE, el);
      if (target) target.focus({ preventScroll: true });
    },
    close() {
      el.classList.remove('show');
      document.body.classList.remove('is-locked');
      if (release) { release(); release = null; }
      setTimeout(() => { el.hidden = true; }, REDUCED ? 0 : 350);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    },
    isOpen() { return !el.hidden; }
  };
}


/* ===== SCROLL PROGRESS + BACK TO TOP ================================== */
function initScrollProgress() {
  const bar = $('#progress');
  const top = $('#toTop');

  const update = raf(() => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
    if (top) top.classList.toggle('show', window.scrollY > 600);
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  if (top) {
    top.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  }
}


/* ===== NAVBAR ========================================================== */
function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  let last = window.scrollY;

  const onScroll = raf(() => {
    const y = window.scrollY;
    nav.classList.toggle('stuck', y > 40);

    // Hide when scrolling down past the fold, show again on the way up.
    const menu = $('#mobileMenu');
    const menuOpen = menu && menu.classList.contains('open');
    if (!menuOpen) nav.classList.toggle('hide', y > 420 && y > last);

    last = y;
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  /* Section spy for navs that point at in-page anchors. The main nav links to
     other pages now, and each page marks its own link with aria-current, so
     this finds nothing there and quietly does nothing. */
  const links = $$('.nav__links a[href^="#"]');
  const targets = links
    .map(a => ({ a, sec: $(a.getAttribute('href')) }))
    .filter(t => t.sec);

  if (!targets.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
      const hit = targets.find(t => t.sec === entry.target);
      if (hit) { hit.a.classList.add('active'); hit.a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  targets.forEach(t => io.observe(t.sec));
}


/* ===== MOBILE MENU ==================================================== */
function initMobileMenu() {
  const burger = $('#burger');
  const menu   = $('#mobileMenu');
  if (!burger || !menu) return;

  const items = $$('.mmenu__links a', menu);
  let release = null;

  const setOpen = (open) => {
    burger.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
    menu.toggleAttribute('inert', !open);

    // Stagger the links in.
    items.forEach((a, i) => {
      a.style.transitionDelay = open && !REDUCED ? (0.08 + i * 0.04) + 's' : '0s';
    });

    if (open) {
      release = trapFocus(menu);
      // Flush the style change so the panel is visible before focus moves in;
      // focus() is a no-op on a still-hidden element.
      void menu.offsetWidth;
      if (items[0]) items[0].focus({ preventScroll: true });
    } else {
      if (release) { release(); release = null; }
      burger.focus({ preventScroll: true });
    }
  };

  menu.toggleAttribute('inert', true);

  burger.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  items.forEach(a => a.addEventListener('click', () => setOpen(false)));
  $$('.mmenu__foot a', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
  });

  // Leaving the mobile breakpoint with the menu open would strand the lock.
  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => {
    if (e.matches && menu.classList.contains('open')) setOpen(false);
  });
}


/* ===== SCROLL REVEAL ================================================== */
function initReveal() {
  const els = $$('.reveal, .reveal-line');
  if (!els.length) return;

  // Stagger items that sit inside the same grid.
  $$('.about__grid, .why__grid, .listings__grid, .stats__grid, .brands__grid, .hero__copy')
    .forEach((grid) => {
      $$('.reveal', grid).forEach((el, i) => {
        el.style.setProperty('--d', (i * 80) + 'ms');
      });
    });
  $$('.reveal-line').forEach((block) => {
    $$('.line > span', block).forEach((el, i) => {
      el.style.setProperty('--d', (i * 110) + 'ms');
    });
  });

  if (REDUCED || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  els.forEach(el => io.observe(el));
  safetyNet();
}

/* Apply reveal to elements added after load (product/gallery cards). */
function observeLate(els) {
  if (REDUCED || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.05 });
  els.forEach(el => io.observe(el));
  safetyNet();
}

/* Safety net.
   Reveal animations start at opacity: 0, so if IntersectionObserver were ever
   to not deliver entries the page would read as blank. This sweep runs a few
   seconds after load and again on scroll, and reveals anything that is already
   at or above the bottom of the viewport but still hidden. Under normal
   conditions it finds nothing to do. */
let netArmed = false;
function safetyNet() {
  if (netArmed) return;
  netArmed = true;

  const sweep = () => {
    const limit = window.innerHeight + window.scrollY + 200;
    $$('.reveal:not(.in), .reveal-line:not(.in)').forEach((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top < limit) el.classList.add('in');
    });
  };

  setTimeout(sweep, 2500);
  window.addEventListener('scroll', raf(sweep), { passive: true });
}


/* ===== ANIMATED STATISTICS =========================================== */
function initCounters() {
  const nums = $$('.stat__num');
  if (!nums.length) return;

  const run = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';

    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    if (REDUCED) { el.textContent = target + suffix; return; }

    const duration = 1500;
    const started = performance.now();
    let ticked = false;

    (function step(now) {
      ticked = true;
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);           // ease-out cubic
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(started);

    /* requestAnimationFrame is throttled in a background or occluded window,
       which would leave the figure reading 0. Snap it to the real number once
       the animation should have finished. */
    setTimeout(() => {
      if (!ticked || parseInt(el.textContent, 10) !== target) {
        el.textContent = target + suffix;
      }
    }, duration + 400);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(el => io.observe(el));
  }

  /* IntersectionObserver only delivers entries while the page is actually
     rendering, so - like the reveal safety net - fall back to a plain timer
     that fills in any figure already scrolled into view. */
  let lastSweep = 0;
  const sweep = () => {
    const now = Date.now();
    if (now - lastSweep < 250) return;
    lastSweep = now;
    const limit = window.innerHeight + window.scrollY + 100;
    nums.forEach((el) => {
      if (el.dataset.done) return;
      if (el.getBoundingClientRect().top + window.scrollY < limit) run(el);
    });
  };

  setTimeout(sweep, 3000);
  window.addEventListener('scroll', sweep, { passive: true });
}


/* ===== PARALLAX ====================================================== */
function initParallax() {
  if (REDUCED) return;

  const layers = $$('[data-parallax]');
  if (!layers.length) return;

  const update = raf(() => {
    const vh = window.innerHeight;
    layers.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) return;   // offscreen: skip
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}


/* ===== HERO 3D STACK =================================================
   The idle float used to run a requestAnimationFrame loop for the whole life
   of the page. It now stops as soon as the hero scrolls away or the tab is
   hidden, so an open background tab costs nothing. */
function initHeroStack() {
  const wrap  = $('#heroVisual');
  const stack = $('#stack');
  if (!wrap || !stack || REDUCED) return;

  const cards = $$('.stack__card', stack);

  let idle = 0;
  let hovering = false;
  let onScreen = true;
  let running = false;

  if (CAN_HOVER) {
    wrap.addEventListener('mousemove', (e) => {
      hovering = true;
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5;
      const py = (e.clientY - r.top)  / r.height - 0.5;

      stack.style.transform =
        `rotateY(${(px * 14).toFixed(2)}deg) rotateX(${(-py * 10).toFixed(2)}deg)`;

      cards.forEach((c) => {
        const d = parseFloat(c.dataset.depth) || 10;
        c.style.transform =
          `translate3d(${(px * d).toFixed(1)}px, ${(py * d).toFixed(1)}px, ${d}px)`;
      });
    }, { passive: true });

    wrap.addEventListener('mouseleave', () => {
      hovering = false;
      stack.style.transform = '';
      cards.forEach(c => { c.style.transform = ''; });
    });
  }

  function frame() {
    if (!onScreen || document.hidden) { running = false; return; }
    if (!hovering) {
      idle += 0.006;
      stack.style.transform =
        `rotateY(${(Math.sin(idle) * 3.5).toFixed(2)}deg) ` +
        `rotateX(${(Math.cos(idle * 0.8) * 2.2).toFixed(2)}deg)`;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || !onScreen || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start();
    }, { threshold: 0.01 }).observe(wrap);
  }

  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();
}


/* ===== PROCESS TIMELINE ============================================== */
function initTimeline() {
  const tl = $('#timeline');
  if (!tl) return;

  const steps = $$('.tl', tl);

  // Light up each step as it enters the viewport.
  if ('IntersectionObserver' in window && !REDUCED) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in');
      });
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0.2 });
    steps.forEach(s => io.observe(s));
  } else {
    steps.forEach(s => s.classList.add('in'));
  }

  // Fill the rail in proportion to how far the section has been scrolled.
  const update = raf(() => {
    const r = tl.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = r.height + vh * 0.4;
    const seen = vh * 0.7 - r.top;
    const pct = Math.max(0, Math.min(1, seen / total));
    tl.style.setProperty('--fill', pct.toFixed(3));
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}


/* ===== PRODUCTS: render, filter, search, modal ======================= */
function initProducts() {
  const grid  = $('#pgrid');
  if (!grid || typeof PRODUCTS === 'undefined') return;

  const cats  = $('#cats');
  const input = $('#search');
  const clear = $('#searchClear');
  const empty = $('#empty');
  const count = $('#pcount');

  /* A grid with data-limit is a teaser (the home page shows eight articles
     with no filter bar). Without it the grid is the full catalogue. */
  const limit = parseInt(grid.dataset.limit, 10) || 0;

  /* products.html?cat=Hoodies opens straight onto that category, which is how
     the footer's product links work. */
  const wanted = new URLSearchParams(location.search).get('cat');
  let activeCat = (!limit && wanted && CATEGORIES.indexOf(wanted) > -1) ? wanted : 'All';
  let query = '';

  /* --- Category buttons (with live counts) ---
     These are toggle buttons in a group, not tabs: there is no tab panel per
     category, so aria-pressed describes them correctly. */
  if (cats) {
    cats.innerHTML = CATEGORIES.map((c) => {
      const n = c === 'All' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === c).length;
      return `<button type="button" class="fbtn" data-cat="${esc(c)}"
                      aria-pressed="${c === activeCat}">
                ${esc(c)}<span aria-hidden="true">${n}</span>
              </button>`;
    }).join('');

    cats.addEventListener('click', (e) => {
      const btn = e.target.closest('.fbtn');
      if (!btn) return;
      activeCat = btn.dataset.cat;
      $$('.fbtn', cats).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      render();
    });
  }

  /* --- Search (debounced) --- */
  if (input) {
    let t;
    const sync = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        query = input.value.trim().toLowerCase();
        if (clear) clear.hidden = !input.value;
        render();
      }, 140);
    };
    input.addEventListener('input', sync);
    input.addEventListener('search', sync);
  }

  if (clear && input) {
    clear.addEventListener('click', () => {
      input.value = '';
      query = '';
      clear.hidden = true;
      input.focus();
      render();
    });
  }

  /* --- Which products pass the current filter + search? --- */
  function match(p) {
    if (activeCat !== 'All' && p.category !== activeCat) return false;
    if (!query) return true;
    const haystack = [p.name, p.category, p.material, p.article, p.description]
      .concat(p.tags || [])
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  }

  /* --- Build one card --- */
  function card(p) {
    const meta = [p.material, p.sizes && p.sizes.length ? p.sizes.join(' / ') : '']
      .filter(Boolean).join(' · ');

    return `
      <article class="pcard reveal" data-id="${esc(p.id)}" tabindex="0" role="button"
               aria-label="View details for ${esc(p.name)}">
        <div class="pcard__media">
          <img src="${esc(p.image)}" alt="${esc(p.name)}"
               width="982" height="1147" loading="lazy" decoding="async">
          <span class="pcard__cat">${esc(p.category)}</span>
          <div class="pcard__view" aria-hidden="true"><span>View details</span><span>&#8599;</span></div>
        </div>
        <div class="pcard__body">
          <h3 class="pcard__name">${esc(p.name)}</h3>
          <p class="pcard__meta">${esc(meta)}</p>
          <ul class="pcard__tags">
            ${(p.tags || []).slice(0, 3).map(t => `<li>${esc(t)}</li>`).join('')}
          </ul>
        </div>
      </article>`;
  }

  function render() {
    let list = PRODUCTS.filter(match);
    if (limit) list = list.slice(0, limit);
    grid.innerHTML = list.map(card).join('');
    if (empty) empty.hidden = list.length > 0;
    if (count) {
      count.textContent = list.length
        ? `Showing ${list.length} of ${PRODUCTS.length} articles`
        : '';
    }
    observeLate($$('.pcard', grid));
  }

  /* --- Detail modal --- */
  const modalEl = $('#modal');
  const dialog = modalEl ? makeDialog(modalEl) : null;

  function openModal(p) {
    if (!dialog) return;

    const img = $('#modalImg');
    img.src = p.image;
    img.alt = p.name;
    $('#modalTitle').textContent = p.name;
    $('#modalCat').textContent = p.category;
    $('#modalBrand').textContent = p.brand || 'ZONIXA';
    $('#modalDesc').textContent = p.description || '';

    // Only show spec rows that actually have a value on the source site.
    const rows = [
      ['Article', p.article],
      ['Fabric', p.material],
      ['Sizes', p.sizes && p.sizes.length ? p.sizes.join(', ') : ''],
      ['Colours', p.colors],
      ['Branding', 'Custom logo & print available'],
      ['Order type', 'Bulk / wholesale']
    ].filter(r => r[1]);

    $('#modalSpecs').innerHTML = rows
      .map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('');

    const text = `Hi Panwar Knitwear, I'd like a quote for: ${p.name}` +
                 (p.material ? ` (${p.material})` : '') + '.';
    $('#modalWa').href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

    /* The quote form lives on contact.html, so carry the article across in the
       URL and let initContactPrefill select it there. */
    const quote = $('#modalQuote');
    if (quote) quote.href = 'contact.html?product=' + encodeURIComponent(p.name);

    dialog.open();
  }

  grid.addEventListener('click', (e) => {
    const c = e.target.closest('.pcard');
    if (!c) return;
    const p = PRODUCTS.find(x => x.id === c.dataset.id);
    if (p) openModal(p);
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const c = e.target.closest('.pcard');
    if (!c) return;
    e.preventDefault();
    const p = PRODUCTS.find(x => x.id === c.dataset.id);
    if (p) openModal(p);
  });

  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) dialog.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dialog.isOpen()) dialog.close();
    });
  }

  render();
}


/* ===== QUOTE FORM PRODUCT DROPDOWN ==================================
   Lives outside initProducts because the form is on contact.html, which has
   no product grid at all. */
function initProductSelect() {
  const select = $('#productSelect');
  if (!select || typeof PRODUCTS === 'undefined') return;

  const groups = {};
  PRODUCTS.forEach((p) => {
    (groups[p.category] = groups[p.category] || []).push(p.name);
  });

  let html = '<option value="">Select an article or range</option>';
  Object.keys(groups).forEach((cat) => {
    html += `<optgroup label="ZONIXA ${esc(cat)}">`;
    groups[cat].forEach(n => { html += `<option>${esc(n)}</option>`; });
    html += '</optgroup>';
  });
  html += '<optgroup label="MSP Sports (Bottom Wear)">' +
          ['Lowers', 'Track Pants', 'Nikkar', 'Capri', 'Shorts']
            .map(n => `<option>MSP Sports — ${n}</option>`).join('') +
          '</optgroup>';
  select.innerHTML = html;
}


/* ===== FABRIC LIBRARY =============================================== */
function initFabrics() {
  const box = $('#fabrics');
  if (!box || typeof FABRICS === 'undefined') return;

  box.innerHTML = FABRICS.map(f => `
    <div class="fab reveal">
      <strong>${esc(f.name)}</strong>
      <span>${esc(f.note)}</span>
    </div>`).join('');

  observeLate($$('.fab', box));
}


/* ===== GALLERY + LIGHTBOX ==========================================
   The gallery shows the real catalogue photography only. The three editorial
   images on the source site are generic stock pictures - boardroom silhouettes
   and a tailoring flat-lay - so they stay in the About cards, where they read
   as decoration, rather than under a heading that promises the factory floor.
   Every tile is shaped to the 982x1147 files, so nothing is cropped or blown
   up. */
function initGallery() {
  const grid = $('#ggrid');
  if (!grid || typeof PRODUCTS === 'undefined') return;

  /* A grid with data-limit is the home page's teaser strip; the gallery page
     leaves it off and shows the whole set. */
  const limit = parseInt(grid.dataset.limit, 10) || PRODUCTS.length;
  const feature = !grid.dataset.limit;   // the big tile only on the full page

  const order = PRODUCTS.slice(0, limit).map((p, i) => ({
    src: p.image, cap: p.name,
    kind: (feature && i === 0) ? 'feature' : 'tall',
    w: 982, h: 1147
  }));

  grid.innerHTML = order.map((s, i) => `
    <button class="gitem gitem--${s.kind} reveal" data-i="${i}" type="button"
            aria-label="Open image: ${esc(s.cap)}">
      <img src="${esc(s.src)}" alt="${esc(s.cap)}"
           width="${s.w}" height="${s.h}" loading="lazy" decoding="async">
    </button>`).join('');

  observeLate($$('.gitem', grid));

  /* --- Lightbox --- */
  const box = $('#lightbox');
  if (!box) return;

  const img   = $('#lightboxImg');
  const cap   = $('#lightboxCap');
  const tally = $('#lightboxCount');
  const dialog = makeDialog(box);
  let index = 0;

  function show(i) {
    index = (i + order.length) % order.length;
    img.src = order[index].src;
    img.alt = order[index].cap;
    cap.textContent = order[index].cap;
    tally.textContent = `${index + 1} / ${order.length}`;
  }

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.gitem');
    if (!item) return;
    show(parseInt(item.dataset.i, 10));
    dialog.open();
  });

  $('.lightbox__close', box).addEventListener('click', () => dialog.close());
  $('.lightbox__nav--prev', box).addEventListener('click', () => show(index - 1));
  $('.lightbox__nav--next', box).addEventListener('click', () => show(index + 1));

  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.classList.contains('lightbox__fig')) dialog.close();
  });

  document.addEventListener('keydown', (e) => {
    if (!dialog.isOpen()) return;
    if (e.key === 'Escape') dialog.close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // Swipe between images on touch devices.
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(dx < 0 ? index + 1 : index - 1);
    x0 = null;
  }, { passive: true });
}


/* ===== QUOTE FORM ================================================== */
function initQuoteForm() {
  const form = $('#quoteForm');
  if (!form) return;

  const REQUIRED = [
    { name: 'name',  err: '#qf-name-err' },
    { name: 'phone', err: '#qf-phone-err' }
  ];

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Minimal validation: name and phone are required.
    let firstBad = null;
    REQUIRED.forEach(({ name, err }) => {
      const field = form.elements[name];
      const msg = $(err);
      const bad = !field.value.trim();
      field.classList.toggle('err', bad);
      field.setAttribute('aria-invalid', String(bad));
      if (msg) msg.hidden = !bad;
      if (bad && !firstBad) firstBad = field;
    });
    if (firstBad) { firstBad.focus(); return; }

    const v = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');

    // Build a readable WhatsApp message from the filled fields only.
    const lines = ['*Quote request — Panwar Knitwear*', ''];
    const add = (label, val) => { if (val) lines.push(`${label}: ${val}`); };

    add('Name', v('name'));
    add('Company', v('company'));
    add('Phone', v('phone'));
    add('City', v('city'));
    add('Product', v('product'));
    add('Quantity', v('qty'));
    if (v('message')) { lines.push('', 'Requirement:', v('message')); }

    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank',
      'noopener'
    );

    // Confirmation, then reset.
    const btn = $('button[type="submit"]', form);
    const original = btn.innerHTML;
    btn.textContent = 'Opening WhatsApp…';
    setTimeout(() => { btn.innerHTML = original; form.reset(); }, 2200);
  });

  // Clear the error state as soon as the user types.
  form.addEventListener('input', (e) => {
    e.target.classList.remove('err');
    e.target.removeAttribute('aria-invalid');
    const row = REQUIRED.find(r => r.name === e.target.name);
    if (row) { const m = $(row.err); if (m) m.hidden = true; }
  });
}


/* ===== PRODUCT STRUCTURED DATA ======================================
   Describes the catalogue that this page actually renders. Only fields that
   exist in data.js are emitted - no prices, ratings or availability, because
   the source site does not publish them. */
function initProductSchema() {
  if (typeof PRODUCTS === 'undefined' || !PRODUCTS.length) return;
  // Only describe the catalogue on the page that actually lists all of it.
  const grid = $('#pgrid');
  if (!grid || grid.dataset.limit) return;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ZONIXA catalogue by Panwar Knitwear',
    numberOfItems: PRODUCTS.length,
    itemListElement: PRODUCTS.map((p, i) => {
      const item = {
        '@type': 'Product',
        name: p.name,
        image: p.image,
        category: p.category,
        brand: { '@type': 'Brand', name: p.brand || 'ZONIXA' },
        manufacturer: { '@type': 'Organization', name: 'Panwar Knitwear' }
      };
      if (p.description) item.description = p.description;
      if (p.material) item.material = p.material;
      if (p.source) item.url = p.source;
      return { '@type': 'ListItem', position: i + 1, item };
    })
  };

  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(data);
  document.head.appendChild(tag);
}


/* ===== CONTACT FORM PREFILL =========================================
   A product modal's "Request a quote" link arrives here as
   contact.html?product=<article name>. Select it in the dropdown so the
   enquiry starts from the article the buyer was looking at. */
function initContactPrefill() {
  const select = $('#productSelect');
  if (!select) return;

  const wanted = new URLSearchParams(location.search).get('product');
  if (!wanted) return;

  const hit = Array.from(select.options).find(o => o.value === wanted);
  if (!hit) return;

  select.value = wanted;
  select.closest('label')?.classList.add('is-prefilled');
}


/* ===== MISC ======================================================== */
function initMisc() {
  // Footer year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* The FAQ list uses the name="faq" attribute so the browser keeps one item
     open at a time. Older browsers ignore it, so close the others by hand. */
  const items = $$('.acc__item');
  const supportsName = 'name' in document.createElement('details');
  if (!supportsName) {
    items.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        items.forEach(o => { if (o !== d) o.open = false; });
      });
    });
  }
}


/* ===== BOOT ======================================================== */
initScrollProgress();
initNav();
initMobileMenu();
initReveal();
initCounters();
initParallax();
initHeroStack();
initTimeline();
initProducts();
initProductSelect();
initFabrics();
initGallery();
initQuoteForm();
initContactPrefill();
initProductSchema();
initMisc();
