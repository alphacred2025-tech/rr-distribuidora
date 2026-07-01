// animations.js — RR Distribuidora v3 — Clean Professional

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

// ─── Scroll reveal (Intersection Observer) ──────────────────
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
  }, { threshold: 0.10, rootMargin: '0px 0px -24px 0px' });

  els.forEach(el => observer.observe(el));
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
        const target = parseInt(entry.target.dataset.target || '0');
        animateCounter(entry.target, target, 1600);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));
})();

// ─── Ripple nos botões ───────────────────────────────────────
(function initRipple() {
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = '@keyframes rippleAnim{0%{transform:scale(0);opacity:.4}100%{transform:scale(1);opacity:0}}';
    document.head.appendChild(style);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position:absolute;border-radius:50%;
      background:rgba(255,255,255,.20);
      width:${size}px;height:${size}px;
      top:${e.clientY - rect.top - size/2}px;
      left:${e.clientX - rect.left - size/2}px;
      transform:scale(0);
      animation:rippleAnim .6s cubic-bezier(0,.55,.45,1) forwards;
      pointer-events:none;z-index:10;
    `;
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
})();

// ─── Produto cards: stagger reveal ───────────────────────────
function revealProductCards() {
  const cards = document.querySelectorAll('.produto-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = 'none';
    setTimeout(() => {
      card.style.transition = 'opacity .4s ease, transform .4s ease';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, i * 60 + 40);
  });
}

const origRenderProducts = window.renderProducts;
if (typeof origRenderProducts === 'function') {
  window.renderProducts = function(cat) {
    origRenderProducts(cat);
    setTimeout(revealProductCards, 40);
  };
}

// ─── Tab btn + stagger inicial ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.categorias-tabs .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('tab-btn--active', 'tab-btn--ativo'));
      btn.classList.add('tab-btn--active');
    });
  });

  setTimeout(revealProductCards, 400);
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
