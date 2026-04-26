// apply.js — Smart AI matching form.
// Step 1: Collect candidate profile.
// Step 2: Call OpenRouter AI (via backend), render matched offers.
// Step 3: Candidate selects an offer → POST /api/applications → success screen.

import { JOBS } from './jobs.js';

(function () {

  /* ── Base URL — auto-detect dev vs production ────────────── */
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://vertex-backend.fly.dev';  // same domain in production

  /* ── DOM refs ────────────────────────────────────────────── */
  const step1        = document.getElementById('step-1');
  const loadingState = document.getElementById('loading-state');
  const step2        = document.getElementById('step-2');
  const step3        = document.getElementById('step-3');
  const form         = document.getElementById('profile-form');
  const matchesGrid  = document.getElementById('matches-container');

  let candidateData = {};
  let jobsData      = JOBS;

  /* ── Pre-load jobs from backend ─────────────────────────── */
  async function preloadJobs() {
    try {
      const res = await fetch(`${API_BASE}/api/offers?status=active`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data && data.length) {
        jobsData = data.map(j => ({
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
      }
    } catch (_) {
      // local JOBS fallback already set
    }
  }

  /* ── Form submit ─────────────────────────────────────────── */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      candidateData = Object.fromEntries(fd.entries());

      step1.style.display = 'none';
      loadingState.style.display = 'block';

      try {
        const matches = await callAI(candidateData);
        renderMatches(matches);
        loadingState.style.display = 'none';
        step2.style.display = 'block';
      } catch (err) {
        console.error('AI error:', err);
        loadingState.style.display = 'none';
        step1.style.display = 'block';
        alert('AI matching failed. Please try again.\n\n' + err.message);
      }
    });
  }

  /* ── AI call via backend only (key stays server-side) ────── */
  async function callAI(candidate) {
    const res = await fetch(`${API_BASE}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    return res.json();
  }

  /* ── Render match cards ──────────────────────────────────── */
  function renderMatches(matches) {
    matchesGrid.innerHTML = '';

    if (!matches || matches.length === 0) {
      matchesGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#94A3B8;">
          <p>No close matches found for your profile right now. Try adjusting your preferences.</p>
        </div>`;
      return;
    }

    matches.forEach(m => {
      const job = jobsData.find(j => j.id === m.jobId || j.id === Number(m.jobId));
      if (!job) return;

      const card = document.createElement('article');
      card.className = 'glass-card match-card';
      card.innerHTML = `
        <div class="match-card-top">
          <div class="match-company">${esc(job.company)}</div>
          <h3 class="match-title">${esc(job.title)}</h3>
          <p class="match-meta">${esc(job.location)} &bull; ${esc(job.shift)}</p>
          <p class="salary-highlight">${esc(job.salary)}</p>
          <div class="match-reason-box">
            <strong>Why it matches</strong>
            ${esc(m.matchReason)}
          </div>
        </div>
        <div class="match-card-bottom">
          <button class="btn btn-primary btn-full select-btn" data-job-id="${job.id}">
            Select This Offer
          </button>
        </div>
      `;
      matchesGrid.appendChild(card);
    });

    document.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        submitApplication(btn.getAttribute('data-job-id'));
      });
    });
  }

  /* ── Submit application ──────────────────────────────────── */
  async function submitApplication(jobId) {
    const payload = {
      ...candidateData,
      selected_offer_id: Number(jobId),
      application_type: 'ai-matched',
    };

    let savedApp = {
      ...payload,
      id: Date.now(),
      status: 'new',
      submitted_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        savedApp = await res.json();
      }
    } catch (_) {
      // Backend unavailable — localStorage fallback below
    }

    // Save to localStorage as backup
    try {
      const STORAGE_KEY = 'vertex_applications';
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      existing.unshift(savedApp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {}

    step2.style.display = 'none';
    step3.style.display = 'block';
    step3.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ── Utility ─────────────────────────────────────────────── */
  function esc(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Bootstrap ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadJobs);
  } else {
    preloadJobs();
  }

})();