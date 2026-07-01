// animations.js — RR Distribuidora v4 — Fluid Premium
// Scroll reveal · Parallax · Tab indicator · Carrossel · Mesh parallax · Ripple · Counters

// ─── Header shadow on scroll ─────────────────────────────────
(function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ─── Scroll reveal (fade-in-up sequencial) ───────────────────
(function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  els.forEach(el => observer.observe(el));
})();

// ─── Malha do hero reage ao mouse (parallax suave) ───────────
(function initMeshParallax() {
  const mesh = document.querySelector('.hero__mesh');
  const hero = document.querySelector('.hero');
  if (!mesh || !hero) return;

  let raf = null;
  let tx = 0, ty = 0;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = ((e.clientX - rect.left) - cx) / cx;
    const dy = ((e.clientY - rect.top)  - cy) / cy;
    tx = dx * 14;
    ty = dy * 10;

    if (!raf) {
      raf = requestAnimationFrame(() => {
        mesh.style.transform = `translate(${tx}px, ${ty}px)`;
        raf = null;
      });
    }
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    mesh.style.transition = 'transform .8s ease';
    mesh.style.transform = 'translate(0,0)';
    setTimeout(() => { mesh.style.transition = ''; }, 820);
  });
})();

// ─── Parallax suave nas seções de fundo escuro ───────────────
(function initSectionParallax() {
  const sections = document.querySelectorAll('.section--why, .section--cta-final, .section--testimonials');
  if (!sections.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        sections.forEach(sec => {
          const rect = sec.getBoundingClientRect();
          const visible = rect.top < window.innerHeight && rect.bottom > 0;
          if (!visible) return;
          const pct = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          const offset = (pct - 0.5) * 40;
          sec.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ─── Contadores animados ─────────────────────────────────────
(function initCounters() {
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function animateCounter(el, target, duration) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(easeOutExpo(progress) * target);
      el.textContent = value + (target >= 100 ? '+' : '');
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target + (target >= 100 ? '+' : '');
    }
    requestAnimationFrame(tick);
  }

  const counters = document.querySelectorAll('.count-up');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.done) {
        entry.target.dataset.done = '1';
        animateCounter(entry.target, parseInt(entry.target.dataset.target || '0'), 1600);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));
})();

// ─── Ripple nos botões ───────────────────────────────────────
(function initRipple() {
  if (!document.getElementById('ripple-style')) {
    const s = document.createElement('style');
    s.id = 'ripple-style';
    s.textContent = '@keyframes rippleAnim{0%{transform:scale(0);opacity:.35}100%{transform:scale(1);opacity:0}}';
    document.head.appendChild(s);
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2.1;
    ripple.style.cssText = `
      position:absolute;border-radius:50%;
      background:rgba(255,255,255,.18);
      width:${size}px;height:${size}px;
      top:${e.clientY - rect.top - size/2}px;
      left:${e.clientX - rect.left - size/2}px;
      transform:scale(0);
      animation:rippleAnim .65s cubic-bezier(0,.55,.45,1) forwards;
      pointer-events:none;z-index:10;
    `;
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 680);
  });
})();

// ─── Tabs flutuantes com indicador deslizante ────────────────
(function initTabsIndicator() {
  const tabs = document.getElementById('categorias-tabs');
  if (!tabs) return;
  const indicator = document.getElementById('tabs-indicator');
  if (!indicator) return;

  function moveIndicator(btn) {
    const tabsRect = tabs.getBoundingClientRect();
    const btnRect  = btn.getBoundingClientRect();
    indicator.style.left  = (btn.offsetLeft) + 'px';
    indicator.style.width = btnRect.width + 'px';
  }

  const btns = tabs.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('tab-btn--active', 'tab-btn--ativo'));
      btn.classList.add('tab-btn--active');
      moveIndicator(btn);
    });
  });

  // Posiciona no ativo inicial
  requestAnimationFrame(() => {
    const active = tabs.querySelector('.tab-btn--active, .tab-btn--ativo');
    if (active) moveIndicator(active);
  });
})();

// ─── Produto cards: stagger reveal ───────────────────────────
function revealProductCards() {
  const cards = document.querySelectorAll('.produto-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px) scale(.97)';
    card.style.transition = 'none';
    setTimeout(() => {
      card.style.transition = 'opacity .5s ease, transform .52s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, i * 70 + 40);
  });
}

const origRenderProducts = window.renderProducts;
if (typeof origRenderProducts === 'function') {
  window.renderProducts = function(cat) {
    origRenderProducts(cat);
    setTimeout(revealProductCards, 40);
  };
}

// ─── Carrossel de depoimentos ─────────────────────────────────
(function initCarrossel() {
  const track   = document.getElementById('testimonials-track');
  const prevBtn = document.getElementById('t-prev');
  const nextBtn = document.getElementById('t-next');
  const dotsEl  = document.getElementById('t-dots');
  if (!track) return;

  const cards     = Array.from(track.querySelectorAll('.testimonial-card'));
  const totalCards = cards.length;
  let current = 0;
  let perSlide = 3;
  let autoTimer = null;

  function getPerSlide() {
    const w = window.innerWidth;
    if (w <= 580) return 1;
    if (w <= 960) return 2;
    return 3;
  }

  function totalSlides() { return Math.ceil(totalCards / perSlide); }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (let i = 0; i < totalSlides(); i++) {
      const dot = document.createElement('button');
      dot.className = 'testimonials-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsEl) return;
    dotsEl.querySelectorAll('.testimonials-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function getSlideWidth() {
    // largura do carrossel
    const w = track.parentElement.offsetWidth;
    const gap = 24;
    return (w - gap * (perSlide - 1)) / perSlide;
  }

  function applyTrack() {
    const slideW = getSlideWidth();
    const gap    = 24;
    const offset = current * (slideW + gap) * perSlide;
    track.style.transform = `translateX(-${offset}px)`;
  }

  function goTo(idx) {
    const max = totalSlides() - 1;
    current = Math.max(0, Math.min(idx, max));
    applyTrack();
    updateDots();
  }

  function next() { goTo(current < totalSlides() - 1 ? current + 1 : 0); }
  function prev() { goTo(current > 0 ? current - 1 : totalSlides() - 1); }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, 5000);
  }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  function init() {
    perSlide = getPerSlide();
    current  = 0;
    buildDots();
    applyTrack();
    startAuto();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); next(); startAuto(); });

  // Swipe touch
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { stopAuto(); dx < 0 ? next() : prev(); startAuto(); }
  }, { passive: true });

  // Pausa no hover
  track.parentElement.addEventListener('mouseenter', stopAuto);
  track.parentElement.addEventListener('mouseleave', startAuto);

  // Recalcula no resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      perSlide = getPerSlide();
      if (current >= totalSlides()) current = 0;
      buildDots();
      applyTrack();
    }, 120);
  }, { passive: true });

  init();
})();

// ─── DOMContentLoaded: tab inicial + stagger ─────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(revealProductCards, 450);
});

// ─── Smooth scroll âncoras internas ──────────────────────────
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const headerH = document.querySelector('.header')?.offsetHeight || 0;
  const annoH   = document.querySelector('.announcement-bar')?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerH - annoH - 16;
  window.scrollTo({ top, behavior: 'smooth' });
});
