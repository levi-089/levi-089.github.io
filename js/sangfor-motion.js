/* ================================================================
   QUNOX — Sangfor "Soluciones" scroll-motion controller
   ----------------------------------------------------------------
   Dependencies (loaded before this file): gsap, ScrollTrigger.
   Scope: ONLY the [data-service-motion-section] node (#productos).
   - Desktop (>=1025, fine pointer, hover): pinned scroll narrative.
   - Tablet / mobile: staggered reveal-on-enter.
   - prefers-reduced-motion: no motion, content shown immediately.
   - No JS / no gsap: original grid renders untouched (fallback).
   Uses native scroll + ScrollTrigger scrub (no smooth-scroll lib,
   to avoid conflicts with the sticky nav and the plexus canvas).
   ================================================================ */
(function () {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    var section = document.querySelector('[data-service-motion-section]');
    if (!section) return;

    // Progressive: the hover text-swap works with or without motion.
    enhanceButtons(section);

    // No animation engine or reduced motion -> leave content as-is.
    if (!window.gsap || !window.ScrollTrigger || REDUCE) return;

    gsap.registerPlugin(ScrollTrigger);

    var mm = gsap.matchMedia();

    // ---- Desktop: pinned narrative ----
    mm.add('(min-width: 1025px) and (hover: hover) and (pointer: fine)', function () {
      return buildDesktop(section);
    });

    // ---- Tablet + mobile: reveal on enter ----
    mm.add('(max-width: 1024px)', function () {
      return buildReveal(section);
    });

    // Recalculate once images/fonts have settled.
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  /* --------------------------------------------------------------
     Hover text-swap for each card CTA (duplicate line, no new text)
     -------------------------------------------------------------- */
  function enhanceButtons(section) {
    var ctas = section.querySelectorAll('.sf-pcard__cta');
    ctas.forEach(function (cta) {
      if (cta.querySelector('.qsm-swap')) return;      // idempotent
      var text = cta.textContent;
      cta.textContent = '';
      var swap = document.createElement('span');
      swap.className = 'qsm-swap';
      swap.setAttribute('aria-hidden', 'false');
      var a = document.createElement('span');
      a.className = 'qsm-swap__in';
      a.textContent = text;
      var b = document.createElement('span');
      b.className = 'qsm-swap__in qsm-swap__in--dup';
      b.setAttribute('aria-hidden', 'true');
      b.textContent = text;
      swap.appendChild(a);
      swap.appendChild(b);
      cta.appendChild(swap);
    });
  }

  /* --------------------------------------------------------------
     DESKTOP — pinned, scroll-scrubbed narrative
     -------------------------------------------------------------- */
  function buildDesktop(section) {
    var inner = section.querySelector('.sf-products__inner');
    var cards = gsap.utils.toArray(section.querySelectorAll('.sf-pcard'));
    var visuals = gsap.utils.toArray(section.querySelectorAll('.qsm-visual'));
    var n = cards.length;
    if (!inner || n < 2) return;

    document.documentElement.classList.add('qsm-on');

    // Sync stage height to the live nav height.
    var nav = document.getElementById('nav');
    var navH = nav ? nav.offsetHeight : 90;
    inner.style.setProperty('--qsm-nav', navH + 'px');

    // Tag items for the spec's data-* contract.
    cards.forEach(function (c, i) {
      c.setAttribute('data-service-motion-item', String(i));
    });

    // Wrap each title so it can slide inside its clipping box.
    cards.forEach(function (card) {
      var name = card.querySelector('.sf-pcard__name');
      if (name && !name.querySelector('.qsm-titleline')) {
        name.innerHTML = '<span class="qsm-titleline">' + name.innerHTML + '</span>';
      }
    });

    // Ordered animatable pieces of a card (excluding the title line).
    function pre(card) {
      return [card.querySelector('.sf-pcard__tag')].filter(Boolean);
    }
    function post(card) {
      return gsap.utils.toArray(card.querySelectorAll(
        '.sf-pcard__full, .sf-pcard__desc, .sf-pcard__features, .sf-pcard__cta'
      ));
    }
    function title(card) { return card.querySelector('.qsm-titleline'); }
    function vinner(v) { return v.querySelector('.qsm-visual__inner'); }

    var ctx;
    try {
    ctx = gsap.context(function (self) {

      // ---- Initial states ----
      cards.forEach(function (card, i) {
        if (i === 0) {
          gsap.set(card, { autoAlpha: 1 });
          gsap.set(title(card), { yPercent: 0 });
          gsap.set(pre(card).concat(post(card)), { y: 0, autoAlpha: 1 });
        } else {
          gsap.set(card, { autoAlpha: 0 });
          gsap.set(title(card), { yPercent: 110 });
          gsap.set(pre(card).concat(post(card)), { y: 34, autoAlpha: 0 });
        }
      });
      visuals.forEach(function (v, i) {
        if (i === 0) {
          gsap.set(v, { autoAlpha: 1, clipPath: 'inset(0% 0 0% 0)' });
          gsap.set(vinner(v), { yPercent: 0, scale: 1.06 });
        } else {
          gsap.set(v, { autoAlpha: 0, clipPath: 'inset(100% 0 0% 0)' });
          gsap.set(vinner(v), { yPercent: 8, scale: 1.12 });
        }
      });

      // ---- Master timeline (scrubbed) ----
      var tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: section,
          start: function () { return 'top ' + navH; },
          end: function () { return '+=' + Math.round(n * window.innerHeight * 0.82); },
          pin: inner,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            // Counter follows whichever card is currently most opaque, so it
            // always matches what the viewer sees. gsap.getProperty reads the
            // animated value without forcing layout.
            var best = 0, bestO = -1;
            for (var k = 0; k < n; k++) {
              var o = parseFloat(gsap.getProperty(cards[k], 'opacity'));
              if (o > bestO) { bestO = o; best = k; }
            }
            setProgress(section, best, n, self.progress);
          }
        }
      });

      for (var i = 1; i < n; i++) {
        var t = i;                       // one time-unit per transition
        var prevCard = cards[i - 1], curCard = cards[i];
        var prevV = visuals[i - 1], curV = visuals[i];

        // outgoing
        tl.to(title(prevCard), { yPercent: -110, duration: 0.5, ease: 'power2.in' }, t)
          .to(pre(prevCard).concat(post(prevCard)),
              { y: -22, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, t)
          .to(prevCard, { autoAlpha: 0, duration: 0.3 }, t + 0.3)
          .to(prevV, { clipPath: 'inset(0% 0 100% 0)', autoAlpha: 0, duration: 0.6 }, t)
          .to(vinner(prevV), { yPercent: -6, duration: 0.6 }, t);

        // incoming
        tl.set(curCard, { autoAlpha: 1 }, t + 0.12)
          .fromTo(title(curCard), { yPercent: 110 },
                  { yPercent: 0, duration: 0.7, ease: 'expo.out' }, t + 0.18)
          .fromTo(pre(curCard), { y: 30, autoAlpha: 0 },
                  { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, t + 0.14)
          .fromTo(post(curCard), { y: 34, autoAlpha: 0 },
                  { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, t + 0.3)
          .fromTo(curV, { clipPath: 'inset(100% 0 0% 0)', autoAlpha: 1 },
                  { clipPath: 'inset(0% 0 0% 0)', duration: 0.7 }, t + 0.05)
          .fromTo(vinner(curV), { yPercent: 8, scale: 1.12 },
                  { yPercent: 0, scale: 1.06, duration: 0.8, ease: 'power2.out' }, t + 0.05);
      }

      // trailing hold so the last service breathes before unpin
      tl.to({}, { duration: 0.55 }, n - 1 + 0.9);

      // ---- Pointer parallax (columns move at different speeds) ----
      var visualsWrap = section.querySelector('.qsm-visuals');
      var contentWrap = section.querySelector('.sf-products__grid');
      if (visualsWrap && contentWrap) {
        var vx = gsap.quickTo(visualsWrap, 'x', { duration: 0.6, ease: 'power3' });
        var vy = gsap.quickTo(visualsWrap, 'y', { duration: 0.6, ease: 'power3' });
        var cx = gsap.quickTo(contentWrap, 'x', { duration: 0.6, ease: 'power3' });
        var cy = gsap.quickTo(contentWrap, 'y', { duration: 0.6, ease: 'power3' });

        var onMove = function (e) {
          var r = inner.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
          var ny = (e.clientY - r.top) / r.height - 0.5;
          vx(nx * 12); vy(ny * 12);       // visual: up to ~6px each way
          cx(nx * 5);  cy(ny * 5);        // content: subtler
        };
        var onLeave = function () { vx(0); vy(0); cx(0); cy(0); };
        inner.addEventListener('mousemove', onMove);
        inner.addEventListener('mouseleave', onLeave);

        // context cleanup also removes these listeners
        self.add(function () {
          inner.removeEventListener('mousemove', onMove);
          inner.removeEventListener('mouseleave', onLeave);
        });
      }
    }, section);
    } catch (err) {
      // Any failure while wiring the narrative -> fall back to the plain grid,
      // never leave cards stuck in their hidden initial state.
      if (ctx) { try { ctx.revert(); } catch (e) {} }
      document.documentElement.classList.remove('qsm-on');
      inner.style.removeProperty('--qsm-nav');
      if (window.console) console.warn('[sangfor-motion] desktop narrative disabled:', err);
      return function () {};
    }

    // matchMedia cleanup: revert everything this branch created.
    return function () {
      ctx.revert();
      document.documentElement.classList.remove('qsm-on');
      inner.style.removeProperty('--qsm-nav');
    };
  }

  function setProgress(section, idx, n, p) {
    var cur = section.querySelector('.qsm-progress__current');
    var bar = section.querySelector('.qsm-progress__bar');
    if (cur) cur.textContent = pad(idx + 1);
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  function pad(v) { return v < 10 ? '0' + v : String(v); }

  /* --------------------------------------------------------------
     TABLET + MOBILE — reveal each card as it enters the viewport
     -------------------------------------------------------------- */
  function buildReveal(section) {
    document.documentElement.classList.add('qsm-reveal');
    var cards = gsap.utils.toArray(section.querySelectorAll('.sf-pcard'));

    function revealAll() {
      cards.forEach(function (c) { c.classList.add('qsm-in'); });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('qsm-in');
          io.unobserve(entry.target);        // reveal once, never hide again
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    cards.forEach(function (card, i) {
      card.style.transitionDelay = (i % 3) * 0.09 + 's';
      io.observe(card);
    });

    // Failsafe: never leave content hidden if the observer misfires.
    var failsafe = setTimeout(revealAll, 2600);
    var onLoad = function () { setTimeout(revealAll, 1000); };
    window.addEventListener('load', onLoad);

    return function () {
      clearTimeout(failsafe);
      window.removeEventListener('load', onLoad);
      io.disconnect();
      document.documentElement.classList.remove('qsm-reveal');
      cards.forEach(function (card) {
        card.classList.remove('qsm-in');
        card.style.transitionDelay = '';
      });
    };
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
