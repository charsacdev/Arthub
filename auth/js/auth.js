/* ============================================================
   ArtsHub — Auth JS
   ============================================================ */

/* ---- Constants ---- */
const ADMIN_EMAIL    = 'admin@artshub.io';
const ADMIN_PASSWORD = 'admin123';
const SESSION_KEY    = 'artsHub_session';
const USERS_KEY      = 'artsHub_users';

/* ---- Toast ---- */
function toast(msg, type = 'ok') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 3400);
}

/* ---- Session ---- */
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function requireAuth(redirectTo = '../auth/login.html') {
  const s = getSession();
  if (!s || !s.loggedIn) { window.location.href = redirectTo; return false; }
  return s;
}

function requireAdmin(redirectTo = '../auth/login.html') {
  const s = getSession();
  if (!s || !s.loggedIn || s.role !== 'admin') { window.location.href = redirectTo; return false; }
  return s;
}

/* ---- Users store ---- */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUser(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function registerUser(data) {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) return false;
  users.push({ ...data, id: Date.now(), createdAt: new Date().toISOString() });
  saveUsers(users);
  return true;
}

/* ---- Redirect after login ---- */
function redirectAfterLogin(role) {
  const next = new URLSearchParams(window.location.search).get('next');
  if (next) { window.location.href = decodeURIComponent(next); return; }
  window.location.href = role === 'admin' ? '../admin/index.html' : '../dashboard/index.html';
}

/* ============================================================
   PASSWORD STRENGTH
   ============================================================ */
function checkStrength(pw) {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;
  return score; // 0-4
}

