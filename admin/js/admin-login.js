/* ============================================================
   MetaVault Admin — Login Page JS
   ============================================================ */
const ADMIN_EMAIL    = 'admin@metavault.io';
const ADMIN_PASSWORD = 'admin123';
const SESSION_KEY    = 'metaVault_session';

/* Redirect if already logged in as admin */
(function () {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (s && s.role === 'admin') window.location.replace('index.html');
  } catch (_) {}
})();

function togglePw() {
  const inp  = document.getElementById('password');
  const eye  = document.getElementById('pw-eye');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  eye.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

function fillDemo() {
  document.getElementById('email').value    = ADMIN_EMAIL;
  document.getElementById('password').value = ADMIN_PASSWORD;
  clearError();
}

function setLoading(on) {
  const btn  = document.getElementById('login-btn');
  const txt  = document.getElementById('btn-text');
  const spin = document.getElementById('btn-spin');
  btn.disabled       = on;
  txt.style.display  = on ? 'none' : '';
  spin.style.display = on ? 'block' : 'none';
}

function showError(msg) {
  const el = document.getElementById('login-error');
  document.getElementById('login-error-msg').textContent = msg;
  el.classList.add('show');
}

function clearError() {
  document.getElementById('login-error').classList.remove('show');
  document.getElementById('email-msg').textContent = '';
  document.getElementById('pw-msg').textContent    = '';
  document.getElementById('email').classList.remove('error');
  document.getElementById('password').classList.remove('error');
}

function fieldError(id, msgId, msg) {
  document.getElementById(id).classList.add('error');
  const m = document.getElementById(msgId);
  m.textContent = msg;
  m.className   = 'fi-msg error-msg';
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearError();

  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;

  let valid = true;
  if (!email) {
    fieldError('email', 'email-msg', 'Email is required');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldError('email', 'email-msg', 'Enter a valid email address');
    valid = false;
  }
  if (!pass) {
    fieldError('password', 'pw-msg', 'Password is required');
    valid = false;
  }
  if (!valid) return;

  setLoading(true);
  await delay(900);

  if (email.toLowerCase() === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
    const session = {
      id: 'admin-001', name: 'Admin', email: ADMIN_EMAIL,
      role: 'admin', loggedIn: true, ts: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    const params = new URLSearchParams(window.location.search);
    const next   = params.get('next');
    window.location.href = next && next.startsWith('admin/') ? '../' + next : 'index.html';
  } else {
    setLoading(false);
    const card = document.querySelector('.login-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'shake .4s ease';
    showError('Invalid email or password. Please check your credentials.');
  }
});
