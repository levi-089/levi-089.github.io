// ================================================
// home-scroll.js — GSAP ScrollTrigger animations
// ES Module
// ================================================

const SERVICES = [
  {
    index: 0,
    titleLines: ['Soporte', 'Especializado'],
    copy: 'Soporte técnico especializado con tiempos de respuesta garantizados. Equipos certificados disponibles para entornos críticos.',
    tags: ['L3 Support', 'SLA garantizado', '24/7'],
    accent: '#4361EE',
    link: 'servicios/soporte-especializado.html',
    label: '01'
  },
  {
    index: 1,
    titleLines: ['Optimización', 'Estratégica'],
    copy: 'Análisis profundo de tu stack actual. Reducción de costos sin comprometer rendimiento. Resultados medibles en 90 días.',
    tags: ['Rightsizing', 'Reducción de costos', '90 días'],
    accent: '#00B4D8',
    link: 'servicios/optimizacion-estrategica.html',
    label: '02'
  },
  {
    index: 2,
    titleLines: ['Implementación', 'Avanzada'],
    copy: 'Despliegue de clusters de alta disponibilidad con metodología probada. Zero-downtime. Rollback garantizado.',
    tags: ['Zero-downtime', 'Alta disponibilidad', 'Rollback'],
    accent: '#7209B7',
    link: 'servicios/implementacion-avanzada.html',
    label: '03'
  },
  {
    index: 3,
    titleLines: ['Diseño', 'de DR'],
    copy: 'Arquitecturas de Disaster Recovery diseñadas para tu RTO/RPO específico. Drills documentados. Runbooks completos.',
    tags: ['RTO / RPO', 'Runbooks', 'Drills'],
    accent: '#4361EE',
    link: 'servicios/diseno-dr.html',
    label: '04'
  },
  {
    index: 4,
    titleLines: ['Estrategia', 'Multi-Cloud'],
    copy: 'Diseño e implementación de estrategias multi-cloud. Evita vendor lock-in. Optimiza costos entre proveedores.',
    tags: ['AWS / Azure / GCP', 'Sin vendor lock-in', 'Cost optimized'],
    accent: '#00B4D8',
    link: 'servicios/multi-cloud.html',
    label: '05'
  },
  {
    index: 5,
    titleLines: ['Red y', 'Ciberseguridad'],
    copy: 'Auditorías de seguridad, hardening Fortinet, segmentación de red. Tu perímetro, redefinido.',
    tags: ['Fortinet', 'Auditoría', 'Hardening'],
    accent: '#7209B7',
    link: 'servicios/red-ciberseguridad.html',
    label: '06'
  }
];