function renderStrength(inputId) {
  const input = document.getElementById(inputId);
  const bars  = document.querySelectorAll('.pw-bar');
  const lbl   = document.querySelector('.pw-strength-lbl');
  if (!input || !bars.length) return;

  const pw    = input.value;
  const score = checkStrength(pw);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const levels = ['', 'weak', 'fair', 'strong', 'strong'];

  bars.forEach((b, i) => {
    b.className = 'pw-bar';
    if (pw.length && i < score) b.classList.add(levels[score]);
  });
  if (lbl) {
    lbl.textContent = pw.length ? `Password strength: ${labels[score]}` : '';
    lbl.style.color = ['', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'][score];
  }
}

/* ============================================================
   PASSWORD VISIBILITY TOGGLE
   ============================================================ */
function togglePw(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  if (btn) btn.innerHTML = show
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ============================================================
   ROLE SELECTOR
   ============================================================ */
function selectRole(value) {
  document.querySelectorAll('.role-card').forEach(card => {
    const isSelected = card.dataset.role === value;
    card.classList.toggle('selected', isSelected);
    const check = card.querySelector('.role-check');
    if (check) check.textContent = isSelected ? '✓' : '';
  });
  const hidden = document.getElementById('selected-role');
  if (hidden) hidden.value = value;
}

/* ============================================================
   FIELD VALIDATION
   ============================================================ */
function setFieldState(id, state, msg = '') {
  const fi = document.getElementById(id);
  if (!fi) return;
  fi.classList.remove('error', 'success');
  if (state) fi.classList.add(state);
  const msgEl = fi.closest('.fg')?.querySelector('.fi-msg');
  if (msgEl) {
    msgEl.textContent = msg;
    msgEl.className = `fi-msg ${state === 'error' ? 'err' : state === 'success' ? 'ok' : 'hint'}`;
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return pw.length >= 8;
}

/* ============================================================
   LOADING STATE
   ============================================================ */
function setLoading(btnId, state) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', state);
}

function simulateDelay(ms = 1400) {
  return new Promise(r => setTimeout(r, ms));
}

/* ============================================================
   WALLET CONNECT (simulated)
   ============================================================ */
async function connectWallet() {
  const btn = document.getElementById('wallet-btn');
  if (btn) { btn.textContent = 'Connecting…'; btn.disabled = true; }
  await simulateDelay(1200);
  const fakeWallet = '0x' + Math.random().toString(16).slice(2, 12) + '…' + Math.random().toString(16).slice(2, 6);
  const walletEl = document.getElementById('wallet-display');
  if (walletEl) {
    walletEl.textContent = fakeWallet;
    walletEl.style.color = 'var(--success)';
  }
  if (btn) { btn.textContent = '✓ Wallet Connected'; btn.style.borderColor = 'rgba(0,229,160,.4)'; btn.style.color = 'var(--success)'; }
  document.getElementById('wallet-value') && (document.getElementById('wallet-value').value = fakeWallet);
  toast('Wallet connected: ' + fakeWallet);
}

/* ============================================================
   LOGIN
   ============================================================ */
async function handleLogin(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('login-email')?.value.trim();
  const pw    = document.getElementById('login-pw')?.value;
  const remember = document.getElementById('login-remember')?.checked;
  let valid = true;

  if (!email || !validateEmail(email)) {
    setFieldState('login-email', 'error', 'Enter a valid email address');
    valid = false;
  } else {
    setFieldState('login-email', 'success', '');
  }

  if (!pw || pw.length < 1) {
    setFieldState('login-pw', 'error', 'Password is required');
    valid = false;
  } else {
    setFieldState('login-pw', '', '');
  }

  if (!valid) return;

  setLoading('login-btn', true);
  await simulateDelay();

  // Admin check
  if (email.toLowerCase() === ADMIN_EMAIL && pw === ADMIN_PASSWORD) {
    const session = { loggedIn: true, role: 'admin', email, name: 'Admin', remember };
    setSession(session);
    toast('Welcome back, Admin!');
    setTimeout(() => redirectAfterLogin('admin'), 800);
    return;
  }

  // Creator check
  const user = findUser(email);
  if (!user || user.password !== pw) {
    setLoading('login-btn', false);
    setFieldState('login-pw', 'error', 'Incorrect email or password');
    toast('Login failed — check your credentials', 'err');
    return;
  }

  const session = { loggedIn: true, role: user.role || 'creator', email, name: user.name, remember };
  setSession(session);
  toast(`Welcome back, ${user.name}!`);
  setTimeout(() => redirectAfterLogin(session.role), 800);
}

/* ============================================================
   REGISTER
   ============================================================ */
async function handleRegister(e) {
  if (e) e.preventDefault();

  const name    = document.getElementById('reg-name')?.value.trim();
  const email   = document.getElementById('reg-email')?.value.trim();
  const pw      = document.getElementById('reg-pw')?.value;
  const pwConf  = document.getElementById('reg-pw-confirm')?.value;
  const role    = document.getElementById('selected-role')?.value || 'creator';
  const terms   = document.getElementById('reg-terms')?.checked;
  let valid = true;

  if (!name || name.length < 2) {
    setFieldState('reg-name', 'error', 'Name must be at least 2 characters');
    valid = false;
  } else {
    setFieldState('reg-name', 'success', '');
  }

  if (!email || !validateEmail(email)) {
    setFieldState('reg-email', 'error', 'Enter a valid email address');
    valid = false;
  } else if (findUser(email) || email.toLowerCase() === ADMIN_EMAIL) {
    setFieldState('reg-email', 'error', 'This email is already registered');
    valid = false;
  } else {
    setFieldState('reg-email', 'success', '');
  }

  if (!pw || !validatePassword(pw)) {
    setFieldState('reg-pw', 'error', 'Password must be at least 8 characters');
    valid = false;
  } else if (checkStrength(pw) < 2) {
    setFieldState('reg-pw', 'error', 'Password is too weak');
    valid = false;
  } else {
    setFieldState('reg-pw', 'success', '');
  }

  if (pw !== pwConf) {
    setFieldState('reg-pw-confirm', 'error', 'Passwords do not match');
    valid = false;
  } else if (pwConf) {
    setFieldState('reg-pw-confirm', 'success', '');
  }

  if (!terms) {
    toast('Please accept the Terms of Service', 'warn');
    valid = false;
  }

  if (!valid) return;

  setLoading('register-btn', true);
  await simulateDelay();

  const ok = registerUser({ name, email, password: pw, role, wallet: document.getElementById('wallet-value')?.value || '' });
  if (!ok) {
    setLoading('register-btn', false);
    setFieldState('reg-email', 'error', 'This email is already registered');
    toast('Registration failed', 'err');
    return;
  }

  const session = { loggedIn: true, role, email, name };
  setSession(session);
  toast(`Account created! Welcome, ${name} 🎉`);
  setTimeout(() => redirectAfterLogin(role), 900);
}

/* ============================================================
   FORGOT PASSWORD
   ============================================================ */
async function handleForgot(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('forgot-email')?.value.trim();
  if (!email || !validateEmail(email)) {
    setFieldState('forgot-email', 'error', 'Enter a valid email address');
    return;
  }
  setFieldState('forgot-email', 'success', '');
  setLoading('forgot-btn', true);
  await simulateDelay(1600);

  // Show success state
  const formEl  = document.getElementById('forgot-form');
  const doneEl  = document.getElementById('forgot-done');
  const emailEl = document.getElementById('sent-to-email');
  if (formEl)  formEl.style.display = 'none';
  if (doneEl)  doneEl.style.display = 'block';
  if (emailEl) emailEl.textContent = email;
  toast('Reset link sent — check your inbox');
}

/* ============================================================
   OTP INPUT BEHAVIOUR
   ============================================================ */
function initOTPInputs() {
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.slice(-1);
      if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && inputs[i - 1]) inputs[i - 1].focus();
    });
    inp.addEventListener('paste', e => {
      e.preventDefault();
      const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, inputs.length);
      [...paste].forEach((ch, j) => { if (inputs[i + j]) inputs[i + j].value = ch; });
      if (inputs[Math.min(i + paste.length, inputs.length - 1)]) {
        inputs[Math.min(i + paste.length, inputs.length - 1)].focus();
      }
    });
  });
}

