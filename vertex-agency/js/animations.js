// animations.js
// Initialises AOS (Animate On Scroll) and any shared micro-animations.

(function () {
  function initAOS() {
    if (typeof AOS === 'undefined') return;
    AOS.init({
      duration: 700,
      once: true,
      offset: 60,
      easing: 'ease-out-cubic',
    });
  }

  /* Animated counter for stat numbers */
  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        const el    = entry.target;
        const end   = parseFloat(el.getAttribute('data-count'));
        const isDecimal = String(end).includes('.');
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1800; // ms
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out quad
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = eased * end;

          el.textContent = (isDecimal ? value.toFixed(1) : Math.floor(value)) + suffix;

          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = end + suffix;
        }

        requestAnimationFrame(tick);
      });
    }, { threshold: 0.3 });

    counters.forEach(el => observer.observe(el));
  }

  function init() {
    initAOS();
    animateCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