export function initScrollAnimations(qunoxScene) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.config({
    fastScrollEnd: true,
    ignoreMobileResize: true
  });

  // ── NAV scrolled class ───────────────────────
  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top-=80',
    onEnter:     () => document.getElementById('nav').classList.add('scrolled'),
    onLeaveBack: () => document.getElementById('nav').classList.remove('scrolled')
  });

  // ── HERO: initial entrance ───────────────────
  // Wrap each word's text in an inner span for clip-reveal
  document.querySelectorAll('.hero__headline .word').forEach(word => {
    const inner = document.createElement('span');
    inner.className = 'word-inner';
    inner.textContent = word.textContent;
    word.textContent = '';
    word.appendChild(inner);
  });

  gsap.set('#hero-sub', { y: 20 });
  gsap.set('.hero__brand-label', { opacity: 0, y: 10 });

  const heroTL = gsap.timeline({ delay: 0.3 });

  heroTL
    .to('.hero__brand-label', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
    .from('.hero__headline .word-inner', {
      y: '110%', duration: 1.0, stagger: 0.12, ease: 'power4.out'
    }, '-=0.3')
    .to('#hero-sub', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.3')
    .to('#hero-scroll-hint', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');

  // ── HERO: camera push on scroll ─────────────
  ScrollTrigger.create({
    trigger: '#scene-hero',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.5,
    onUpdate: self => {
      qunoxScene.setCameraPush(self.progress);
      document.querySelector('.hero__grid-bg').style.opacity = 1 - self.progress;
      const op = Math.max(0, 1 - self.progress * 2.5);
      document.querySelector('.hero__copy').style.opacity = op;
    }
  });

  // ── DIAGNOSTIC: scan reveals ─────────────────
  gsap.from('.diagnostic__intro', {
    scrollTrigger: { trigger: '#scene-diagnostic', start: 'top 75%', toggleActions: 'play none none reverse' },
    opacity: 0, y: 20, duration: 0.6, ease: 'power3.out'
  });

  const diagImageLabels = [
    'Conflicto de configuración activo',
    'Recursos críticos al límite',
    'Arquitectura sin redundancia detectada',
    'Sin plan de recuperación definido'
  ];

  document.querySelectorAll('.diag-item').forEach((item, i) => {
    const scanline = item.querySelector('.diag-item__scanline');
    gsap.to(scanline, {
      scrollTrigger: {
        trigger: '#scene-diagnostic',
        start: `top ${70 - i * 5}%`,
        toggleActions: 'play none none reverse'
      },
      scaleX: 0,
      duration: 0.9,
      delay: i * 0.18,
      ease: 'power4.inOut',
      transformOrigin: 'right'
    });
    const badge = item.querySelector('.diag-item__status');
    if (badge) {
      gsap.from(badge, {
        scrollTrigger: {
          trigger: '#scene-diagnostic',
          start: `top ${70 - i * 5}%`,
          toggleActions: 'play none none reverse'
        },
        scale: 0.8, opacity: 0, duration: 0.4,
        delay: i * 0.18 + 0.7,
        ease: 'back.out(2)'
      });
    }
  });

  gsap.to('#diag-progress', {
    scrollTrigger: {
      trigger: '#scene-diagnostic',
      start: 'top 60%', end: 'bottom 40%',
      scrub: 1
    },
    width: '100%', ease: 'none'
  });

  const statuses = ['ANALYZING', 'PROCESSING', 'FLAGGING', 'COMPLETE'];
  const statusEl = document.getElementById('diag-status');
  ScrollTrigger.create({
    trigger: '#scene-diagnostic',
    start: 'top 60%', end: 'bottom 40%',
    onUpdate: self => {
      if (!statusEl) return;
      const idx = Math.min(statuses.length - 1, Math.floor(self.progress * statuses.length));
      statusEl.textContent = statuses[idx];
    }
  });

  ScrollTrigger.create({
    trigger: '#scene-diagnostic',
    start: 'top 80%', end: 'bottom 20%',
    scrub: 2,
    onUpdate: self => qunoxScene.setDistortion(self.progress),
    onLeave: ()     => qunoxScene.setDistortion(0)
  });

  // ── SERVICES: sticky scroll (only if legacy sticky panel exists) ───────────
  const _accentBar = document.getElementById('services-accent-bar');
  if (!_accentBar) {
    // New grid layout — no scroll animation needed, skip entire block
  } else {
  const _copyEl    = document.getElementById('services-copy-text');
  const _linkEl    = document.getElementById('services-link');
  let   _svcIdx    = 0;

  const segVh = 300 / 6; // 50vh por servicio

  // Init: todos los títulos e imágenes como active (pointer-events),
  // GSAP controla visibilidad totalmente — cero toggle de clases.
  document.querySelectorAll('.svc-title').forEach((t, i) => {
    t.classList.add('active');
    gsap.set(t, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 32 });
  });
  document.querySelectorAll('.svc-img').forEach((img, i) => {
    img.classList.add('active');
    gsap.set(img, { opacity: i === 0 ? 1 : 0 });
  });

  _accentBar.style.background = SERVICES[0].accent;
  _accentBar.style.width = '100%';
  gsap.set([_copyEl, _linkEl], { opacity: 1, y: 0 });
  _copyEl.textContent = SERVICES[0].copy;
  _linkEl.href = SERVICES[0].link;
  qunoxScene.setServiceMode(0);

  // ── Un timeline de scrub por cada transición i → i+1 ───────────────────
  // La transición ocupa el 55% final de cada segmento (27.5vh).
  // Con scrub:1.0 la animación sigue exactamente al scroll con 1s de lag suave.
  for (let i = 0; i < 5; i++) {
    const tStart = (i + 0.45) * segVh;
    const tEnd   = (i + 1.0)  * segVh;

    gsap.timeline({
      scrollTrigger: {
        trigger: '#scene-services',
        start:  `top+=${tStart}vh top`,
        end:    `top+=${tEnd}vh top`,
        scrub:  1.0
      }
    })
    .to(`.svc-title[data-svc="${i}"]`,     { opacity: 0, y: -32, ease: 'power1.inOut' }, 0)
    .to(`.svc-img[data-svc="${i}"]`,       { opacity: 0,         ease: 'power1.inOut' }, 0)
    .to(`.svc-title[data-svc="${i + 1}"]`, { opacity: 1, y:   0, ease: 'power1.inOut' }, 0)
    .to(`.svc-img[data-svc="${i + 1}"]`,   { opacity: 1,         ease: 'power1.inOut' }, 0);
  }

  // ── Pin + copy text / accent bar (sólo al cruzar el umbral) ────────────
  ScrollTrigger.create({
    trigger: '#scene-services',
    start: 'top top',
    end: 'bottom bottom',
    pin: '#services-sticky-panel',
    anticipatePin: 1,
    onUpdate: self => {
      const newIdx = Math.min(5, Math.floor(self.progress * 6));
      if (newIdx === _svcIdx) return;
      _svcIdx = newIdx;

      const svc = SERVICES[newIdx];
      _accentBar.style.background = svc.accent;
      qunoxScene.setServiceMode(newIdx);

      gsap.killTweensOf([_copyEl, _linkEl]);
      gsap.to([_copyEl, _linkEl], {
        opacity: 0, duration: 0.18, ease: 'power2.in',
        onComplete: () => {
          _copyEl.textContent = svc.copy;
          _linkEl.href = svc.link;
          gsap.fromTo([_copyEl, _linkEl],
            { opacity: 0 },
            { opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
          );
        }
      });

      gsap.fromTo(_accentBar,
        { width: '0%' },
        { width: '100%', duration: 0.5, ease: 'power3.out' }
      );
    }
  });

  // ── Background curtain scrub ────────────────────────────────────────────
  const wipeVh = segVh * 0.65;
  for (let i = 1; i <= 5; i++) {
    gsap.fromTo(`.svc-bg[data-bg="${i}"]`,
      { clipPath: 'inset(100% 0 0 0)' },
      {
        clipPath: 'inset(0% 0 0 0)',
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '#scene-services',
          start: `top+=${i * segVh}vh top`,
          end:   `top+=${i * segVh + wipeVh}vh top`,
          scrub: 1.2
        }
      }
    );
  }

  } // end if (_accentBar) — legacy services sticky scroll

  // ── CLOSING ──────────────────────────────────
  gsap.set('.closing__actions', { y: 20 });

  const closingTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#scene-closing',
      start: 'top 70%',
      toggleActions: 'play none none reverse'
    }
  });

  closingTL
    .to('.closing__eyebrow',   { opacity: 1, duration: 0.5, ease: 'power2.out' })
    .from('.closing__headline',{ y: 40, duration: 1.0, ease: 'power4.out' }, '-=0.2')
    .to('.closing__headline',  { opacity: 1, duration: 0.8, ease: 'power2.out' }, '<')
    .to('.closing__body',      { opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.3')
    .to('.closing__actions',   { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }, '-=0.2');

  ScrollTrigger.create({
    trigger: '#scene-closing',
    start: 'top 80%',
    once: true,
    onEnter: () => qunoxScene.setClosingMode()
  });

  // ── SANGFOR: pin section, inner-scroll right panel ─────────
  try {
    const sangforSection = document.querySelector('#scene-sangfor');
    if (sangforSection && window.innerWidth > 860) {
      const rightInner = sangforSection.querySelector('.sangfor__right-inner');
      const sfCards    = gsap.utils.toArray('#scene-sangfor .sangfor__card');
      const n = sfCards.length;

      if (rightInner && n > 1) {
        // Initial state: set title+desc of cards 2-N invisible (skip nulls)
        sfCards.slice(1).forEach(card => {
          const els = [
            card.querySelector('.sangfor__card-title'),
            card.querySelector('.sangfor__card-desc'),
          ].filter(Boolean);
          if (els.length) gsap.set(els, { opacity: 0, y: 28 });
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sangforSection,
            start: 'top top',
            end: () => `+=${(n - 1) * window.innerHeight}`,
            scrub: 0.7,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
          }
        });

        for (let i = 1; i < n; i++) {
          const card = sfCards[i];
          const textEls = [
            card.querySelector('.sangfor__card-title'),
            card.querySelector('.sangfor__card-desc'),
          ].filter(Boolean);

          tl.to(rightInner, {
            y: -i * window.innerHeight,
            duration: 0.6,
            ease: 'power1.inOut',
          }, (i - 1));

          if (textEls.length) {
            tl.to(textEls, {
              opacity: 1, y: 0,
              duration: 0.25,
              ease: 'power2.out',
              stagger: 0.05,
            }, (i - 1) + 0.65);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[QUNOX] Sangfor scroll init failed:', err);
  }

  // Refresh after fonts
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  // Debounced resize refresh
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
  });
}

// ================================================
// Diagnostic: click-to-expand panel + auto slideshow
// ================================================

export function initDiagnosticInteractions() {
  const INFO_DATA = [
    {
      problem: 'Las inconsistencias entre entornos (desarrollo, staging, producción) causan bugs difíciles de reproducir, despliegues fallidos y ventanas de vulnerabilidad abiertas sin saberlo.',
      solution: 'Auditamos el stack completo e implementamos gestión centralizada con IaC (Ansible, Terraform). Cada cambio pasa por validación automática y control de versiones — sin configuraciones manuales.'
    },
    {
      problem: 'Instancias sobredimensionadas, licencias sin usar y workloads mal distribuidos generan costos innecesarios. Las empresas desperdician entre 30–40% de su presupuesto cloud sin saberlo.',
      solution: 'Realizamos análisis de rightsizing y consolidamos workloads. Ajustamos capacidades al uso real e implementamos auto-scaling para que el costo siga al consumo efectivo.'
    },
    {
      problem: 'Sin redundancia, un single point of failure puede paralizar operaciones completas. Una caída de un componente no debería detener el negocio, pero en arquitecturas frágiles así ocurre.',
      solution: 'Diseñamos arquitecturas de alta disponibilidad con redundancia en cada capa crítica. Implementamos load balancing, failover automático y eliminamos dependencias únicas antes de que fallen.'
    },
    {
      problem: 'Sin un plan de recuperación documentado, ante un desastre el tiempo de respuesta es impredecible. Sin RTO/RPO definidos, la continuidad operativa queda al azar.',
      solution: 'Definimos estrategias de Disaster Recovery con RTO y RPO específicos. Backups automatizados, runbooks detallados y drills periódicos que garantizan la recuperación cuando más importa.'
    }
  ];

  const items = document.querySelectorAll('.diag-item');
  if (!items.length) return;

  items.forEach((item, i) => {
    const panelInner = item.querySelector('.diag-item__panel-inner');
    if (!panelInner) return;

    const d = INFO_DATA[i];
    panelInner.innerHTML = `<p class="diag-panel__text">${d.problem}</p>`;

    item.addEventListener('click', () => {
      const isOpen = item.classList.contains('expanded');
      items.forEach(it => it.classList.remove('expanded'));
      if (!isOpen) item.classList.add('expanded');
    });
  });

  // ── Auto-slideshow: 6 images, every 4 seconds ──
  const allImages = document.querySelectorAll('.diag-img');
  if (!allImages.length) return;

  const slideLabels = [
    { num: '01', text: 'Conflicto de configuración activo' },
    { num: '02', text: 'Recursos críticos al límite' },
    { num: '03', text: 'Arquitectura sin redundancia detectada' },
    { num: '04', text: 'Sin plan de recuperación definido' },
    { num: '05', text: 'Red sin segmentación detectada' },
    { num: '06', text: 'Monitoreo reactivo en lugar de proactivo' }
  ];

  const labelNum  = document.querySelector('.diag-vl-num');
  const labelText = document.querySelector('.diag-vl-text');
  let slideshowIdx = 0;

  function showSlide(idx) {
    allImages.forEach(img => img.classList.remove('active'));
    slideshowIdx = idx % allImages.length;
    allImages[slideshowIdx].classList.add('active');
    if (labelNum && labelText && slideLabels[slideshowIdx]) {
      labelNum.textContent  = slideLabels[slideshowIdx].num;
      labelText.textContent = slideLabels[slideshowIdx].text;
    }
  }

  showSlide(0);
  setInterval(() => showSlide(slideshowIdx + 1), 4000);
}
