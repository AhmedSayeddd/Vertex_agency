// navbar.js
// Injects navbar.html and footer.html into placeholder divs.
// Sets the active nav link based on the current page filename.
// Handles mobile hamburger menu toggle.

(function () {
  /* ── Helpers ───────────────────────────────────────────── */

  /**
   * Try to fetch a component HTML file and inject into a container.
   * Falls back to a hard-coded string if the fetch fails (e.g., file:// protocol).
   */
  async function injectComponent(containerId, url, fallbackHtml) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const html = await res.text();
      container.innerHTML = html;
    } catch (_) {
      container.innerHTML = fallbackHtml;
    }
  }

  /* ── Navbar HTML (fallback) ─────────────────────────────── */
  const NAVBAR_HTML = `
    <nav class="navbar" id="main-navbar">
      <div class="container navbar-container">
        <a href="index.html" class="navbar-logo">
          <img src="assets/images/logo.png" alt="Vertex Recruitment Agency">
        </a>

        <button class="mobile-menu-toggle" id="mobile-toggle" aria-label="Toggle Menu">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <ul class="navbar-links" id="navbar-links">
          <li><a href="index.html"   class="nav-link" data-page="index.html">Home</a></li>
          <li><a href="about.html"   class="nav-link" data-page="about.html">About Us</a></li>
          <li><a href="offers.html"  class="nav-link" data-page="offers.html">Offers</a></li>
          <li><a href="contact.html" class="nav-link" data-page="contact.html">Contact</a></li>
        </ul>

        <div class="navbar-actions">
          <a href="admin.html" class="nav-link admin-nav-link" style="color: #14B8A6; margin-right: 0.5rem;">Admin</a>
          <a href="apply.html" class="btn btn-primary">Apply Now</a>
        </div>
      </div>
    </nav>
  `;

  /* ── Footer HTML (fallback) ─────────────────────────────── */
  const FOOTER_HTML = `
    <footer class="footer">
      <div class="container footer-container">
        <div class="footer-brand">
          <img src="assets/images/logo.png" alt="Vertex Recruitment Agency" class="footer-logo">
          <p class="footer-tagline">Connecting top talent with the best opportunities across the globe.</p>
        </div>
        <div class="footer-links">
          <div class="footer-column">
            <h4>Explore</h4>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="about.html">About Us</a></li>
              <li><a href="offers.html">Offers</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>Candidates</h4>
            <ul>
              <li><a href="apply.html">Smart Apply</a></li>
              <li><a href="offers.html">Browse Jobs</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <p>&copy; 2026 Vertex Recruitment Agency. All rights reserved.</p>
          <a href="admin.html" class="footer-admin-link" aria-label="Admin">&middot;</a>
        </div>
      </div>
    </footer>
  `;

  /* ── Active Link ────────────────────────────────────────── */
  function setActiveLink() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      const page = link.getAttribute('data-page');
      if (
        page === filename ||
        (filename === '' && page === 'index.html')
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* ── Scroll Effect ──────────────────────────────────────── */
  function initScrollEffect() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = () => {
      if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run immediately
  }

  /* ── Mobile Toggle ──────────────────────────────────────── */
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      document.body.classList.toggle('mobile-nav-open');
    });

    // Close menu when a nav link is clicked
    document.querySelectorAll('.navbar-links .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        document.body.classList.remove('mobile-nav-open');
      });
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  async function init() {
    await injectComponent('navbar-placeholder', 'components/navbar.html', NAVBAR_HTML);
    await injectComponent('footer-placeholder', 'components/footer.html', FOOTER_HTML);

    setActiveLink();
    initScrollEffect();
    initMobileMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
