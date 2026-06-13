/* ============================================================
   TokenPixelBay Admin — Reset Password JS
   ============================================================ */
function $(id) { return document.getElementById(id); }

function togglePw() {
  const inp  = $('password');
  const eye  = $('pw-eye');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  eye.innerHTML = show
    ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

function showError(msg) {
  const el = $('reset-error');
  if (el) {
    $('reset-error-msg').textContent = msg;
    el.classList.add('show');
  }
}

function clearError() {
  const el = $('reset-error');
  if (el) el.classList.remove('show');
  const pwMsg = $('pw-msg');
  if (pwMsg) pwMsg.textContent = '';
  const confirmMsg = $('confirm-msg');
  if (confirmMsg) confirmMsg.textContent = '';
  
  $('password').classList.remove('error');
  $('confirm-password').classList.remove('error');
}

document.getElementById('reset-form').addEventListener('submit', function (e) {
  e.preventDefault();
  clearError();

  const pw = $('password').value;
  const confirm = $('confirm-password').value;

  let valid = true;
  if (!pw) {
    $('password').classList.add('error');
    $('pw-msg').textContent = 'New password is required';
    $('pw-msg').className = 'fi-msg error-msg';
    valid = false;
  } else if (pw.length < 6) {
    $('password').classList.add('error');
    $('pw-msg').textContent = 'Password must be at least 6 characters';
    $('pw-msg').className = 'fi-msg error-msg';
    valid = false;
  }

  if (!confirm) {
    $('confirm-password').classList.add('error');
    $('confirm-msg').textContent = 'Please confirm your password';
    $('confirm-msg').className = 'fi-msg error-msg';
    valid = false;
  } else if (pw !== confirm) {
    $('confirm-password').classList.add('error');
    $('confirm-msg').textContent = 'Passwords do not match';
    $('confirm-msg').className = 'fi-msg error-msg';
    valid = false;
  }

  if (!valid) return;

  $('submit-btn').disabled = true;
  $('btn-spin').style.display = 'block';
  $('btn-text').style.display = 'none';

  setTimeout(() => {
    // Save new password in localStorage
    localStorage.setItem('tokenPixelBay_admin_password', pw);
    alert('Password updated successfully! Redirecting to login page...');
    window.location.href = 'login.html';
  }, 1000);
});