/* ============================================================
   LOGOUT (called from dashboard/admin)
   ============================================================ */
function logout(redirectTo = '../auth/login.html') {
  clearSession();
  window.location.href = redirectTo;
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Wire login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Wire register form
  const regForm = document.getElementById('register-form');
  if (regForm) regForm.addEventListener('submit', handleRegister);

  // Wire forgot form
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) forgotForm.addEventListener('submit', handleForgot);

  // Password strength watcher
  const regPw = document.getElementById('reg-pw');
  if (regPw) regPw.addEventListener('input', () => renderStrength('reg-pw'));

  // Role cards
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => selectRole(card.dataset.role));
  });

  // OTP inputs
  initOTPInputs();

  // Email real-time feedback
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(inp => {
    inp.addEventListener('blur', () => {
      if (inp.value && !validateEmail(inp.value)) {
        setFieldState(inp.id, 'error', 'Enter a valid email address');
      } else if (inp.value) {
        setFieldState(inp.id, 'success', '');
      }
    });
  });

  // Confirm password real-time match
  const pwConfirm = document.getElementById('reg-pw-confirm');
  if (pwConfirm) {
    pwConfirm.addEventListener('input', () => {
      const pw = document.getElementById('reg-pw')?.value;
      if (!pwConfirm.value) return;
      if (pw === pwConfirm.value) {
        setFieldState('reg-pw-confirm', 'success', 'Passwords match');
      } else {
        setFieldState('reg-pw-confirm', 'error', 'Passwords do not match');
      }
    });
  }

  // If already logged in and on an auth page, redirect away
  const onAuthPage = window.location.pathname.includes('/auth/');
  if (onAuthPage) {
    const s = getSession();
    if (s?.loggedIn) redirectAfterLogin(s.role);
  }

  // Select creator role by default on register
  const defaultRole = document.querySelector('.role-card[data-role="creator"]');
  if (defaultRole) selectRole('creator');
});
