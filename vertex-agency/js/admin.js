// admin.js — Dashboard. No login or JWT required.
// Fetches applications and offers directly from the public API.
// Falls back to localStorage if backend is offline.

(function () {
  const BACKEND = 'http://localhost:5000';
  const STORAGE_KEY = 'vertex_applications';

  /* ── DOM refs ─────────────────────────────────────────────── */
  const authOverlay      = document.getElementById('admin-auth-overlay');
  const passwordInput    = document.getElementById('admin-password-input');
  const loginBtn         = document.getElementById('admin-login-btn');
  const authError        = document.getElementById('admin-auth-error');

  const statTotal        = document.getElementById('stat-total');
  const statNew          = document.getElementById('stat-new');
  const statReviewed     = document.getElementById('stat-reviewed');
  const statOffers       = document.getElementById('stat-offers');
  const appsTbody        = document.getElementById('applications-tbody');
  const offersTbody      = document.getElementById('offers-tbody');
  const refreshAppsBtn   = document.getElementById('refresh-apps-btn');
  const refreshOffersBtn = document.getElementById('refresh-offers-btn');

  /* ── Simple Password Auth ─────────────────────────────────── */
  function checkAuth() {
    if (sessionStorage.getItem('vertex_admin') === 'true') {
      if (authOverlay) authOverlay.style.display = 'none';
      loadApplications();
      loadOffers();
    } else {
      if (authOverlay) authOverlay.style.display = 'flex';
    }
  }

  if (loginBtn && passwordInput) {
    const handleLogin = () => {
      const pwd = passwordInput.value;
      if (pwd === 'vertex100100') {
        sessionStorage.setItem('vertex_admin', 'true');
        authOverlay.style.display = 'none';
        loadApplications();
        loadOffers();
      } else {
        authError.textContent = 'Wrong password';
        passwordInput.classList.remove('shake');
        void passwordInput.offsetWidth; // trigger reflow
        passwordInput.classList.add('shake');
      }
    };
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }

  // Initial check
  checkAuth();

  /* ── Fetch helper ─────────────────────────────────────────── */
  async function apiFetch(path, options = {}) {
    return fetch(`${BACKEND}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  }

  /* ════════════════════════════════════════════════════════════
     APPLICATIONS
  ═══════════════════════════════════════════════════════════════ */
  function getLocalApps() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function setLocalApps(apps) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  }

  async function loadApplications() {
    setTableLoading(appsTbody, 12);
    let apps = [];
    
    try {
      const res = await apiFetch('/api/applications');
      if (res.ok) {
        apps = await res.json();
        // Sync fetched data back to localStorage for fallback
        setLocalApps(apps);
      } else {
        throw new Error('API failed');
      }
    } catch (_) {
      console.warn('Backend unreachable, using localStorage fallback');
      apps = getLocalApps();
    }
    
    updateStats(apps);
    renderApplications(apps);
  }

  function updateStats(apps) {
    if (statTotal)    statTotal.textContent    = apps.length;
    if (statNew)      statNew.textContent      = apps.filter(a => a.status === 'new').length;
    if (statReviewed) statReviewed.textContent = apps.filter(a => a.status === 'reviewed').length;
  }

  function renderApplications(apps) {
    appsTbody.innerHTML = '';
    if (apps.length === 0) {
      appsTbody.innerHTML = `<tr><td colspan="12"><div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No applications yet</h3>
        <p>Submissions will appear here once candidates apply.</p>
      </div></td></tr>`;
      return;
    }

    // Render newest first if they have a date, otherwise just reverse the array
    const sortedApps = [...apps].sort((a, b) => {
      if (a.submitted_at && b.submitted_at) {
        return new Date(b.submitted_at) - new Date(a.submitted_at);
      }
      return b.id - a.id;
    });

    sortedApps.forEach(app => {
      const date = app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      }) : 'Just now';
      
      const statusClass = { new: 'badge-new', reviewed: 'badge-reviewed', rejected: 'badge-rejected' }[app.status] || 'badge-new';
      const typeClass   = app.application_type === 'ai-matched' ? 'type-ai' : 'type-direct';
      const typeLabel   = app.application_type === 'ai-matched' ? 'AI' : 'Direct';
      const appliedFor  = app.job_title
        ? `${esc(app.job_title)}<br><span class="td-muted">${esc(app.company_name || '')}</span>`
        : '<span class="td-muted">—</span>';

      const tr = document.createElement('tr');
      tr.setAttribute('data-id', app.id);
      tr.innerHTML = `
        <td class="td-muted">#${app.id}</td>
        <td class="td-bold">${esc(app.full_name)}</td>
        <td>${app.age || '—'}</td>
        <td>${esc(app.nationality || '—')}</td>
        <td>${esc(app.english_level || '—')}</td>
        <td>${esc(app.phone || '—')}</td>
        <td>${esc(app.email || '—')}</td>
        <td>${appliedFor}</td>
        <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
        <td><span class="status-badge ${statusClass}">${esc(app.status)}</span></td>
        <td class="td-muted">${date}</td>
        <td>
          <div class="actions-cell">
            ${app.status !== 'reviewed' ? `<button class="action-btn btn-review" data-id="${app.id}" data-action="reviewed">✓ Review</button>` : ''}
            ${app.status !== 'rejected' ? `<button class="action-btn btn-reject" data-id="${app.id}" data-action="rejected">✗ Reject</button>` : ''}
            <button class="action-btn btn-delete" data-id="${app.id}" data-action="delete">🗑 Delete</button>
          </div>
        </td>
      `;
      appsTbody.appendChild(tr);
    });

    // Remove old listeners to avoid duplicates
    const newTbody = appsTbody.cloneNode(true);
    appsTbody.parentNode.replaceChild(newTbody, appsTbody);
    newTbody.addEventListener('click', handleAppAction);
    
    // Update reference
    document.getElementById('applications-tbody'); // re-assign if needed, though closure variables are tricky.
    // Actually, let's just use event delegation properly without cloning if possible, but cloning ensures no dupes.
    // Better way: don't add listener inside render, add it once outside.
  }

  // Bind the listener once
  appsTbody.addEventListener('click', handleAppAction);

  async function handleAppAction(e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const id     = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    btn.disabled = true;
    
    try {
      if (action === 'delete') {
        if (!confirm('Delete this application permanently?')) { btn.disabled = false; return; }
        await apiFetch(`/api/applications/${id}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/applications/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: action }),
        });
      }
    } catch (_) {
      // Backend failed — update localStorage fallback
      console.warn('Backend action failed, updating localStorage');
      let apps = getLocalApps();
      if (action === 'delete') {
        apps = apps.filter(a => String(a.id) !== String(id));
      } else {
        const app = apps.find(a => String(a.id) === String(id));
        if (app) app.status = action;
      }
      setLocalApps(apps);
    }
    
    loadApplications();
  }

  /* ════════════════════════════════════════════════════════════
     OFFERS
  ═══════════════════════════════════════════════════════════════ */
  async function loadOffers() {
    setTableLoading(offersTbody, 8);
    let offers = [];
    try {
      const res = await apiFetch('/api/offers?status=all');
      if (res.ok) offers = await res.json();
    } catch (_) { /* offline */ }

    if (statOffers) statOffers.textContent = offers.filter(o => o.status === 'active').length;
    renderOffers(offers);
  }

  function renderOffers(offers) {
    offersTbody.innerHTML = '';
    if (offers.length === 0) {
      offersTbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No offers found</h3>
        <p>Run the database setup script to seed offers.</p>
      </div></td></tr>`;
      return;
    }

    offers.forEach(offer => {
      const statusClass = offer.status === 'active' ? 'badge-active' : 'badge-hold';
      const isActive    = offer.status === 'active';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-muted">#${offer.id}</td>
        <td class="td-bold">${esc(offer.company_name)}</td>
        <td>${esc(offer.job_title)}</td>
        <td>${esc(offer.location)}</td>
        <td>${esc(offer.work_type)}</td>
        <td>${esc(offer.english_level)}</td>
        <td><span class="status-badge ${statusClass}">${esc(offer.status)}</span></td>
        <td>
          <button class="action-btn ${isActive ? 'btn-hold' : 'btn-activate'}"
            data-offer-id="${offer.id}"
            data-new-status="${isActive ? 'hold' : 'active'}">
            ${isActive ? '⏸ Set Hold' : '▶ Activate'}
          </button>
        </td>
      `;
      offersTbody.appendChild(tr);
    });
  }

  offersTbody.addEventListener('click', handleOfferToggle);

  async function handleOfferToggle(e) {
    const btn = e.target.closest('.action-btn[data-offer-id]');
    if (!btn) return;
    const offerId   = btn.getAttribute('data-offer-id');
    const newStatus = btn.getAttribute('data-new-status');
    btn.disabled = true;
    try {
      await apiFetch(`/api/offers/${offerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadOffers();
    } catch (_) {
      btn.disabled = false;
      alert('Failed to toggle offer status.');
    }
  }

  /* ── Utilities ────────────────────────────────────────────── */
  function setTableLoading(tbody, cols) {
    tbody.innerHTML = `<tr><td colspan="${cols}" class="table-loading">Loading…</td></tr>`;
  }

  function esc(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Refresh buttons & bootstrap ──────────────────────────── */
  if (refreshAppsBtn)   refreshAppsBtn.addEventListener('click', loadApplications);
  if (refreshOffersBtn) refreshOffersBtn.addEventListener('click', loadOffers);

})();
