/* ============================================================
   MetaVault Admin Panel — Complete JS (single file)
   ============================================================ */

/* ── Helpers ── */
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function setHtml(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = v; }
function polAmt(n) { return `<span class="pol-icon">${typeof n === 'number' ? n.toFixed(2) : n}</span>`; }

/* ── Theme ── */
function initTheme() {
  if (localStorage.getItem('metaVault_theme') === 'light') document.body.classList.add('light');
}
function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('metaVault_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

/* ============================================================
   STATE
   ============================================================ */
const adminState = {
  creators: [],
  nfts: [],
  sortCol: null,
  sortDir: 'asc',
  userFilter: 'all',
  nftFilter: 'all',
  userSearch: '',
  nftSearch: '',
  userPage: 1,
  nftPage: 1,
  pageSize: 10,
  editingCreator: null,
  editingNft: null,
};

/* ============================================================
   DATA BOOTSTRAP — merges COLLECTIONS with localStorage edits
   ============================================================ */
function loadAdminState() {
  const raw = localStorage.getItem('metaVault_admin');
  const overrides = raw ? JSON.parse(raw) : {};
  const ovCreators = overrides.creators || [];
  const newCreators = overrides.newCreators || [];

  adminState.creators = COLLECTIONS.map(c => {
    const ov = ovCreators.find(o => o.id === c.id) || {};
    return {
      ...c,
      ...ov,
      verified: ov.verified !== undefined ? ov.verified : true,
      status: ov.status || 'active',
      items: c.items.map(it => ({ ...it })),
    };
  });

  newCreators.forEach(nc => {
    if (!adminState.creators.find(c => c.id === nc.id)) {
      adminState.creators.push({ ...nc, items: nc.items || [] });
    }
  });

  rebuildNFTs();
}

function rebuildNFTs() {
  adminState.nfts = [];
  adminState.creators.forEach(c => {
    (c.items || []).forEach(item => {
      adminState.nfts.push({
        ...item,
        artistId: c.id,
        artistName: c.artist,
        artistAvatar: c.avatar,
      });
    });
  });
}

function persistState() {
  const payload = {
    creators: adminState.creators.map(c => ({
      id: c.id, artist: c.artist, bio: c.bio, avatar: c.avatar,
      wallet: c.wallet, twitter: c.twitter, website: c.website,
      totalEarnings: c.totalEarnings, followers: c.followers,
      verified: c.verified, status: c.status,
    })),
    newCreators: adminState.creators
      .filter(c => c.id >= 9000)
      .map(c => ({ ...c })),
  };
  localStorage.setItem('metaVault_admin', JSON.stringify(payload));
}

/* ============================================================
   AUTH
   ============================================================ */
function signOut() {
  localStorage.removeItem('metaVault_session');
  window.location.href = 'login.html';
}

/* ============================================================
   HELPERS
   ============================================================ */
function $id(id) { return document.getElementById(id); }
function setVal(id, v) { const el = $id(id); if (el) el.value = v; }
function setVal(id, v) { const el = $id(id); if (el) el.value = v; }
function getVal(id) { const el = $id(id); return el ? el.value.trim() : ''; }
function getChecked(id) { const el = $id(id); return el ? el.checked : false; }

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg, type = 'ok') {
  const wrap = $id('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 3200);
}

/* ============================================================
   MODAL
   ============================================================ */
function openModal(id)  { const el = $id(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = $id(id); if (el) el.classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
  if (e.target.classList.contains('confirm-overlay')) e.target.classList.remove('open');
});

/* ============================================================
   CUSTOM CONFIRM DIALOG
   ============================================================ */
let _confirmResolve = null;

function showConfirm(title, msg, icon = '⚠️') {
  return new Promise(resolve => {
    _confirmResolve = resolve;
    setText('confirm-title', title);
    setText('confirm-sub', msg);
    setText('confirm-icon', icon);
    openModal('confirmDialog');
  });
}

function confirmYes() {
  closeModal('confirmDialog');
  if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
}
function confirmNo() {
  closeModal('confirmDialog');
  if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function initSidebar() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sb-link[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  setText('sb-creator-count', adminState.creators.length);
  setText('sb-nft-count', adminState.nfts.length);

  const hbg = $id('hamburger');
  const sb  = document.querySelector('.admin-sidebar');
  if (hbg && sb) hbg.addEventListener('click', () => sb.classList.toggle('open'));
}

/* ============================================================
   SORT ICON
   ============================================================ */
function sortIcon(col) {
  if (adminState.sortCol !== col) return '<span class="sort-icon">↕</span>';
  return `<span class="sort-icon">${adminState.sortDir === 'asc' ? '↑' : '↓'}</span>`;
}

function bindSortHeaders(tbl, applyFn) {
  tbl.querySelectorAll('th[data-sort]').forEach(th => {
    if (th.dataset.sort === adminState.sortCol) th.classList.add('sorted');
    th.addEventListener('click', () => {
      if (adminState.sortCol === th.dataset.sort) {
        adminState.sortDir = adminState.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        adminState.sortCol = th.dataset.sort;
        adminState.sortDir = 'asc';
      }
      applyFn();
    });
  });
}

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination(type, page, pages, total, start, count) {
  const info = $id(`${type}-info`);
  const pg   = $id(`${type}-pages`);
  if (info) info.textContent = total === 0
    ? 'No entries found'
    : `Showing ${start + 1}–${start + count} of ${total}`;
  if (!pg) return;

  let html = `<button class="pg-btn" onclick="goPage('${type}',${page - 1})" ${page <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= pages; i++) {
    const near = Math.abs(i - page) <= 1 || i === 1 || i === pages;
    if (!near) { if (i === 2 || i === pages - 1) html += `<button class="pg-btn" disabled>…</button>`; continue; }
    html += `<button class="pg-btn ${i === page ? 'active' : ''}" onclick="goPage('${type}',${i})">${i}</button>`;
  }
  html += `<button class="pg-btn" onclick="goPage('${type}',${page + 1})" ${page >= pages ? 'disabled' : ''}>›</button>`;
  pg.innerHTML = html;
}

function goPage(type, p) {
  if (type === 'users') { adminState.userPage = p; applyUserFilters(); }
  if (type === 'nfts')  { adminState.nftPage  = p; applyNFTFilters(); }
}

/* ============================================================
   OVERVIEW
   ============================================================ */
function renderOverview() {
  const totalCreators  = adminState.creators.length;
  const totalNFTs      = adminState.nfts.length;
  const totalVolume    = adminState.creators.reduce((s, c) => s + (c.totalEarnings || 0), 0);
  const totalSold      = adminState.nfts.filter(n => n.sold).length;
  const totalLikes     = adminState.nfts.reduce((s, n) => s + (n.likes || 0), 0);
  const verified       = adminState.creators.filter(c => c.verified).length;

  setText('kpi-creators', totalCreators);
  setText('kpi-nfts',     totalNFTs);
  setHtml('kpi-volume',   polAmt(totalVolume));
  setText('kpi-sold',     totalSold);

  renderTopCreators();
  renderRecentNFTs();
  renderActivityFeed();
  renderPlatformBreakdown(totalSold, totalNFTs, verified, totalCreators, totalLikes);
}

function renderPlatformBreakdown(sold, total, verified, creators, likes) {
  const soldPct     = total    ? Math.round(sold / total * 100)      : 0;
  const listedPct   = total    ? Math.round((total - sold) / total * 100) : 0;
  const verifiedPct = creators ? Math.round(verified / creators * 100) : 0;

  setText('ov-sold-pct',    `${soldPct}%`);
  setText('ov-listed-pct',  `${listedPct}%`);
  setText('ov-verified-pct',`${verifiedPct}%`);
  setText('ov-likes-total', likes.toLocaleString());

  // Animate progress bars
  requestAnimationFrame(() => {
    const barSold     = $id('bar-sold');
    const barListed   = $id('bar-listed');
    const barVerified = $id('bar-verified');
    if (barSold)     barSold.style.width     = `${soldPct}%`;
    if (barListed)   barListed.style.width   = `${listedPct}%`;
    if (barVerified) barVerified.style.width = `${verifiedPct}%`;
  });
}

function renderTopCreators() {
  const el = $id('top-creators');
  if (!el) return;
  const sorted = [...adminState.creators]
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 5);

  el.innerHTML = sorted.map((c, i) => `
    <div class="top-row">
      <div class="top-rank">#${i + 1}</div>
      ${c.avatar
        ? `<img class="tbl-avatar" src="${c.avatar}" alt="${c.artist}" style="width:36px;height:36px;"/>`
        : `<div class="tbl-avatar-fb" style="width:36px;height:36px;">${c.artist[0]}</div>`}
      <div style="flex:1;">
        <div style="font-size:.81rem;font-weight:600;color:var(--text);">${c.artist}
          ${c.verified ? '<span class="badge badge-verified" style="margin-left:5px;font-size:.6rem;">✓</span>' : ''}
        </div>
        <div style="font-size:.7rem;color:var(--text-3);">${(c.items || []).length} items · ${(c.followers || 0).toLocaleString()} followers</div>
      </div>
      <div style="font-size:.85rem;font-weight:700;color:var(--accent);">${polAmt(c.totalEarnings || 0)}</div>
    </div>
  `).join('');
}

function renderRecentNFTs() {
  const el = $id('recent-nfts');
  if (!el) return;
  const recent = [...adminState.nfts].slice(-5).reverse();
  if (!recent.length) { el.innerHTML = '<div class="empty-state"><div class="empty-text">No NFTs yet</div></div>'; return; }
  el.innerHTML = recent.map(n => `
    <div class="top-row">
      <img src="${n.image}" alt="${n.name}" style="width:40px;height:40px;border-radius:9px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" onerror="this.src='https://picsum.photos/seed/${n.id}/100'"/>
      <div style="flex:1;">
        <div style="font-size:.81rem;font-weight:600;color:var(--text);">${n.name}</div>
        <div style="font-size:.7rem;color:var(--text-3);">by ${n.artistName} · ${n.category}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:.81rem;font-weight:700;color:var(--text);">${polAmt(n.price)}</div>
        <span class="badge ${n.sold ? 'badge-sold' : 'badge-live'}" style="margin-top:3px;display:inline-flex;">${n.sold ? 'Sold' : 'Live'}</span>
      </div>
    </div>
  `).join('');
}

function renderActivityFeed() {
  const el = $id('activity-feed');
  if (!el) return;
  const feed = [
    { icon: '🎨', bg: 'rgba(108,63,255,.12)', col: 'var(--accent-4)', text: '<strong>0xNova</strong> minted "Neon Genesis #7"', time: '2 min ago' },
    { icon: '💰', bg: 'rgba(0,229,160,.1)',   col: 'var(--success)',   text: '<strong>MetaVera</strong> sold "World Zero" for ${polAmt(12.0)}', time: '11 min ago' },
    { icon: '✅', bg: 'rgba(245,158,11,.1)',  col: 'var(--accent)',    text: 'Admin <strong>verified</strong> creator PixelSaint', time: '1 hr ago' },
    { icon: '👤', bg: 'rgba(0,212,255,.1)',   col: 'var(--accent-2)', text: 'New creator <strong>CryptoMuse</strong> joined', time: '2 hr ago' },
    { icon: '🚫', bg: 'rgba(255,69,96,.08)', col: 'var(--danger)',    text: 'Admin removed listing "Void Fragment"', time: '3 hr ago' },
    { icon: '📈', bg: 'rgba(0,229,160,.1)',   col: 'var(--success)',   text: 'Platform volume crossed <strong><strong>${polAmt(500)}</strong></strong>', time: 'Yesterday' },
  ];
  el.innerHTML = feed.map(f => `
    <div class="a-item">
      <div class="a-icon" style="background:${f.bg};color:${f.col};">${f.icon}</div>
      <div class="a-body">
        <div class="a-text">${f.text}</div>
        <div class="a-time">${f.time}</div>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   USERS PAGE
   ============================================================ */
function renderUsers() { applyUserFilters(); }

function applyUserFilters() {
  let data = [...adminState.creators];

  if (adminState.userFilter === 'verified')   data = data.filter(c => c.verified);
  if (adminState.userFilter === 'unverified') data = data.filter(c => !c.verified);
  if (adminState.userFilter === 'suspended')  data = data.filter(c => c.status === 'suspended');
  if (adminState.userFilter === 'active')     data = data.filter(c => c.status !== 'suspended');

  const q = adminState.userSearch.toLowerCase();
  if (q) data = data.filter(c =>
    c.artist.toLowerCase().includes(q) ||
    (c.wallet || '').toLowerCase().includes(q) ||
    (c.bio || '').toLowerCase().includes(q)
  );

  if (adminState.sortCol) {
    const col = adminState.sortCol;
    data.sort((a, b) => {
      let av = col === 'items' ? (a.items || []).length : (a[col] ?? '');
      let bv = col === 'items' ? (b.items || []).length : (b[col] ?? '');
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return adminState.sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
  }

  const total = data.length;
  const pages = Math.ceil(total / adminState.pageSize) || 1;
  adminState.userPage = Math.max(1, Math.min(adminState.userPage, pages));
  const start = (adminState.userPage - 1) * adminState.pageSize;
  const paged = data.slice(start, start + adminState.pageSize);

  buildUsersTable(paged);
  renderPagination('users', adminState.userPage, pages, total, start, paged.length);
}

function buildUsersTable(data) {
  const tbl = $id('users-tbl');
  if (!tbl) return;

  if (!data.length) {
    tbl.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-3);">No creators match your filters.</td></tr>`;
    return;
  }

  tbl.innerHTML = `
    <thead>
      <tr>
        <th data-sort="artist">Creator ${sortIcon('artist')}</th>
        <th data-sort="wallet">Wallet ${sortIcon('wallet')}</th>
        <th data-sort="items">Items ${sortIcon('items')}</th>
        <th data-sort="totalEarnings">Earnings ${sortIcon('totalEarnings')}</th>
        <th data-sort="followers">Followers ${sortIcon('followers')}</th>
        <th>Verified</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(c => `
        <tr>
          <td>
            <div class="tbl-user">
              ${c.avatar
                ? `<img class="tbl-avatar" src="${c.avatar}" alt="${c.artist}"/>`
                : `<div class="tbl-avatar-fb">${c.artist[0]}</div>`}
              <div>
                <div class="td-name">${c.artist}</div>
                <div style="font-size:.69rem;color:var(--text-3);">${(c.bio || '').slice(0, 38)}${c.bio && c.bio.length > 38 ? '…' : ''}</div>
              </div>
            </div>
          </td>
          <td><span class="td-mono">${c.wallet ? c.wallet.slice(0, 10) + '…' + c.wallet.slice(-4) : '—'}</span></td>
          <td style="color:var(--text);font-weight:600;">${(c.items || []).length}</td>
          <td style="color:var(--accent);font-weight:700;">${polAmt(c.totalEarnings || 0)}</td>
          <td>${(c.followers || 0).toLocaleString()}</td>
          <td>
            <button onclick="toggleVerify(${c.id})"
              class="badge ${c.verified ? 'badge-verified' : 'badge-unverified'}"
              style="cursor:pointer;border:none;font-family:inherit;" title="Click to toggle">
              ${c.verified ? '✓ Verified' : '○ Unverified'}
            </button>
          </td>
          <td>
            <span class="badge ${c.status === 'suspended' ? 'badge-suspended' : 'badge-active'}">
              ${c.status === 'suspended' ? 'Suspended' : 'Active'}
            </span>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit Creator" onclick="openEditCreator(${c.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon"
                title="${c.status === 'suspended' ? 'Reactivate' : 'Suspend'}"
                onclick="toggleSuspend(${c.id})"
                style="color:${c.status === 'suspended' ? 'var(--success)' : 'var(--warning)'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Delete Creator" onclick="deleteCreator(${c.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  bindSortHeaders(tbl, applyUserFilters);
}

/* ---- Creator CRUD ---- */
function toggleVerify(id) {
  const c = adminState.creators.find(x => x.id === id);
  if (!c) return;
  c.verified = !c.verified;
  persistState();
  applyUserFilters();
  toast(`${c.artist} ${c.verified ? 'verified ✓' : 'unverified'}`, c.verified ? 'ok' : 'warn');
}

function toggleSuspend(id) {
  const c = adminState.creators.find(x => x.id === id);
  if (!c) return;
  c.status = c.status === 'suspended' ? 'active' : 'suspended';
  persistState();
  applyUserFilters();
  toast(`${c.artist} ${c.status === 'suspended' ? 'suspended' : 'reactivated'}`, c.status === 'suspended' ? 'err' : 'ok');
}

async function deleteCreator(id) {
  const c = adminState.creators.find(x => x.id === id);
  if (!c) return;
  const ok = await showConfirm('Delete Creator', `Permanently delete "${c.artist}" and all their NFTs? This cannot be undone.`, '🗑️');
  if (!ok) return;
  adminState.creators = adminState.creators.filter(x => x.id !== id);
  rebuildNFTs();
  persistState();
  applyUserFilters();
  initSidebar();
  toast(`"${c.artist}" deleted`, 'err');
}

function openAddCreator() {
  adminState.editingCreator = null;
  ['ac-name','ac-bio','ac-avatar','ac-wallet','ac-twitter','ac-website'].forEach(id => setVal(id, ''));
  setVal('ac-earnings', '0');
  setVal('ac-followers', '0');
  const el = $id('ac-verified'); if (el) el.checked = false;
  const prev = $id('ac-avatar-preview'); if (prev) prev.src = '';
  openModal('addCreatorModal');
}

function saveNewCreator() {
  const name = getVal('ac-name');
  if (!name) { toast('Display name is required', 'err'); return; }
  const wallet = getVal('ac-wallet') || `0x${Math.random().toString(16).slice(2, 12)}...${Math.random().toString(16).slice(2, 6)}`;
  const newId = 9000 + (adminState.creators.filter(c => c.id >= 9000).length + 1);
  const nc = {
    id: newId,
    artist: name,
    bio: getVal('ac-bio'),
    avatar: getVal('ac-avatar') || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    wallet,
    twitter: getVal('ac-twitter'),
    website: getVal('ac-website'),
    totalEarnings: parseFloat(getVal('ac-earnings')) || 0,
    followers: parseInt(getVal('ac-followers')) || 0,
    verified: getChecked('ac-verified'),
    status: 'active',
    items: [],
  };
  adminState.creators.push(nc);
  rebuildNFTs();
  persistState();
  closeModal('addCreatorModal');
  applyUserFilters();
  initSidebar();
  toast(`Creator "${name}" added successfully`);
}

function openEditCreator(id) {
  const c = adminState.creators.find(x => x.id === id);
  if (!c) return;
  adminState.editingCreator = id;
  setVal('ec-name', c.artist);
  setVal('ec-bio', c.bio || '');
  setVal('ec-avatar', c.avatar || '');
  setVal('ec-wallet', c.wallet || '');
  setVal('ec-twitter', c.twitter || '');
  setVal('ec-website', c.website || '');
  setVal('ec-earnings', c.totalEarnings || 0);
  setVal('ec-followers', c.followers || 0);
  const vEl = $id('ec-verified'); if (vEl) vEl.checked = !!c.verified;
  const prev = $id('ec-avatar-preview'); if (prev) prev.src = c.avatar || '';
  openModal('editCreatorModal');
}

function saveEditCreator() {
  const c = adminState.creators.find(x => x.id === adminState.editingCreator);
  if (!c) return;
  if (!getVal('ec-name')) { toast('Name cannot be empty', 'err'); return; }
  c.artist         = getVal('ec-name');
  c.bio            = getVal('ec-bio');
  c.avatar         = getVal('ec-avatar') || c.avatar;
  c.wallet         = getVal('ec-wallet');
  c.twitter        = getVal('ec-twitter');
  c.website        = getVal('ec-website');
  c.totalEarnings  = parseFloat(getVal('ec-earnings')) || 0;
  c.followers      = parseInt(getVal('ec-followers')) || 0;
  c.verified       = getChecked('ec-verified');
  rebuildNFTs();
  persistState();
  closeModal('editCreatorModal');
  applyUserFilters();
  toast('Creator updated successfully');
}

/* ============================================================
   NFTs PAGE
   ============================================================ */
function renderNFTs() {
  renderNFTStats();
  applyNFTFilters();
}

function renderNFTStats() {
  const bar = $id('nft-stats-bar');
  if (!bar) return;
  const total  = adminState.nfts.length;
  const sold   = adminState.nfts.filter(n => n.sold).length;
  const live   = total - sold;
  const volume = adminState.creators.reduce((s, c) => s + (c.totalEarnings || 0), 0);
  bar.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-top"><div class="kpi-icon cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16"/></svg></div></div>
      <div class="kpi-val">${total}</div><div class="kpi-lbl">Total NFTs</div>
      <div class="kpi-glow cyan"></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-top"><div class="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div></div>
      <div class="kpi-val">${live}</div><div class="kpi-lbl">Live Listings</div>
      <div class="kpi-glow green"></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-top"><div class="kpi-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div></div>
      <div class="kpi-val">${sold}</div><div class="kpi-lbl">Items Sold</div>
      <div class="kpi-glow amber"></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-top"><div class="kpi-icon pink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div></div>
      <div class="kpi-val">${polAmt(volume)}</div><div class="kpi-lbl">Total Volume</div>
      <div class="kpi-glow pink"></div>
    </div>
  `;
}

function applyNFTFilters() {
  let data = [...adminState.nfts];

  if (adminState.nftFilter === 'live') data = data.filter(n => !n.sold);
  if (adminState.nftFilter === 'sold') data = data.filter(n => n.sold);

  const q = adminState.nftSearch.toLowerCase();
  if (q) data = data.filter(n =>
    n.name.toLowerCase().includes(q) ||
    (n.artistName || '').toLowerCase().includes(q) ||
    (n.category || '').toLowerCase().includes(q)
  );

  if (adminState.sortCol) {
    const col = adminState.sortCol;
    data.sort((a, b) => {
      let av = a[col] ?? '', bv = b[col] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return adminState.sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
  }

  const total = data.length;
  const pages = Math.ceil(total / adminState.pageSize) || 1;
  adminState.nftPage = Math.max(1, Math.min(adminState.nftPage, pages));
  const start = (adminState.nftPage - 1) * adminState.pageSize;
  const paged = data.slice(start, start + adminState.pageSize);

  buildNFTsTable(paged);
  renderPagination('nfts', adminState.nftPage, pages, total, start, paged.length);
}

function buildNFTsTable(data) {
  const tbl = $id('nfts-tbl');
  if (!tbl) return;

  if (!data.length) {
    tbl.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-3);">No NFTs match your filters.</td></tr>`;
    return;
  }

  tbl.innerHTML = `
    <thead>
      <tr>
        <th data-sort="name">NFT ${sortIcon('name')}</th>
        <th data-sort="artistName">Artist ${sortIcon('artistName')}</th>
        <th data-sort="category">Category ${sortIcon('category')}</th>
        <th data-sort="price">Price ${sortIcon('price')}</th>
        <th data-sort="likes">Likes ${sortIcon('likes')}</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(n => `
        <tr>
          <td>
            <div class="tbl-nft">
              <img class="tbl-thumb" src="${n.image}" alt="${n.name}"
                onerror="this.src='https://picsum.photos/seed/${n.id}/100'"/>
              <div>
                <div class="td-name">${n.name}</div>
                <div style="font-size:.69rem;color:var(--text-3);">#${n.id}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size:.8rem;color:var(--text);font-weight:500;">${n.artistName || '—'}</div>
          </td>
          <td><span class="badge badge-cat">${n.category || '—'}</span></td>
          <td style="color:var(--accent);font-weight:700;">${polAmt(n.price)}</td>
          <td style="color:var(--text-2);">♥ ${n.likes || 0}</td>
          <td><span class="badge ${n.sold ? 'badge-sold' : 'badge-live'}">${n.sold ? 'Sold' : 'Live'}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm btn-icon" title="Edit NFT" onclick="openEditNFT(${n.id},${n.artistId})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon"
                title="Mark as ${n.sold ? 'Live' : 'Sold'}"
                onclick="toggleNFTSold(${n.id},${n.artistId})"
                style="color:${n.sold ? 'var(--accent-2)' : 'var(--success)'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Remove NFT" onclick="removeNFT(${n.id},${n.artistId})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  bindSortHeaders(tbl, applyNFTFilters);
}

/* ---- NFT CRUD ---- */
function toggleNFTSold(nftId, artistId) {
  const creator = adminState.creators.find(c => c.id === artistId);
  if (!creator) return;
  const item = creator.items.find(i => i.id === nftId);
  if (!item) return;
  item.sold = !item.sold;
  rebuildNFTs();
  persistState();
  applyNFTFilters();
  toast(`Marked as ${item.sold ? 'sold' : 'live'}`);
}

async function removeNFT(nftId, artistId) {
  const creator = adminState.creators.find(c => c.id === artistId);
  if (!creator) return;
  const item = creator.items.find(i => i.id === nftId);
  if (!item) return;
  const ok = await showConfirm('Remove NFT', `Remove "${item.name}" from the platform?`, '🗑️');
  if (!ok) return;
  creator.items = creator.items.filter(i => i.id !== nftId);
  rebuildNFTs();
  persistState();
  applyNFTFilters();
  initSidebar();
  toast(`"${item.name}" removed`, 'warn');
}

function openEditNFT(nftId, artistId) {
  const creator = adminState.creators.find(c => c.id === artistId);
  if (!creator) return;
  const item = creator.items.find(i => i.id === nftId);
  if (!item) return;
  adminState.editingNft = { nftId, artistId };

  setVal('en-name', item.name);
  setVal('en-price', item.price);
  setVal('en-likes', item.likes || 0);
  setVal('en-image', item.image || '');
  const catEl = $id('en-category'); if (catEl) catEl.value = item.category || 'Art';
  const soldEl = $id('en-sold'); if (soldEl) soldEl.checked = !!item.sold;
  const prev = $id('en-img-preview'); if (prev) prev.src = item.image || '';

  // Populate artist selector
  const artistEl = $id('en-artist');
  if (artistEl) {
    artistEl.innerHTML = adminState.creators.map(c => `<option value="${c.id}" ${c.id === artistId ? 'selected' : ''}>${c.artist}</option>`).join('');
  }
  openModal('editNFTModal');
}

function saveEditNFT() {
  const { nftId, artistId } = adminState.editingNft || {};
  const creator = adminState.creators.find(c => c.id === artistId);
  if (!creator) return;
  const item = creator.items.find(i => i.id === nftId);
  if (!item) return;
  if (!getVal('en-name')) { toast('Name cannot be empty', 'err'); return; }

  item.name     = getVal('en-name');
  item.price    = parseFloat(getVal('en-price')) || item.price;
  item.likes    = parseInt(getVal('en-likes')) || 0;
  item.image    = getVal('en-image') || item.image;
  item.category = ($id('en-category') || {}).value || item.category;
  item.sold     = getChecked('en-sold');

  // Move to different artist?
  const newArtistId = parseInt(($id('en-artist') || {}).value);
  if (newArtistId && newArtistId !== artistId) {
    const newCreator = adminState.creators.find(c => c.id === newArtistId);
    if (newCreator) {
      creator.items = creator.items.filter(i => i.id !== nftId);
      newCreator.items.push({ ...item });
    }
  }

  rebuildNFTs();
  persistState();
  closeModal('editNFTModal');
  applyNFTFilters();
  toast('NFT updated successfully');
}

/* ============================================================
   SETTINGS PAGE
   ============================================================ */
function renderSettings() {
  const s = JSON.parse(localStorage.getItem('metaVault_settings') || '{}');
  setVal('set-admin-name',  s.adminName    || 'Admin');
  setVal('set-admin-email', s.adminEmail   || 'admin@metavault.io');
  setVal('set-fee',         s.platformFee  ?? '2.5');
}

function saveSettings() {
  const s = JSON.parse(localStorage.getItem('metaVault_settings') || '{}');
  s.adminName   = getVal('set-admin-name');
  s.adminEmail  = getVal('set-admin-email');
  s.platformFee = getVal('set-fee');
  localStorage.setItem('metaVault_settings', JSON.stringify(s));
  toast('Settings saved successfully');
}

function savePassword() {
  const curr = getVal('set-pass-current');
  const next  = getVal('set-pass-new');
  const conf  = getVal('set-pass-confirm');
  if (!curr || !next || !conf) { toast('All password fields are required', 'err'); return; }
  if (next !== conf)           { toast('New passwords do not match', 'err'); return; }
  if (next.length < 6)        { toast('Password must be at least 6 characters', 'err'); return; }
  toast('Password updated successfully');
  $id('set-pass-current').value = '';
  $id('set-pass-new').value     = '';
  $id('set-pass-confirm').value = '';
}

async function resetPlatformData() {
  const ok = await showConfirm('Reset All Data', 'This will wipe all admin edits and restore original platform data. Are you sure?', '⚠️');
  if (!ok) return;
  localStorage.removeItem('metaVault_admin');
  localStorage.removeItem('metaVault_settings');
  loadAdminState();
  renderSettings();
  initSidebar();
  toast('Platform data reset to defaults', 'warn');
}

/* ============================================================
   FILTER & SEARCH INIT
   ============================================================ */
function initUserFilters() {
  document.querySelectorAll('.user-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.user-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      adminState.userFilter = btn.dataset.filter;
      adminState.userPage = 1;
      applyUserFilters();
    });
  });
  const s = $id('user-search');
  if (s) s.addEventListener('input', () => { adminState.userSearch = s.value; adminState.userPage = 1; applyUserFilters(); });
}

function initNFTFilters() {
  document.querySelectorAll('.nft-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nft-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      adminState.nftFilter = btn.dataset.filter;
      adminState.nftPage = 1;
      applyNFTFilters();
    });
  });
  const s = $id('nft-search');
  if (s) s.addEventListener('input', () => { adminState.nftSearch = s.value; adminState.nftPage = 1; applyNFTFilters(); });
}

/* ============================================================
   LIVE PREVIEW HOOKS
   ============================================================ */
function bindPreview(inputId, previewId) {
  const inp = $id(inputId), prev = $id(previewId);
  if (inp && prev) inp.addEventListener('input', () => { prev.src = inp.value; });
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  /* Guard: must be logged in as admin */
  (function () {
    try {
      const s = JSON.parse(localStorage.getItem('metaVault_session') || 'null');
      if (!s || s.role !== 'admin') {
        const current = location.pathname.split('/').slice(-2).join('/');
        window.location.replace('login.html?next=' + encodeURIComponent(current));
      }
    } catch (_) {
      window.location.replace('login.html');
    }
  })();

  loadAdminState();
  initSidebar();

  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html' || page === '') renderOverview();
  if (page === 'users.html')    { renderUsers();    initUserFilters(); }
  if (page === 'nfts.html')     { renderNFTs();     initNFTFilters(); }
  if (page === 'settings.html') renderSettings();

  bindPreview('ac-avatar', 'ac-avatar-preview');
  bindPreview('ec-avatar', 'ec-avatar-preview');
  bindPreview('en-image',  'en-img-preview');
});
