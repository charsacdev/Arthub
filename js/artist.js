// ===== HELPERS =====
function polAmt(n) { return `<span class="pol-icon">${typeof n === 'number' ? n.toFixed(2) : n}</span>`; }

function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3000);
}

function ethToUSD(eth) { return (eth * 3420).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }

function getArtistIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'));
}

// ===== LIKE =====
const likedSet = new Set();
function likeNFT(el, id) {
  const span = el.querySelector('span');
  if (likedSet.has(id)) {
    likedSet.delete(id);
    span.textContent = parseInt(span.textContent) - 1;
    el.style.color = '';
  } else {
    likedSet.add(id);
    span.textContent = parseInt(span.textContent) + 1;
    el.style.color = 'var(--accent-3)';
    toast('Added to favorites!');
  }
}

function buyNFT(name, price) {
  toast(`Purchasing "${name}" for ${polAmt(price)}...`);
  setTimeout(() => toast(`"${name}" purchased! 🎉`), 1500);
}

function copyWallet() {
  const w = document.getElementById('profileWallet').textContent;
  navigator.clipboard.writeText(w).then(() => toast('Wallet address copied!')).catch(() => toast('Copy failed', 'error'));
}

let isFollowing = false;
function followArtist() {
  isFollowing = !isFollowing;
  const btn = document.querySelector('.btn-outline');
  if (isFollowing) {
    btn.textContent = '✓ Following';
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    toast('Now following this artist!');
  } else {
    btn.textContent = '+ Follow';
    btn.style.background = '';
    btn.style.color = '';
    toast('Unfollowed artist');
  }
}

// ===== NFT CARD =====
function nftCardHTML(item) {
  const isSold = item.sold;
  return `
    <div class="nft-card">
      <div class="nft-image">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <span class="nft-badge ${isSold ? 'badge-sold' : 'badge-live'}">${isSold ? 'Sold' : 'Live'}</span>
        <div class="nft-like" onclick="likeNFT(this,${item.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span>${item.likes}</span>
        </div>
      </div>
      <div class="nft-info">
        <div class="nft-title">${item.name}</div>
        <div class="nft-artist" style="color:var(--text-muted);font-size:0.75rem;">${item.category}</div>
        <div class="nft-footer">
          <div class="nft-price">${polAmt(item.price)}</div>
          <button class="btn-buy" ${isSold ? 'disabled' : ''} onclick="buyNFT('${item.name}',${item.price})">
            ${isSold ? 'Sold Out' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>`;
}

