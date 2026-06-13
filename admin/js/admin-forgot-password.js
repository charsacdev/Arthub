/* ============================================================
   TokenPixelBay Admin — Forgot Password JS
   ============================================================ */
const ADMIN_EMAIL = 'admin@tokenpixelbay.com';

function $(id) { return document.getElementById(id); }

function showError(msg) {
  const el = $('login-error');
  if (el) {
    $('login-error-msg').textContent = msg;
    el.classList.add('show');
  }
}

function clearError() {
  const el = $('login-error');
  if (el) el.classList.remove('show');
  const msg = $('email-msg');
  if (msg) msg.textContent = '';
  const input = $('email');
  if (input) input.classList.remove('error');
}

function fieldError(msg) {
  const input = $('email');
  if (input) input.classList.add('error');
  const m = $('email-msg');
  if (m) {
    m.textContent = msg;
    m.className = 'fi-msg error-msg';
  }
}

document.getElementById('forgot-form').addEventListener('submit', function (e) {
  e.preventDefault();
  clearError();

  const email = $('email').value.trim();

  if (!email) {
    fieldError('Email is required');
    return;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldError('Enter a valid email address');
    return;
  } else if (email.toLowerCase() !== ADMIN_EMAIL) {
    fieldError('This email is not associated with an admin account');
    return;
  }

  // Success - show OTP screen
  $('submit-btn').disabled = true;
  $('btn-spin').style.display = 'block';
  $('btn-text').style.display = 'none';

  setTimeout(() => {
    $('forgot-step-email').style.display = 'none';
    $('forgot-step-otp').style.display = 'block';
    setupOTP();
  }, 1000);
});

// OTP Input Handling
function setupOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach((box, idx) => {
    box.addEventListener('input', (e) => {
      // Clear non-numeric values
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length === 1 && idx < boxes.length - 1) {
        boxes[idx + 1].focus();
      }
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        boxes[idx - 1].focus();
      }
    });
  });
  boxes[0].focus();
}

function verifyOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  let code = '';
  boxes.forEach(b => code += b.value.trim());

  const err = $('otp-error');
  const errMsg = $('otp-error-msg');

  if (err) err.classList.remove('show');

  if (code.length < 6) {
    if (errMsg && err) {
      errMsg.textContent = 'Please enter the complete 6-digit code.';
      err.classList.add('show');
    }
    return;
  }

  // Verification step (accepts any code for the mockup flow)
  $('verify-btn').disabled = true;
  $('verify-btn').innerHTML = 'Verifying...';
  
  setTimeout(() => {
    window.location.href = 'reset-password.html';
  }, 800);
}

function resendCode() {
  alert('A new verification code has been sent to admin@tokenpixelbay.com');
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach(b => b.value = '');
  boxes[0].focus();
}
