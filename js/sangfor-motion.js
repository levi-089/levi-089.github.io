/* ================================================================
   QUNOX — Sangfor "Soluciones" scroll-motion controller  v2
   ----------------------------------------------------------------
   Pattern (Izanami-style): stacked sticky panels. Each solution is
   a full-height sticky panel; the next slides up and covers it —
   native compositing, 1:1 scroll mapping (no scrub crossfades).
   GSAP/ScrollTrigger only adds: per-panel content reveals, the
   covered-panel depth recede, visual parallax and the progress HUD.
   Scope: ONLY [data-service-motion-section] (#productos).
   - Desktop (>=1025, fine pointer): panels.
   - Tablet / mobile: staggered reveal-on-enter.
   - prefers-reduced-motion: static, everything visible.
   - No JS / no gsap: original grid (fallback).
   ================================================================ */
(function () {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    var section = document.querySelector('[data-service-motion-section]');
    if (!section) return;

    enhanceButtons(section);

    if (!window.gsap || !window.ScrollTrigger || REDUCE) return;

    gsap.registerPlugin(ScrollTrigger);

    var mm = gsap.matchMedia();

    mm.add('(min-width: 1025px) and (hover: hover) and (pointer: fine)', function () {
      return buildPanels(section);
    });

    mm.add('(max-width: 1024px)', function () {
      return buildReveal(section);
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  /* --------------------------------------------------------------
     CTA hover: duplicated line slides in from below (clip swap)
     -------------------------------------------------------------- */
  function enhanceButtons(section) {
    section.querySelectorAll('.sf-pcard__cta').forEach(function (cta) {
      if (cta.querySelector('.qsm-swap')) return;
      var text = cta.textContent;
      cta.textContent = '';
      var swap = document.createElement('span');
      swap.className = 'qsm-swap';
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
     DESKTOP — stacked sticky panels
     -------------------------------------------------------------- */
  function buildPanels(section) {
    var grid = section.querySelector('.sf-products__grid');
    var cards = gsap.utils.toArray(section.querySelectorAll('.sf-pcard'));
    var visuals = gsap.utils.toArray(section.querySelectorAll('.qsm-visual'));
    var progress = section.querySelector('.qsm-progress');
    var n = cards.length;
    if (!grid || n < 2) return;

    var inner = section.querySelector('.sf-products__inner');
    var nav = document.getElementById('nav');
    var navH = nav ? nav.offsetHeight : 90;

    var moved = [];   // visuals relocated into panels (restored on cleanup)
    var ctx;

    try {
      document.documentElement.classList.add('qsm-on');
      inner.style.setProperty('--qsm-nav', navH + 'px');

      // Prepare each panel: index attrs, stacking order, veil, its visual,
      // and the clipped title line.
      cards.forEach(function (card, i) {
        card.setAttribute('data-service-motion-item', String(i));
        card.setAttribute('data-qsm-idx', String(i));
        card.setAttribute('data-qsm-num', (i < 9 ? '0' : '') + (i + 1));
        if (i === n - 1) card.setAttribute('data-qsm-dark', '');
        card.style.zIndex = String(10 + i);

        if (!card.querySelector('.qsm-veil')) {
          var veil = document.createElement('span');
          veil.className = 'qsm-veil';
          veil.setAttribute('aria-hidden', 'true');
          card.appendChild(veil);
        }
        if (visuals[i] && visuals[i].parentElement !== card) {
          moved.push({ node: visuals[i], home: visuals[i].parentElement });
          card.appendChild(visuals[i]);
        }
        var name = card.querySelector('.sf-pcard__name');
        if (name && !name.querySelector('.qsm-titleline')) {
          name.innerHTML = '<span class="qsm-titleline">' + name.innerHTML + '</span>';
        }
      });

      ctx = gsap.context(function () {

        cards.forEach(function (card, i) {
          var title = card.querySelector('.qsm-titleline');
          var tag = card.querySelector('.sf-pcard__tag');
          var rest = gsap.utils.toArray(card.querySelectorAll(
            '.sf-pcard__full, .sf-pcard__desc, .sf-pcard__features li, .sf-pcard__cta'
          ));
          var vis = card.querySelector('.qsm-visual');
          var visInner = vis ? vis.querySelector('.qsm-visual__inner') : null;

          // -- Content reveal when the panel becomes the active one --
          var reveal = gsap.timeline({
            paused: true,
            defaults: { ease: 'power3.out' }
          });
          reveal
            .fromTo(title, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, 0)
            .fromTo(tag, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55 }, 0.05)
            .fromTo(rest, { y: 28, autoAlpha: 0 },
                    { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07 }, 0.18);
          if (vis) {
            reveal.fromTo(vis, { clipPath: 'inset(8% 6% 8% 6% round 20px)', autoAlpha: 0 },
                          { clipPath: 'inset(0% 0% 0% 0% round 20px)', autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 0.1)
                  .fromTo(visInner, { scale: 1.1 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, 0.1);
          }

          ScrollTrigger.create({
            trigger: card,
            start: 'top 62%',
            onEnter: function () { reveal.play(); },
            onLeaveBack: function () { reveal.reverse(); }
          });
          // Panel 1 sits right under the header: reveal it as it approaches.
          if (i === 0) {
            ScrollTrigger.create({
              trigger: card,
              start: 'top 95%',
              once: true,
              onEnter: function () { reveal.play(); }
            });
          }

          // -- Depth recede while the NEXT panel covers this one (scrubbed) --
          if (i < n - 1) {
            var veil = card.querySelector('.qsm-veil');
            gsap.timeline({
              scrollTrigger: {
                trigger: cards[i + 1],
                start: 'top bottom',
                end: 'top top',
                scrub: true
              }
            })
            .to(card, { scale: 0.955, yPercent: -2.5, ease: 'none' }, 0)
            .to(veil, { opacity: 1, ease: 'none' }, 0);
          }

          // -- Gentle parallax inside the visual, tied to scroll --
          if (visInner) {
            gsap.fromTo(visInner, { yPercent: 5 }, {
              yPercent: -5,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
              }
            });
          }

          // -- Progress counter: this panel is current while it owns the view --
          ScrollTrigger.create({
            trigger: card,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: function (self) {
              if (self.isActive && progress) {
                var cur = progress.querySelector('.qsm-progress__current');
                if (cur) cur.textContent = (i < 9 ? '0' : '') + (i + 1);
                progress.classList.toggle('qsm-progress--ondark', i === n - 1);
              }
            }
          });
        });

        // -- Progress HUD visibility + bar fill across the whole stack --
        ScrollTrigger.create({
          trigger: grid,
          start: 'top 60%',
          end: 'bottom bottom',
          onToggle: function (self) {
            if (progress) progress.classList.toggle('qsm-progress--visible', self.isActive);
          },
          onUpdate: function (self) {
            var bar = progress ? progress.querySelector('.qsm-progress__bar') : null;
            if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
          }
        });

      }, section);

    } catch (err) {
      if (ctx) { try { ctx.revert(); } catch (e) {} }
      restore();
      if (window.console) console.warn('[sangfor-motion] panels disabled:', err);
      return function () {};
    }

    function restore() {
      document.documentElement.classList.remove('qsm-on');
      inner.style.removeProperty('--qsm-nav');
      cards.forEach(function (card) {
        card.style.zIndex = '';
        card.removeAttribute('data-qsm-idx');
        card.removeAttribute('data-qsm-num');
        card.removeAttribute('data-qsm-dark');
        var veil = card.querySelector('.qsm-veil');
        if (veil) veil.remove();
      });
      moved.forEach(function (m) { m.home.appendChild(m.node); });
      if (progress) progress.classList.remove('qsm-progress--visible', 'qsm-progress--ondark');
    }

    return function () {
      ctx.revert();
      restore();
    };
  }

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
          io.unobserve(entry.target);
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
