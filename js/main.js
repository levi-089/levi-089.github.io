(function () {
  'use strict';

  /* ── NAV SCROLL ─────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ── ACTIVE NAV LINK ─────────────────────────── */
  (function markActive() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href && path.includes(href.replace('../', '').replace('.html', ''))) {
        if (href !== 'index.html' && href !== '../index.html') {
          a.classList.add('active');
        }
      }
    });
  })();

  /* ── HAMBURGER ──────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    function openMenu() {
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    hamburger.addEventListener('click', () => {
      hamburger.classList.contains('open') ? closeMenu() : openMenu();
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  /* ── SCROLL REVEAL ──────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = parseFloat(entry.target.dataset.delay || 0);
          setTimeout(() => entry.target.classList.add('visible'), delay);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => obs.observe(el));
  }

  /* ── CONTACT FORM — Web3Forms ───────────────────
     Servicio gratuito para envío de formularios en
     sitios estáticos (sin backend).

     ACTIVACIÓN:
     1. Ve a https://web3forms.com/
     2. Ingresa "soluciones@qunox.net" y haz clic en
        "Create Access Key"
     3. Revisa el correo y copia la clave que te envían
     4. Reemplaza 'b9d73eb1-b378-4f67-8744-465f0f119b12' abajo con esa clave
     ─────────────────────────────────────────────── */
  const WEB3FORMS_KEY = 'b9d73eb1-b378-4f67-8744-465f0f119b12';

  const form = document.getElementById('contact-form');
  const formBtn = document.getElementById('form-btn');
  const formSuccess = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre  = form.nombre.value.trim();
      const empresa = form.empresa ? form.empresa.value.trim() : '';
      const email   = form.email.value.trim();
      const rol     = form.rol ? form.rol.value.trim() : '';
      const mensaje = form.mensaje.value.trim();

      if (!nombre || !email) {
        alert('Por favor completa nombre y email.');
        return;
      }

      formBtn.disabled = true;
      formBtn.textContent = 'Enviando...';

      try {
        if (WEB3FORMS_KEY === 'b9d73eb1-b378-4f67-8744-465f0f119b12') {
          /* Clave no configurada — simula envío para pruebas visuales */
          await new Promise(r => setTimeout(r, 800));
        } else {
          const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject:    'QUNOX | Nuevo contacto: ' + nombre,
              from_name:  'QUNOX Web',
              replyto:    email,
              nombre,
              empresa:    empresa || '—',
              email,
              rol:        rol     || '—',
              mensaje
            })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message || 'Error');
        }
        form.style.display = 'none';
        if (formSuccess) formSuccess.style.display = 'block';
      } catch (err) {
        formBtn.disabled = false;
        formBtn.textContent = 'Solicita evaluación técnica';
        alert('Error al enviar el formulario.\nEscríbenos directamente a soluciones@qunox.net');
      }
    });
  }

})();
