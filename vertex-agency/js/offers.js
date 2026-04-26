// offers.js — Renders job offer cards, applies search / filter logic.
// Imports JOBS from jobs.js (ES module). Falls back to backend API first.

import { JOBS } from './jobs.js';

(async function () {

  /* ── Elements ────────────────────────────────────────────── */
  const grid         = document.getElementById('offers-grid');
  const searchInput  = document.getElementById('search-input');
  const typeFilter   = document.getElementById('work-type-filter');
  const countLabel   = document.getElementById('result-count');

  let allJobs = [];

  /* ── Fetch jobs (backend → local fallback) ──────────────── */
  async function loadJobs() {
    showSkeletons();
    try {
      const res = await fetch('http://localhost:5000/api/offers?status=active');
      if (!res.ok) throw new Error('backend unavailable');
      const data = await res.json();
      allJobs = data.map(j => ({
        id:             j.id,
        company:        j.company_name,
        title:          j.job_title,
        salary:         j.salary_package,
        location:       j.location,
        workType:       j.work_type,
        shift:          j.shift_hours,
        englishLevel:   j.english_level,
        experience:     j.experience_required,
        employmentType: j.employment_type,
        graduation:     j.graduation_status,
        nationality:    j.nationality,
        gender:         j.gender,
        maxAge:         j.max_age,
      }));
    } catch (_) {
      // Use local JOBS array
      allJobs = JOBS;
    }

    renderJobs(allJobs);
  }

  /* ── Skeleton loader ────────────────────────────────────── */
  function showSkeletons() {
    grid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      grid.innerHTML += `
        <div class="skeleton-card">
          <div class="skeleton-line short" style="margin-bottom:1rem;height:12px;"></div>
          <div class="skeleton-line medium" style="height:18px;margin-bottom:0.5rem;"></div>
          <div class="skeleton-line long"></div>
          <div class="skeleton-line long"></div>
          <div class="skeleton-line medium" style="margin-top:1rem;"></div>
        </div>`;
    }
  }

  /* ── Render cards ───────────────────────────────────────── */
  function renderJobs(jobs) {
    grid.innerHTML = '';

    if (countLabel) {
      countLabel.innerHTML = `<span>${jobs.length}</span> offer${jobs.length !== 1 ? 's' : ''} found`;
    }

    if (jobs.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <p>😕 No offers match your search. Try different filters.</p>
        </div>`;
      return;
    }

    jobs.forEach((job, idx) => {
      const delay = (idx % 9) * 80;
      const tags  = buildTags(job);

      const card = document.createElement('article');
      card.className = 'glass-card offer-card';
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', delay);

      card.innerHTML = `
        <div class="offer-card-top">
          <span class="offer-company">${escHtml(job.company)}</span>
          <h3 class="offer-title">${escHtml(job.title)}</h3>
          <div class="offer-tags">${tags}</div>
          <div class="offer-details-list">
            <div class="detail-row">
              <span class="detail-label">Salary</span>
              <span class="detail-value salary-value">${escHtml(job.salary)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location</span>
              <span class="detail-value">${escHtml(job.location)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Shift</span>
              <span class="detail-value">${escHtml(job.shift)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Experience</span>
              <span class="detail-value">${escHtml(job.experience)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">English</span>
              <span class="detail-value">${escHtml(job.englishLevel)}</span>
            </div>
          </div>
        </div>
        <div class="offer-card-bottom">
          <a href="apply-offer.html?offer_id=${job.id}" class="btn btn-primary btn-full">Apply for this Role</a>
        </div>
      `;
      grid.appendChild(card);
    });

    // Re-init AOS for newly added elements
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function buildTags(job) {
    const items = [
      { value: job.workType,       cls: job.workType === 'wfh' ? 'tag-teal' : '' },
      { value: job.employmentType, cls: '' },
      { value: job.englishLevel + ' English', cls: 'tag-green' },
    ];
    return items.map(t =>
      `<span class="tag ${t.cls}">${escHtml(t.value)}</span>`
    ).join('');
  }

  function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Filtering ──────────────────────────────────────────── */
  function filterAndRender() {
    const q    = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const type = typeFilter ? typeFilter.value : 'all';

    const filtered = allJobs.filter(job => {
      const matchSearch = !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);

      const matchType = type === 'all' || job.workType === type;

      return matchSearch && matchType;
    });

    renderJobs(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', filterAndRender);
  if (typeFilter)  typeFilter.addEventListener('change', filterAndRender);

  /* ── Bootstrap ──────────────────────────────────────────── */
  await loadJobs();

})();
