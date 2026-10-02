/* ============================================
   Syed Hashir Ali — Personal Site
   Shared JS. Loaded on every page.
   ============================================ */

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  navLinks.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
      navToggle.focus();
    }
  });
}

// Scroll-reveal animation
try {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  els.forEach(el => io.observe(el));
} catch (e) {}

// Animated stat counters (numbers like "600+", "17")
try {
  const stats = document.querySelectorAll('.stat b');
  const statIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target, raw = el.textContent, num = parseInt(raw), suffix = raw.replace(/[0-9]/g, '');
        if (!isNaN(num)) {
          let cur = 0; const step = Math.max(1, Math.round(num / 30));
          const t = setInterval(() => { cur += step; if (cur >= num) { cur = num; clearInterval(t); } el.textContent = cur + suffix; }, 30);
        }
        statIO.unobserve(el);
      }
    });
  }, { threshold: .4 });
  stats.forEach(s => statIO.observe(s));
} catch (e) {}

// Contact form (front-end only — wire this to Formspree/Netlify Forms/your own backend before going live)
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = document.querySelector('#form-status');
    if (status) status.textContent = 'This form is not yet connected to an email service — see README.md for setup instructions.';
  });
}
