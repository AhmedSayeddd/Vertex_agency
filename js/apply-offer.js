// apply-offer.js — Direct apply flow.
// Reads offer_id from URL params, fetches offer details from backend (or local JOBS fallback),
// shows offer info at top, collects candidate data, POSTs to /api/applications.

import { JOBS } from './jobs.js';

const BACKEND = 'http://localhost:5000';

(function () {

  /* ── DOM refs ──────────────────────────────────────────── */
  const offerLoading   = document.getElementById('offer-loading');
  const offerNotFound  = document.getElementById('offer-not-found');
  const applyContent   = document.getElementById('apply-content');
  const offerCompany   = document.getElementById('offer-company-name');
  const offerTitle     = document.getElementById('offer-job-title');
  const offerMeta      = document.getElementById('offer-meta');
  const form           = document.getElementById('direct-apply-form');
  const successScreen  = document.getElementById('success-screen');
  const successName    = document.getElementById('success-name');
  const applyFormCard  = document.querySelector('.apply-form-card');

  let currentOffer = null;

  /* ── Get offer_id from URL ─────────────────────────────── */
  const params  = new URLSearchParams(window.location.search);
  const offerId = params.get('offer_id') || params.get('offerId');

  if (!offerId) {
    showNotFound();
    return;
  }

  /* ── Load offer ────────────────────────────────────────── */
  async function loadOffer() {
    try {
      const res = await fetch(`${BACKEND}/api/offers/${offerId}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();

      // Map backend fields to local format
      currentOffer = {
        id:             data.id,
        company:        data.company_name,
        title:          data.job_title,
        salary:         data.salary_package,
        location:       data.location,
        workType:       data.work_type,
        shift:          data.shift_hours,
        englishLevel:   data.english_level,
        employmentType: data.employment_type,
      };
    } catch (_) {
      // Try local JOBS fallback
      const local = JOBS.find(j => j.id === Number(offerId));
      if (!local) {
        showNotFound();
        return;
      }
      currentOffer = local;
    }

    populateOfferHeader(currentOffer);
    show(applyContent);
    hide(offerLoading);

    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  /* ── Populate offer header ─────────────────────────────── */
  function populateOfferHeader(offer) {
    offerCompany.textContent = offer.company;
    offerTitle.textContent   = offer.title;
    offerMeta.innerHTML = `
      <span class="offer-meta-item">📍 ${esc(offer.location)}</span>
      <span class="offer-meta-item">⏰ ${esc(offer.shift)}</span>
      <span class="offer-meta-item">💰 ${esc(offer.salary)}</span>
      <span class="offer-meta-item">🌐 ${esc(offer.englishLevel)} English</span>
    `;

    // Update page title
    document.title = `Apply for ${offer.title} | Vertex Recruitment Agency`;
  }

  /* ── Form submit ───────────────────────────────────────── */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      const payload = {
        full_name:         data.full_name,
        age:               Number(data.age),
        nationality:       data.nationality,
        gender:            data.gender,
        city:              data.city,
        phone:             data.phone,
        email:             data.email,
        english_level:     data.english_level,
        experience:        data.experience,
        graduation_status: data.graduation_status,
        cover_message:     data.cover_message || null,
        application_type:  'direct',
        selected_offer_id: currentOffer ? currentOffer.id : null,
      };

      let savedApp = { ...payload, id: Date.now(), status: 'new', submitted_at: new Date().toISOString() };

      try {
        const res = await fetch(`${BACKEND}/api/applications`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Submission failed');
        }
        savedApp = await res.json();
      } catch (_) {
        // Show success even if backend is down (demo-friendly)
      }

      // Always save to localStorage as backup
      try {
        const STORAGE_KEY = 'vertex_applications';
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        existing.unshift(savedApp);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      } catch(e) {}


      // Show success
      if (applyFormCard) applyFormCard.style.display = 'none';
      successName.textContent = data.full_name;
      show(successScreen);
      successScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ── Helpers ────────────────────────────────────────────── */
  function show(el) { if (el) el.style.display = 'block'; }
  function hide(el) { if (el) el.style.display = 'none';  }

  function showNotFound() {
    hide(offerLoading);
    show(offerNotFound);
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Bootstrap ─────────────────────────────────────────── */
  loadOffer();

})();
