// admin-register.js — Admin registration logic.
// POST /api/auth/register with secretCode → success → redirect to admin-login.html.

(function () {
  const BACKEND = 'http://localhost:5000';

  const form         = document.getElementById('register-form');
  const errorBox     = document.getElementById('register-error');
  const successBox   = document.getElementById('register-success');
  const registerBtn  = document.getElementById('register-btn');

  // Password reveal toggles
  setupToggle('toggle-pw1', 'password');
  setupToggle('toggle-pw2', 'secret_code');

  function setupToggle(btnId, fieldId) {
    const btn   = document.getElementById(btnId);
    const field = document.getElementById(fieldId);
    if (!btn || !field) return;
    btn.addEventListener('click', () => {
      const isText = field.type === 'text';
      field.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMessages();

      const username        = document.getElementById('username').value.trim();
      const password        = document.getElementById('password').value.trim();
      const confirmPassword = document.getElementById('confirm_password').value.trim();
      const secretCode      = document.getElementById('secret_code').value.trim();

      // Client-side validation
      if (password !== confirmPassword) {
        return showError('Passwords do not match.');
      }
      if (password.length < 8) {
        return showError('Password must be at least 8 characters.');
      }
      if (username.length < 3) {
        return showError('Username must be at least 3 characters.');
      }

      setLoading(true);

      try {
        const res = await fetch(`${BACKEND}/api/auth/register`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ username, password, confirmPassword, secretCode }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showSuccess('Account created! Redirecting to login…');
          setTimeout(() => { window.location.href = 'admin-login.html'; }, 1800);
        } else {
          showError(data.error || 'Registration failed. Check your secret code.');
        }
      } catch (_) {
        showError('Cannot reach server. Please try again later.');
      } finally {
        setLoading(false);
      }
    });
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }

  function showSuccess(msg) {
    if (!successBox) return;
    successBox.textContent = msg;
    successBox.style.display = 'block';
  }

  function hideMessages() {
    if (errorBox)   errorBox.style.display   = 'none';
    if (successBox) successBox.style.display = 'none';
  }

  function setLoading(on) {
    if (!registerBtn) return;
    registerBtn.disabled    = on;
    registerBtn.textContent = on ? 'Creating account…' : 'Create Account';
  }
})();
