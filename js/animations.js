// ============================================================
// animations.js — RR Distribuidora v2
// Header scroll, scroll reveal, counters, ripple, cursor glow,
// testimonial tilt, stagger cards, smooth scroll
// ============================================================

// ─── Header glassmorphism on scroll ─────────────────────────
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
  }, { threshold: 0.10, rootMargin: '0px 0px -32px 0px' });

  els.forEach(el => observer.observe(el));
})();

// ─── Contadores animados (easing) ───────────────────────────
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
        animateCounter(entry.target, target, 1800);
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
    style.textContent = '@keyframes rippleAnim{0%{transform:scale(0);opacity:.5}100%{transform:scale(1);opacity:0}}';
    document.head.appendChild(style);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2.2;
    ripple.style.cssText = `
      position:absolute;
      border-radius:50%;
      background:rgba(255,255,255,.25);
      width:${size}px; height:${size}px;
      top:${e.clientY - rect.top - size/2}px;
      left:${e.clientX - rect.left - size/2}px;
      transform:scale(0);
      animation:rippleAnim .65s cubic-bezier(0,.55,.45,1) forwards;
      pointer-events:none; z-index:10;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
})();

// ─── Testimonial cards: tilt 3D ao hover ─────────────────────
(function initCardTilt() {
  const cards = document.querySelectorAll('.testimonial-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `
        translateY(-10px) scale(1.01)
        rotateX(${(-y * 8).toFixed(1)}deg)
        rotateY(${(x * 8).toFixed(1)}deg)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();

// ─── Feature cards: micro tilt ───────────────────────────────
(function initFeatureTilt() {
  const cards = document.querySelectorAll('.feature-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `
        translateY(-12px) scale(1.015)
        rotateX(${(-y * 5).toFixed(1)}deg)
        rotateY(${(x * 5).toFixed(1)}deg)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1), box-shadow .45s ease, border-color .26s ease';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();

// ─── Produto cards: stagger reveal ───────────────────────────
function revealProductCards() {
  const cards = document.querySelectorAll('.produto-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(28px) scale(.97)';
    card.style.transition = 'none';
    setTimeout(() => {
      card.style.transition = 'opacity .5s ease, transform .55s cubic-bezier(.34,1.56,.64,1)';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, i * 75 + 50);
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

  setTimeout(revealProductCards, 500);

  // Parallax suave no hero
  const heroRight = document.querySelector('.hero__right');
  if (heroRight) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 800) {
        heroRight.style.transform = `translateY(${y * 0.06}px)`;
      }
    }, { passive: true });
  }
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
  const top = target.getBoundingClientRect().top + window.scrollY - headerH - annoH - 20;
  window.scrollTo({ top, behavior: 'smooth' });
});
