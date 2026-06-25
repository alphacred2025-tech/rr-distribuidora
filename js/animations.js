// ============================================================
// animations.js — RR Distribuidora
// Scroll reveal, contadores animados, header scroll, ripple
// ============================================================

// ─── Header glassmorphism on scroll ─────────────────────────
(function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 40);
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
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();

// ─── Contadores animados ─────────────────────────────────────
(function initCounters() {
  function animateCounter(el, target, duration) {
    const suffix = el.textContent.replace(/[0-9]/g, '').trim();
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = Math.floor(start) + (suffix || '+');
      if (start >= target) {
        el.textContent = target + (suffix || '+');
        clearInterval(timer);
      }
    }, 16);
  }

  const counters = document.querySelectorAll('.count-up');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.done) {
        entry.target.dataset.done = '1';
        const target = parseInt(entry.target.dataset.target || '0');
        animateCounter(entry.target, target, 1400);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

// ─── Ripple nos botões ───────────────────────────────────────
(function initRipple() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position:absolute;
      border-radius:50%;
      background:rgba(255,255,255,.22);
      width:${size}px; height:${size}px;
      top:${e.clientY - rect.top - size/2}px;
      left:${e.clientX - rect.left - size/2}px;
      transform:scale(0);
      animation:rippleAnim .6s ease-out forwards;
      pointer-events:none; z-index:10;
    `;
    if (!document.getElementById('ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = '@keyframes rippleAnim{to{transform:scale(1);opacity:0}}';
      document.head.appendChild(style);
    }
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
})();

// ─── Produto cards: stagger reveal ───────────────────────────
function revealProductCards() {
  const cards = document.querySelectorAll('.produto-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    setTimeout(() => {
      card.style.transition = 'opacity .5s ease, transform .5s ease';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, i * 80);
  });
}

// Garante que o stagger roda quando os produtos são renderizados
const origRenderProducts = window.renderProducts;
if (typeof origRenderProducts === 'function') {
  window.renderProducts = function(cat) {
    origRenderProducts(cat);
    setTimeout(revealProductCards, 30);
  };
}

// ─── Tab btn: animação de slide ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.categorias-tabs .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('tab-btn--active', 'tab-btn--ativo'));
      btn.classList.add('tab-btn--active');
    });
  });

  // Dispara stagger inicial
  setTimeout(revealProductCards, 400);
});

// ─── Smooth scroll para âncoras internas ─────────────────────
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