// ===== FILTER BAR =====
function renderProfileFilter(items, activeFilter = 'all') {
  const categories = ['all', ...new Set(items.map(i => i.category))];
  const bar = document.getElementById('profileFilter');
  bar.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === activeFilter ? 'active' : ''}" data-filter="${cat}">
      ${cat === 'all' ? 'All' : cat}
    </button>`).join('');
  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProfileGrid(items, btn.dataset.filter);
    });
  });
}

function renderProfileGrid(items, filter = 'all') {
  const grid = document.getElementById('profileGrid');
  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);
  grid.innerHTML = filtered.length
    ? filtered.map(nftCardHTML).join('')
    : '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">No items in this category.</p>';
}

// ===== STATS CARD =====
function renderEarningsCard(artist) {
  const active = artist.items.filter(i => !i.sold);
  const floor = active.length ? Math.min(...active.map(i => i.price)) : 0;

  const earningTotal = document.getElementById('earningTotal');
  const earningUSD = document.getElementById('earningUSD');
  const earningsActive = document.getElementById('earningsActive');
  const earningsFloor = document.getElementById('earningsFloor');

  if (earningTotal) earningTotal.innerHTML = polAmt(artist.totalEarnings);
  if (earningUSD) earningUSD.textContent = `≈ ${ethToUSD(artist.totalEarnings)}`;
  if (earningsActive) earningsActive.textContent = active.length;
  if (earningsFloor) earningsFloor.innerHTML = floor > 0 ? polAmt(floor) : 'N/A';
}

// ===== HAMBURGER & OFF-CANVAS =====
function toggleOffcanvas() {
  const menu = document.getElementById('offcanvasMenu');
  const overlay = document.getElementById('offcanvasOverlay');
  if (menu && overlay) {
    menu.classList.toggle('open');
    overlay.classList.toggle('open');
  }
}

function initHamburger() {
  const btn = document.getElementById('hamburger');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleOffcanvas();
    });
  }
}

// ===== THEME TOGGLE =====
function initTheme() {
  if (localStorage.getItem('tokenPixelBay_theme') === 'light') document.body.classList.add('light');
}
function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('tokenPixelBay_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// ===== AUTH NAV SWAP =====
function initAuthNav() {
  try {
    const s = JSON.parse(localStorage.getItem('tokenPixelBay_session') || 'null');
    const loginBtn    = document.getElementById('nav-login-btn');
    const registerBtn = document.getElementById('nav-register-btn');
    const mLoginBtn    = document.getElementById('mobile-login-btn');
    const mRegisterBtn = document.getElementById('mobile-register-btn');

    if (s && s.loggedIn && s.role !== 'admin') {
      const targetUrl = 'dashboard/index.html';
      
      if (loginBtn) {
        loginBtn.textContent = s.name || 'Dashboard';
        loginBtn.href = targetUrl;
        loginBtn.className = 'btn btn-ghost btn-sm';
      }
      if (mLoginBtn) {
        mLoginBtn.textContent = s.name || 'Dashboard';
        mLoginBtn.href = targetUrl;
      }
      
      const signOutFn = function(e) {
        e.preventDefault();
        localStorage.removeItem('tokenPixelBay_session');
        window.location.reload();
      };
      
      if (registerBtn) {
        registerBtn.textContent = 'Sign Out';
        registerBtn.href = '#';
        registerBtn.onclick = signOutFn;
      }
      if (mRegisterBtn) {
        mRegisterBtn.textContent = 'Sign Out';
        mRegisterBtn.href = '#';
        mRegisterBtn.onclick = signOutFn;
      }
    } else {
      if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.href = 'auth/login.html';
        loginBtn.className = 'btn btn-ghost btn-sm';
      }
      if (mLoginBtn) {
        mLoginBtn.textContent = 'Login';
        mLoginBtn.href = 'auth/login.html';
      }
      if (registerBtn) {
        registerBtn.textContent = 'Register';
        registerBtn.href = 'auth/register.html';
        registerBtn.onclick = null;
      }
      if (mRegisterBtn) {
        mRegisterBtn.textContent = 'Register';
        mRegisterBtn.href = 'auth/register.html';
        mRegisterBtn.onclick = null;
      }
    }
  } catch(e) {}
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthNav();
  
  const id = getArtistIdFromURL();
  const artist = COLLECTIONS.find(a => a.id === id);

  if (!artist) {
    document.getElementById('profileName').textContent = 'Artist not found';
    return;
  }

  document.title = `${artist.artist} — TokenPixelBay`;

  // Populate profile hero
  document.getElementById('profileAvatar').src = artist.avatar;
  document.getElementById('profileName').textContent = artist.artist;
  const walletEl = document.getElementById('profileWallet');
  if (walletEl) walletEl.textContent = artist.wallet;
  document.getElementById('profileBio').textContent = artist.bio;
  
  const profileEarnings = document.getElementById('profileEarnings');
  if (profileEarnings) profileEarnings.innerHTML = polAmt(artist.totalEarnings);
  
  document.getElementById('profileItems').textContent = artist.items.length;
  const profileFollowers = document.getElementById('profileFollowers');
  if (profileFollowers) profileFollowers.textContent = artist.followers.toLocaleString();

  // Stats card
  renderEarningsCard(artist);

  // NFT grid
  renderProfileFilter(artist.items);
  renderProfileGrid(artist.items);

  initHamburger();
});
