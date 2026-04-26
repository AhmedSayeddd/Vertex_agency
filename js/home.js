// home.js — Home page specific interactions

(function () {
  /* ── Typewriter hero badge ─────────────────────────────── */
  function initHeroBadge() {
    const badge = document.getElementById('hero-badge-text');
    if (!badge) return;

    const phrases = [
      '🚀 AI-Powered Job Matching',
      '💼 24 Active Opportunities',
      '⚡ Get Matched in Seconds',
    ];
    let i = 0;

    setInterval(() => {
      badge.style.opacity = '0';
      setTimeout(() => {
        i = (i + 1) % phrases.length;
        badge.textContent = phrases[i];
        badge.style.opacity = '1';
      }, 400);
    }, 3000);

    badge.style.transition = 'opacity 0.4s ease';
  }

  /* ── Particle dots on canvas ───────────────────────────── */
  function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, particles;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.floor((W * H) / 22000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x:  Math.random() * W,
          y:  Math.random() * H,
          r:  Math.random() * 1.5 + 0.4,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          a:  Math.random() * 0.5 + 0.2,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20,184,166,${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
  }

  function init() {
    initHeroBadge();
    initParticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
