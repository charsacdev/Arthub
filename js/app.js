// ===== HELPERS =====
function polAmt(n) { return `<span class="pol-icon">${typeof n === 'number' ? n.toFixed(2) : n}</span>`; }

function initTheme() {
  if (localStorage.getItem('metaVault_theme') === 'light') document.body.classList.add('light');
}
function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('metaVault_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3000);
}

function ethToUSD(eth) { return (eth * 3420).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }

function nftCardHTML(item, artist) {
  const isSold = item.sold;
  return `
    <div class="nft-card" onclick="window.location='artist.html?id=${artist.id}'">
      <div class="nft-image">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <span class="nft-badge ${isSold ? 'badge-sold' : 'badge-live'}">${isSold ? 'Sold' : 'Live'}</span>
        <div class="nft-like" onclick="event.stopPropagation();likeNFT(this,${item.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span id="likes-${item.id}">${item.likes}</span>
        </div>
      </div>
      <div class="nft-info">
        <div class="nft-title">${item.name}</div>
        <div class="nft-artist">by <a href="artist.html?id=${artist.id}" onclick="event.stopPropagation()">${artist.artist}</a></div>
        <div class="nft-footer">
          <div class="nft-price">${polAmt(item.price)}</div>
          <button class="btn-buy" ${isSold ? 'disabled' : ''} onclick="event.stopPropagation();buyNFT('${item.name}',${item.price})">
            ${isSold ? 'Sold Out' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>`;
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

// ===== BUY =====
function buyNFT(name, price) {
  toast(`Purchasing "${name}" for ${polAmt(price)}...`);
  setTimeout(() => toast(`"${name}" purchased successfully! 🎉`), 1500);
}

// ===== RENDER NFT GRID =====
let currentFilter = 'all';
function renderGrid(filter = 'all') {
  currentFilter = filter;
  const grid = document.getElementById('nftGrid');
  if (!grid) return;
  let html = '';
  COLLECTIONS.forEach(artist => {
    artist.items.forEach(item => {
      if (filter === 'all' || item.category === filter) {
        html += nftCardHTML(item, artist);
      }
    });
  });
  grid.innerHTML = html || '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">No items found in this category.</p>';
}

// ===== TRENDING =====
function renderTrending() {
  const list = document.getElementById('trendingList');
  if (!list) return;
  const all = [];
  COLLECTIONS.forEach(a => a.items.forEach(i => all.push({ ...i, artistName: a.artist, artistId: a.id })));
  all.sort((a, b) => b.likes - a.likes);
  const top = all.slice(0, 6);
  list.innerHTML = top.map((item, i) => `
    <div class="trending-item" onclick="window.location='artist.html?id=${item.artistId}'" style="cursor:pointer;">
      <div class="trending-rank">#${i + 1}</div>
      <div class="trending-img"><img src="${item.image}" alt="${item.name}" loading="lazy" /></div>
      <div class="trending-info">
        <div class="trending-name">${item.name}</div>
        <div class="trending-meta">by <a href="artist.html?id=${item.artistId}" onclick="event.stopPropagation()" style="color:var(--accent-2);">${item.artistName}</a> · ${item.category}</div>
      </div>
      <div style="text-align:right;">
        <div class="trending-price">${polAmt(item.price)}</div>
        <div class="trending-change change-up">♥ ${item.likes}</div>
      </div>
    </div>`).join('');
}

// ===== TOP ARTISTS =====
function renderArtists() {
  const grid = document.getElementById('artistsGrid');
  if (!grid) return;
  const sorted = [...COLLECTIONS].sort((a, b) => b.totalEarnings - a.totalEarnings);
  grid.innerHTML = sorted.map((a, i) => `
    <div class="artist-card" onclick="window.location='artist.html?id=${a.id}'">
      <div class="artist-rank">${i + 1}</div>
      <div class="artist-avatar"><img src="${a.avatar}" alt="${a.artist}" /></div>
      <div class="artist-name"><a href="artist.html?id=${a.id}" onclick="event.stopPropagation()">${a.artist}</a></div>
      <div class="artist-volume">Volume: ${polAmt(a.totalEarnings)}</div>
    </div>`).join('');
}

// ===== FILTER BAR =====
function initFilterBar() {
  document.querySelectorAll('#filterBar .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filterBar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(btn.dataset.filter);
    });
  });
}

// ===== HAMBURGER =====
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (btn && links) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
  }
}

// ===== AUTH NAV SWAP =====
function initAuthNav() {
  try {
    const s = JSON.parse(localStorage.getItem('metaVault_session') || 'null');
    if (s && s.loggedIn) {
      const loginBtn    = document.getElementById('nav-login-btn');
      const registerBtn = document.getElementById('nav-register-btn');
      if (loginBtn) {
        loginBtn.textContent = s.name || 'Dashboard';
        loginBtn.href = s.role === 'admin' ? 'admin/index.html' : 'dashboard/index.html';
        loginBtn.className = 'btn btn-ghost btn-sm';
      }
      if (registerBtn) {
        registerBtn.textContent = 'Sign Out';
        registerBtn.href = '#';
        registerBtn.onclick = function(e) {
          e.preventDefault();
          localStorage.removeItem('metaVault_session');
          window.location.reload();
        };
      }
    }
  } catch(e) {}
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthNav();
  renderGrid();
  renderTrending();
  renderArtists();
  initFilterBar();
  initHamburger();
});
