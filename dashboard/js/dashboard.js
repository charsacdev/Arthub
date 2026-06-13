/* ============================================================
   TokenPixelBay Dashboard — Complete JS (with Search, Pagination & Sync)
   ============================================================ */

/* ── Helpers ── */
function $(id)    { return document.getElementById(id); }
function setText(id, v) { const el = $(id); if (el) el.textContent = v; }
function setHtml(id, v) { const el = $(id); if (el) el.innerHTML = v; }
function polAmt(n) { return `<span class="pol-icon">${typeof n === 'number' ? n.toFixed(2) : n}</span>`; }
function ethToUSD(e) {
  return (e * 3420).toLocaleString('en-US', { style:'currency', currency:'USD' });
}

/* ── Theme ── */
function initTheme() {
  if (localStorage.getItem('tokenPixelBay_theme') === 'light') document.body.classList.add('light');
}
function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('tokenPixelBay_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

function toast(msg, type = 'ok') {
  const wrap = $('toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-icon">${type==='ok'?'✓':'✕'}</div><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
}

/* ── Data Sync (Local Storage Override & Impersonation) ── */
function getArtist() {
  try {
    const s = JSON.parse(localStorage.getItem('tokenPixelBay_session') || 'null');
    if (s && s.loggedIn && s.name) {
      const found = COLLECTIONS.find(a => a.artist === s.name);
      if (found) return found;
    }
  } catch (e) {}
  return COLLECTIONS.find(a => a.id === CURRENT_ARTIST_ID);
}

function loadDashboardData() {
  const raw = localStorage.getItem('tokenPixelBay_admin');
  if (raw) {
    try {
      const overrides = JSON.parse(raw);
      const ovCreators = overrides.creators || [];
      const newCreators = overrides.newCreators || [];
      
      COLLECTIONS.forEach(c => {
        const ov = ovCreators.find(o => o.id === c.id);
        if (ov) {
          c.totalEarnings = ov.totalEarnings !== undefined ? ov.totalEarnings : c.totalEarnings;
          c.followers = ov.followers !== undefined ? ov.followers : c.followers;
          if (ov.items) c.items = ov.items;
        }
      });
      
      newCreators.forEach(nc => {
        if (!COLLECTIONS.find(c => c.id === nc.id)) {
          COLLECTIONS.push(nc);
        }
      });
    } catch (e) {
      console.error("Failed to parse tokenPixelBay_admin", e);
    }
  }
}

function persistDashboardData() {
  const raw = localStorage.getItem('tokenPixelBay_admin');
  let overrides = raw ? JSON.parse(raw) : {};
  if (!overrides.creators) overrides.creators = [];
  if (!overrides.newCreators) overrides.newCreators = [];
  
  COLLECTIONS.forEach(c => {
    if (c.id >= 9000) {
      const existingIdx = overrides.newCreators.findIndex(nc => nc.id === c.id);
      if (existingIdx !== -1) {
        overrides.newCreators[existingIdx] = { ...c };
      } else {
        overrides.newCreators.push({ ...c });
      }
    } else {
      const ovIdx = overrides.creators.findIndex(oc => oc.id === c.id);
      const ovData = {
        id: c.id, artist: c.artist, bio: c.bio, avatar: c.avatar,
        wallet: c.wallet, twitter: c.twitter, website: c.website,
        totalEarnings: c.totalEarnings, followers: c.followers,
        items: c.items
      };
      if (ovIdx !== -1) {
        overrides.creators[ovIdx] = { ...overrides.creators[ovIdx], ...ovData };
      } else {
        overrides.creators.push(ovData);
      }
    }
  });
  
  localStorage.setItem('tokenPixelBay_admin', JSON.stringify(overrides));
}

/* ============================================================
   SIDEBAR & NAVIGATION
   ============================================================ */
function initSidebar() {
  const artist = getArtist();
  if (!artist) return;

  const avatar = $('sb-avatar-img');
  if (avatar) avatar.src = artist.avatar;
  setText('sb-name', artist.artist);
  setText('sb-item-count', artist.items.length);

  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sb-link[data-page]').forEach(link => {
    if (link.dataset.page === page) link.classList.add('active');
  });

  const hbg = $('hamburger');
  const sb  = document.querySelector('.db-sidebar');
  if (hbg && sb) {
    let overlay = document.querySelector('.sb-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sb-overlay';
      document.body.appendChild(overlay);
    }
    const toggleSidebar = () => {
      sb.classList.toggle('open');
      overlay.style.display = sb.classList.contains('open') ? 'block' : 'none';
    };
    hbg.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
  }
}

function openModal(id)  { const el = $(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = $(id); if (el) el.classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ============================================================
   QUICK-MINT MODAL
   ============================================================ */
function mintFromModal() {
  const name  = $('mm-name')?.value.trim();
  const cat   = $('mm-cat')?.value;
  const price = parseFloat($('mm-price')?.value);
  if (!name)           { toast('Please enter a name','err'); return; }
  if (!price || price <= 0) { toast('Please enter a valid price','err'); return; }

  createNFT(name, cat, price);
  closeModal('mintModal');
  toast(`"${name}" minted ${polAmt(price)} 🎉`);
  $('mm-name').value  = '';
  $('mm-price').value = '';

  if (typeof renderAllItems === 'function') renderAllItems();
  if (typeof renderOverview === 'function') renderOverview();
}

function createNFT(name, category, price) {
  const a = getArtist();
  if (!a) return;
  const id = Date.now();
  a.items.unshift({
    id, name, category, price,
    image: `images/art_surreal.png`,
    likes: 0, sold: false
  });
  persistDashboardData();
}

/* ============================================================
   OVERVIEW page  (index.html)
   ============================================================ */
function renderOverview() {
  const a = getArtist();
  if (!a) return;
  const sold  = a.items.filter(i => i.sold);
  const likes = a.items.reduce((s,i) => s + i.likes, 0);

  setText('ov-name',     a.artist);
  setHtml('ov-earnings', polAmt(a.totalEarnings));
  setText('ov-items',    a.items.length);
  setText('ov-sold',     sold.length);
  setText('ov-likes',    likes.toLocaleString());

  const list = $('ov-recent');
  if (list) {
    list.innerHTML = a.items.slice(0,4).map(item => `
      <div class="item-row">
        <div class="item-thumb"><img src="../${item.image}" alt="${item.name}" onerror="this.src='../images/art_surreal.png';" loading="lazy"/></div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-cat">${item.category}</div>
        </div>
        <div class="item-right">
          <div class="item-price">${polAmt(item.price)}</div>
          <div class="item-status ${item.sold?'s-sold':'s-live'}">${item.sold?'Sold':'Listed'}</div>
        </div>
      </div>`).join('');
  }
}

/* ============================================================
   PAGINATION DRAWING HELPER
   ============================================================ */
function drawPagination(containerId, currentPage, totalPages, changeFnName) {
  const container = $(containerId);
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  let html = `<button class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${changeFnName}(${currentPage - 1})">←</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pg-btn ${i === currentPage ? 'active' : ''}" onclick="${changeFnName}(${i})">${i}</button>`;
  }
  html += `<button class="pg-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${changeFnName}(${currentPage + 1})">→</button>`;
  container.innerHTML = html;
}

/* ============================================================
   ITEMS page  (items.html)
   ============================================================ */
let itemFilter = 'all';
let itemSearch = '';
let itemPage = 1;
const itemPageSize = 5;

function setItemPage(p) {
  itemPage = p;
  renderAllItems();
}

function renderAllItems() {
  const a = getArtist();
  const tbl = $('items-tbl');
  if (!tbl || !a) return;

  // Search & tab filters
  let filtered = a.items;
  if (itemFilter === 'live') filtered = filtered.filter(i => !i.sold);
  if (itemFilter === 'sold') filtered = filtered.filter(i => i.sold);
  
  if (itemSearch) {
    const q = itemSearch.toLowerCase();
    filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }

  // Calculate slice
  const total = filtered.length;
  const totalPages = Math.ceil(total / itemPageSize);
  if (itemPage > totalPages && totalPages > 0) itemPage = totalPages;
  const start = (itemPage - 1) * itemPageSize;
  const end = Math.min(start + itemPageSize, total);
  const sliced = filtered.slice(start, end);

  tbl.innerHTML = `
    <thead><tr>
      <th>Item</th><th>Status</th><th>Price</th><th>Likes</th><th>Actions</th>
    </tr></thead>
    <tbody>${sliced.length ? sliced.map(itemRow).join('') :
      `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-4);">No items found.</td></tr>`
    }</tbody>`;

  // Info label & controls
  const info = $('items-info');
  if (info) {
    info.textContent = total > 0 ? `Showing ${start + 1} to ${end} of ${total} entries` : 'Showing 0 to 0 of 0 entries';
  }
  drawPagination('items-pages', itemPage, totalPages, 'setItemPage');
}

function itemRow(item) {
  return `<tr>
    <td><div class="tbl-item">
      <div class="tbl-thumb"><img src="../${item.image}" alt="${item.name}" onerror="this.src='../images/art_surreal.png';"/></div>
      <div><div class="tbl-name">${item.name}</div><div class="tbl-cat">${item.category}</div></div>
    </div></td>
    <td><span class="badge ${item.sold?'badge-sold':'badge-live'}">${item.sold?'Sold':'Listed'}</span></td>
    <td class="tbl-price">${polAmt(item.price)}</td>
    <td class="tbl-likes">♥ ${item.likes}</td>
    <td><div class="tbl-actions">
      ${!item.sold?`<button class="act act-edit" onclick="editPrice(${item.id})">Edit</button>`:''}
      <button class="act act-del" onclick="removeItem(${item.id})">Remove</button>
    </div></td>
  </tr>`;
}

function editPrice(id) {
  const a    = getArtist();
  const item = a?.items.find(i=>i.id===id);
  if (!item) return;
  const p = parseFloat(prompt(`New price for "${item.name}" (ETH):`, item.price));
  if (!isNaN(p) && p > 0) {
    item.price = p;
    persistDashboardData();
    renderAllItems();
    toast(`Price → ${polAmt(p)}`);
  }
}

function removeItem(id) {
  if (!confirm('Remove this NFT?')) return;
  const a = getArtist();
  if (!a) return;
  a.items = a.items.filter(i=>i.id!==id);
  persistDashboardData();
  renderAllItems();
  setText('sb-item-count', a.items.length);
  toast('Item removed.');
}

function initItemFilters() {
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      itemFilter = btn.dataset.filter;
      itemPage = 1;
      renderAllItems();
    });
  });

  const search = $('item-search');
  if (search) {
    search.addEventListener('input', () => {
      itemSearch = search.value.trim();
      itemPage = 1;
      renderAllItems();
    });
  }
}

/* ============================================================
   EARNINGS page  (earnings.html)
   ============================================================ */
let soldSearch = '';
let soldPage = 1;
const soldPageSize = 5;

function setSoldPage(p) {
  soldPage = p;
  renderEarnings();
}

function renderEarnings() {
  const a = getArtist();
  if (!a) return;

  const sold   = a.items.filter(i=>i.sold);
  const active = a.items.filter(i=>!i.sold);
  const floor  = active.length ? Math.min(...active.map(i=>i.price)) : 0;

  setHtml('earn-total',  polAmt(a.totalEarnings));
  setText('earn-usd',    `≈ ${ethToUSD(a.totalEarnings)}`);
  setText('earn-sold',   sold.length);
  setText('earn-active', active.length);
  setHtml('earn-floor',  floor > 0 ? polAmt(floor) : '—');

  const tbl = $('sold-tbl');
  if (!tbl) return;

  // Filtering sold
  let filtered = sold;
  if (soldSearch) {
    const q = soldSearch.toLowerCase();
    filtered = filtered.filter(item => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
  }

  // Calculating slice
  const total = filtered.length;
  const totalPages = Math.ceil(total / soldPageSize);
  if (soldPage > totalPages && totalPages > 0) soldPage = totalPages;
  const start = (soldPage - 1) * soldPageSize;
  const end = Math.min(start + soldPageSize, total);
  const sliced = filtered.slice(start, end);

  tbl.innerHTML = `
    <thead><tr><th>Item</th><th>Status</th><th>Price</th><th>Likes</th></tr></thead>
    <tbody>${sliced.length ? sliced.map(item => `<tr>
      <td><div class="tbl-item">
        <div class="tbl-thumb"><img src="../${item.image}" alt="${item.name}" onerror="this.src='../images/art_surreal.png';"/></div>
        <div><div class="tbl-name">${item.name}</div><div class="tbl-cat">${item.category}</div></div>
      </div></td>
      <td><span class="badge badge-sold">Sold</span></td>
      <td class="tbl-price">${polAmt(item.price)}</td>
      <td class="tbl-likes">♥ ${item.likes}</td>
    </tr>`).join('') :
      `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-4);">No sold items found.</td></tr>`
    }</tbody>`;

  const info = $('sold-info');
  if (info) {
    info.textContent = total > 0 ? `Showing ${start + 1} to ${end} of ${total} entries` : 'Showing 0 to 0 of 0 entries';
  }
  drawPagination('sold-pages', soldPage, totalPages, 'setSoldPage');
}

function initEarningsSearch() {
  const search = $('sold-search');
  if (search) {
    search.addEventListener('input', () => {
      soldSearch = search.value.trim();
      soldPage = 1;
      renderEarnings();
    });
  }
}

/* ============================================================
   MINT page  (mint.html)
   ============================================================ */
function initMintPage() {
  const input   = $('file-input');
  const preview = $('drop-preview');
  const defView = $('drop-default');
  const dropZone = $('drop-zone');

  if (dropZone) dropZone.addEventListener('click', () => input?.click());
  if (input) {
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
        if (defView) defView.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor='rgba(108,63,255,.6)'; });
    dropZone.addEventListener('dragleave', () => dropZone.style.borderColor='');
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.style.borderColor='';
      const file = e.dataTransfer.files[0];
      if (file && input) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change')); }
    });
  }
}

function submitMint() {
  const name  = $('mint-name')?.value.trim();
  const cat   = $('mint-cat')?.value;
  const price = parseFloat($('mint-price')?.value);
  if (!name)            { toast('Name is required','err'); return; }
  if (!price || price<= 0) { toast('Enter a valid price','err'); return; }

  createNFT(name, cat, price);
  toast(`"${name}" minted and listed ${polAmt(price)} 🎉`);

  $('mint-name').value  = '';
  $('mint-price').value = '';
  if ($('drop-preview')) { $('drop-preview').style.display = 'none'; $('drop-preview').src = ''; }
  if ($('drop-default')) $('drop-default').style.display = 'flex';

  setTimeout(() => window.location.href = 'items.html', 1200);
}

/* ============================================================
   PROFILE page  (profile.html)
   ============================================================ */
function renderProfile() {
  const a = getArtist();
  if (!a) return;

  const av = $('prof-avatar');
  if (av) av.src = a.avatar;
  setText('prof-name',      a.artist);
  setText('prof-wallet-txt', a.wallet);
  setText('prof-wallet-display', a.wallet);
  setHtml('prof-ws-earnings', polAmt(a.totalEarnings));
  setText('prof-ws-items',   a.items.length);
  setText('prof-ws-followers', a.followers.toLocaleString());

  const nameIn = $('edit-name');
  const bioIn  = $('edit-bio');
  if (nameIn) nameIn.value = a.artist;
  if (bioIn)  bioIn.value  = a.bio;
}

function saveProfile() {
  toast('Profile updated successfully!');
}

/* ============================================================
   WITHDRAW page  (withdraw.html)
   ============================================================ */
let withdrawSearch = '';
let withdrawPage = 1;
const withdrawPageSize = 5;

function setWithdrawPage(p) {
  withdrawPage = p;
  renderWithdraw();
}

function getWithdrawals() {
  const artist = getArtist();
  if (!artist) return [];
  const key = `tokenPixelBay_withdrawals_${artist.id}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    const defaults = [
      { id: 'WID-4890', date: new Date(Date.now() - 86400000 * 8).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.12, status: 'Success' },
      { id: 'WID-3120', date: new Date(Date.now() - 86400000 * 7).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.05, status: 'Success' },
      { id: 'WID-9821', date: new Date(Date.now() - 86400000 * 6).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.25, status: 'Success' },
      { id: 'WID-1054', date: new Date(Date.now() - 86400000 * 5).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.08, status: 'Success' },
      { id: 'WID-2244', date: new Date(Date.now() - 86400000 * 4).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.15, status: 'Success' },
      { id: 'WID-6712', date: new Date(Date.now() - 86400000 * 3).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.03, status: 'Success' },
      { id: 'WID-7301', date: new Date(Date.now() - 86400000 * 2).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.45, status: 'Success' },
      { id: 'WID-8800', date: new Date(Date.now() - 86400000 * 1).toISOString().replace('T', ' ').slice(0, 16), wallet: artist.wallet, amount: 0.20, status: 'Pending' }
    ];
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw);
}

function renderWithdraw() {
  const a = getArtist();
  if (!a) return;
  const cap = a.totalEarnings * 0.01;
  setHtml('wd-total',    polAmt(a.totalEarnings));
  setHtml('wd-cap',      polAmt(cap));
  setHtml('wd-cap2',     polAmt(cap));
  setHtml('wd-max-label', polAmt(cap));
  const inp = $('wd-amount');
  if (inp) inp.max = cap.toFixed(4);

  // Render Withdraw History
  const historyBody = $('withdraw-history-body');
  if (historyBody) {
    const historyList = getWithdrawals();
    
    // Filter
    let filtered = historyList;
    if (withdrawSearch) {
      const q = withdrawSearch.toLowerCase();
      filtered = filtered.filter(w => 
        w.id.toLowerCase().includes(q) || 
        w.wallet.toLowerCase().includes(q) || 
        w.status.toLowerCase().includes(q) ||
        w.amount.toString().includes(q) ||
        w.date.toLowerCase().includes(q)
      );
    }
    
    // Paginate
    const count = filtered.length;
    const totalPages = Math.ceil(count / withdrawPageSize);
    if (withdrawPage > totalPages && totalPages > 0) withdrawPage = totalPages;
    const start = (withdrawPage - 1) * withdrawPageSize;
    const end = Math.min(start + withdrawPageSize, count);
    const sliced = filtered.slice(start, end);

    historyBody.innerHTML = sliced.length ? sliced.map(w => `
      <tr>
        <td class="td-mono">${w.id}</td>
        <td>${w.date}</td>
        <td class="td-mono">${w.wallet.slice(0, 8)}...${w.wallet.slice(-6)}</td>
        <td class="tbl-price">${polAmt(w.amount)}</td>
        <td><span class="badge ${w.status === 'Success' ? 'badge-live' : 'badge-sold'}">${w.status}</span></td>
      </tr>`).join('') : `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-4);">No withdrawal history found.</td></tr>`;

    const info = $('withdraw-info');
    if (info) {
      info.textContent = count > 0 ? `Showing ${start + 1} to ${end} of ${count} entries` : 'Showing 0 to 0 of 0 entries';
    }
    drawPagination('withdraw-pages', withdrawPage, totalPages, 'setWithdrawPage');
  }
}

function initWithdrawSearch() {
  const search = $('withdraw-search');
  if (search) {
    search.addEventListener('input', () => {
      withdrawSearch = search.value.trim();
      withdrawPage = 1;
      renderWithdraw();
    });
  }
}


function submitWithdraw() {
  const a   = getArtist();
  if (!a) return;
  const cap = a.totalEarnings * 0.01;
  const amt = parseFloat($('wd-amount')?.value || 0);
  if (!amt || amt <= 0)    { toast('Enter a valid amount', 'err'); return; }
  if (amt > cap)           { toast(`Max withdrawal is ${polAmt(cap)}`, 'err'); return; }

  // Append new history log
  const key = `tokenPixelBay_withdrawals_${a.id}`;
  const list = getWithdrawals();
  list.unshift({
    id: 'WID-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    wallet: a.wallet,
    amount: amt,
    status: 'Pending'
  });
  localStorage.setItem(key, JSON.stringify(list));

  // Deduct from balance
  a.totalEarnings -= amt;
  persistDashboardData();

  toast(`Withdrawal of ${polAmt(amt)} requested — pending confirmation`);
  $('wd-amount').value = '';
  renderWithdraw();
}

/* ============================================================
   REFERRAL page  (referral.html)
   ============================================================ */
const MOCK_REFERRALS = [
  { name: 'AstroPixel',  joined: '2026-03-12', items: 4,  commission: 2.14, status: 'Active' },
  { name: 'NeonDreamer', joined: '2026-03-28', items: 2,  commission: 0.88, status: 'Active' },
  { name: 'VoidCraft',   joined: '2026-04-05', items: 7,  commission: 3.52, status: 'Active' },
  { name: 'LunaFrame',   joined: '2026-04-17', items: 1,  commission: 0.31, status: 'Pending' },
  { name: 'CryptoSage',  joined: '2026-04-29', items: 0,  commission: 0,    status: 'Pending' },
  { name: 'GlitchMaster', joined: '2026-05-02', items: 5,  commission: 1.25, status: 'Active' },
  { name: 'ShadowByte',   joined: '2026-05-10', items: 3,  commission: 0.60, status: 'Active' },
  { name: 'CyberPulse',   joined: '2026-05-15', items: 8,  commission: 4.10, status: 'Active' },
  { name: 'PixelWitch',   joined: '2026-05-22', items: 2,  commission: 0.45, status: 'Pending' },
  { name: 'MetaDream',    joined: '2026-05-28', items: 0,  commission: 0,    status: 'Pending' },
];

let refSearch = '';
let refPage = 1;
const refPageSize = 5;

function setRefPage(p) {
  refPage = p;
  renderReferral();
}

function getTransferredCommission(artistId) {
  return parseFloat(localStorage.getItem(`tokenPixelBay_transferred_${artistId}`) || '0');
}

function renderReferral() {
  const a = getArtist();
  if (!a) return;

  const code     = 'MV-' + (a.artist || 'USER').replace(/\s+/g, '').toUpperCase().slice(0, 6);
  const baseUrl  = window.location.origin + '/auth/register.html';
  const refLink  = `${baseUrl}?ref=${code}`;
  
  // Calculate referral stats
  const total    = MOCK_REFERRALS.length;
  const lifetimeCommission = MOCK_REFERRALS.reduce((s, r) => s + r.commission, 0);
  const transferred = getTransferredCommission(a.id);
  const available = Math.max(0, lifetimeCommission - transferred);
  
  const pendingAmt = MOCK_REFERRALS.filter(r => r.status === 'Pending').reduce((s, r) => s + r.commission, 0);

  setText('ref-code',         code);
  setText('ref-total',        total);
  setText('ref-growth',       `↑ ${total} referred`);
  setText('ref-rate',         '5%');
  setHtml('ref-commission',   polAmt(lifetimeCommission));
  setHtml('ref-pending',      polAmt(available)); // Available to transfer / Pending main withdrawal

  const linkEl = $('ref-link');
  if (linkEl) linkEl.value = refLink;

  // Filter referrals table
  let filtered = MOCK_REFERRALS;
  if (refSearch) {
    const q = refSearch.toLowerCase();
    filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || r.status.toLowerCase().includes(q));
  }

  // Calculate slice
  const count = filtered.length;
  const totalPages = Math.ceil(count / refPageSize);
  if (refPage > totalPages && totalPages > 0) refPage = totalPages;
  const start = (refPage - 1) * refPageSize;
  const end = Math.min(start + refPageSize, count);
  const sliced = filtered.slice(start, end);

  setText('ref-count-label', `${total} artist${total !== 1 ? 's' : ''} referred`);

  const tbl = $('ref-tbl');
  if (tbl) {
    tbl.innerHTML = `
      <thead><tr>
        <th>Artist</th><th>Joined</th><th>Items</th><th>Commission</th><th>Status</th>
      </tr></thead>
      <tbody>${sliced.length ? sliced.map(r => `<tr>
        <td style="color:var(--text-1);font-weight:600;">${r.name}</td>
        <td>${r.joined}</td>
        <td>${r.items}</td>
        <td style="font-family:var(--mono);color:var(--success);">${polAmt(r.commission)}</td>
        <td><span class="badge ${r.status === 'Active' ? 'badge-live' : 'badge-sold'}">${r.status}</span></td>
      </tr>`).join('') : `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-4);">No referred artists found.</td></tr>`}</tbody>`;
  }

  const info = $('ref-info');
  if (info) {
    info.textContent = count > 0 ? `Showing ${start + 1} to ${end} of ${count} entries` : 'Showing 0 to 0 of 0 entries';
  }
  drawPagination('ref-pages', refPage, totalPages, 'setRefPage');
}

function initReferralsSearch() {
  const search = $('ref-search');
  if (search) {
    search.addEventListener('input', () => {
      refSearch = search.value.trim();
      refPage = 1;
      renderReferral();
    });
  }
}

/* Modal Referral Commission Transfer Action */
function openTransferModal() {
  const a = getArtist();
  if (!a) return;
  const lifetimeCommission = MOCK_REFERRALS.reduce((s, r) => s + r.commission, 0);
  const transferred = getTransferredCommission(a.id);
  const available = Math.max(0, lifetimeCommission - transferred);

  setHtml('trans-avail', polAmt(available));
  const inp = $('trans-amount');
  if (inp) {
    inp.value = available.toFixed(2);
    inp.max = available.toFixed(4);
  }
  openModal('transferModal');
}

function submitTransfer() {
  const a = getArtist();
  if (!a) return;
  const lifetimeCommission = MOCK_REFERRALS.reduce((s, r) => s + r.commission, 0);
  const transferred = getTransferredCommission(a.id);
  const available = Math.max(0, lifetimeCommission - transferred);

  const amt = parseFloat($('trans-amount')?.value || 0);
  if (!amt || amt <= 0) { toast('Enter a valid amount', 'err'); return; }
  if (amt > available) { toast(`Insufficient referral commission`, 'err'); return; }

  // Increment transferred tracking
  localStorage.setItem(`tokenPixelBay_transferred_${a.id}`, (transferred + amt).toString());

  // Add transferred amount to total earnings
  a.totalEarnings += amt;
  persistDashboardData();

  closeModal('transferModal');
  toast(`Successfully transferred ${polAmt(amt)} to your main balance! 🎉`);
  renderReferral();
}

function copyCode() {
  const code = $('ref-code')?.textContent;
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => toast('Referral code copied!'));
}

function copyLink() {
  const link = $('ref-link')?.value;
  if (!link) return;
  navigator.clipboard.writeText(link).then(() => toast('Referral link copied!'));
}

function shareTwitter() {
  const link = $('ref-link')?.value || '';
  const text = encodeURIComponent(`Join me on TokenPixelBay — the premier Web3 NFT marketplace! Use my referral link: ${link}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

/* ============================================================
   AUTHENTICATION & SESSION BOOT
   ============================================================ */
function signOut() {
  localStorage.removeItem('tokenPixelBay_session');
  window.location.href = '../auth/login.html';
}

function initNavSession() {
  try {
    const s = JSON.parse(localStorage.getItem('tokenPixelBay_session') || 'null');
    if (s && s.name) setText('sb-name', s.name);
  } catch(e) {}
}

function initNav() {
  const a = getArtist();
  if (!a) return;
  setText('nav-wallet', a.wallet);
}

/* ============================================================
   AUCTION page  (auction.html)
   ============================================================ */
const MOCK_AUCTIONS = [
  { id: 1, name: 'Cosmic Drift #7',  artist: '0xNova',    category: 'Art',       image: 'images/art1.jpeg', currentBid: 12.5, endTime: Date.now() + 86400000 * 2,    bids: 14, featured: true },
  { id: 2, name: 'Neon Genesis #12', artist: 'CryptoMuse', category: '3D',       image: 'images/art2.jpeg', currentBid: 5.8,  endTime: Date.now() + 86400000 * 1.5,  bids: 8,  featured: false },
  { id: 3, name: 'Holy Pixel #3',    artist: 'PixelSaint', category: 'Pixel Art', image: 'images/art3.jpeg', currentBid: 3.2,  endTime: Date.now() + 86400000 * 0.75, bids: 21, featured: false },
  { id: 4, name: 'World Zero #9',    artist: 'MetaVera',   category: '3D',        image: 'images/art4.jpeg', currentBid: 7.1,  endTime: Date.now() + 86400000 * 3,    bids: 5,  featured: false },
];

const MOCK_BID_HISTORY = [
  { bidder: '0x71b2…4a3c', amount: 12.5,  time: '2 min ago' },
  { bidder: '0x44d8…9f2b', amount: 11.0,  time: '18 min ago' },
  { bidder: '0xab12…cc01', amount: 9.5,   time: '1h 4min ago' },
  { bidder: '0x71b2…4a3c', amount: 8.0,   time: '2h 30min ago' },
  { bidder: '0x99aa…11bb', amount: 7.0,   time: '4h 12min ago' },
];

const FAKE_BIDDERS = [
  '0x71b2…4a3c', '0x44d8…9f2b', '0xab12…cc01',
  '0x99aa…11bb', '0xfc33…8d7e', '0x12ef…a2b1', '0x8c90…3311',
];

function refreshBidUI() {
  const featured = MOCK_AUCTIONS.find(a => a.featured);
  if (!featured) return;
  setHtml('auc-current-bid', polAmt(featured.currentBid));
  setHtml('auc-min-bid',     polAmt((featured.currentBid + 0.1).toFixed(2)));
  setText('auc-bids',        featured.bids + ' bids');
  const histEl = $('bid-history');
  if (histEl) {
    histEl.innerHTML = MOCK_BID_HISTORY.map(b => `
      <div class="item-row">
        <div class="item-info">
          <div class="item-name" style="font-family:var(--mono);font-size:.75rem;">${b.bidder}</div>
          <div class="item-cat" style="color:var(--text-2);">${b.time}</div>
        </div>
        <div class="item-right"><div class="item-price">${polAmt(b.amount)}</div></div>
      </div>`).join('');
  }
  document.querySelectorAll('.auc-grid-bid').forEach(el => {
    const id = parseInt(el.dataset.id);
    const a  = MOCK_AUCTIONS.find(x => x.id === id);
    if (a) el.innerHTML = polAmt(a.currentBid);
  });
  document.querySelectorAll('.auc-grid-count').forEach(el => {
    const id = parseInt(el.dataset.id);
    const a  = MOCK_AUCTIONS.find(x => x.id === id);
    if (a) el.textContent = a.bids + ' bids';
  });
}

function renderAuction() {
  const featured = MOCK_AUCTIONS.find(a => a.featured);
  if (!featured) return;

  setText('auc-name',        featured.name);
  setText('auc-artist',      'by ' + featured.artist);
  setText('auc-category',    featured.category);
  setHtml('auc-current-bid', polAmt(featured.currentBid));
  setHtml('auc-min-bid',     polAmt((featured.currentBid + 0.1).toFixed(2)));
  setText('auc-bids',        featured.bids + ' bids');

  const img = $('auc-img');
  if (img) img.src = '../' + featured.image;

  const histEl = $('bid-history');
  if (histEl) {
    histEl.innerHTML = MOCK_BID_HISTORY.map(b => `
      <div class="item-row">
        <div class="item-info">
          <div class="item-name" style="font-family:var(--mono);font-size:.75rem;">${b.bidder}</div>
          <div class="item-cat" style="color:var(--text-2);">${b.time}</div>
        </div>
        <div class="item-right"><div class="item-price">${polAmt(b.amount)}</div></div>
      </div>`).join('');
  }

  const grid = $('auc-grid');
  if (grid) {
    grid.innerHTML = MOCK_AUCTIONS.filter(a => !a.featured).map(a => `
      <div class="stat-card purple" style="cursor:pointer;padding:0;overflow:hidden;">
        <img src="../${a.image}" alt="${a.name}" style="width:100%;height:160px;object-fit:cover;display:block;"/>
        <div style="padding:14px 16px;">
          <div style="font-weight:700;font-size:.85rem;color:var(--text-1);margin-bottom:3px;">${a.name}</div>
          <div style="font-size:.72rem;color:var(--text-2);margin-bottom:10px;">by ${a.artist} · ${a.category}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.62rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.8px;">Current Bid</div>
              <div class="auc-grid-bid" data-id="${a.id}" style="font-family:var(--mono);font-weight:700;color:var(--accent-2);">${polAmt(a.currentBid)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:.62rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.8px;">Total Bids</div>
              <div class="auc-grid-count" data-id="${a.id}" style="font-family:var(--mono);font-size:.78rem;color:var(--accent);font-weight:700;">${a.bids} bids</div>
            </div>
          </div>
        </div>
      </div>`).join('');
  }

  startLiveBidding();
}

let _liveBiddingStarted = false;
function startLiveBidding() {
  if (_liveBiddingStarted) return;
  _liveBiddingStarted = true;

  const ageBid = () => {
    MOCK_BID_HISTORY.forEach(b => {
      if (b.time === 'just now')    b.time = '1 min ago';
      else if (b.time === '1 min ago') b.time = '2 min ago';
    });
  };

  const scheduleBid = () => {
    const delay = 9000 + Math.random() * 16000;
    setTimeout(() => {
      const pool   = MOCK_AUCTIONS;
      const target = pool[Math.floor(Math.random() * pool.length)];
      const inc    = parseFloat((0.1 + Math.random() * 1.4).toFixed(2));
      const newAmt = parseFloat((target.currentBid + inc).toFixed(2));
      const bidder = FAKE_BIDDERS[Math.floor(Math.random() * FAKE_BIDDERS.length)];

      ageBid();
      target.currentBid = newAmt;
      target.bids++;

      if (target.featured) {
        MOCK_BID_HISTORY.unshift({ bidder, amount: newAmt, time: 'just now' });
        if (MOCK_BID_HISTORY.length > 5) MOCK_BID_HISTORY.pop();
        toast(`New bid: ${polAmt(newAmt)} by ${bidder}`);
      }

      refreshBidUI();
      scheduleBid();
    }, delay);
  };

  scheduleBid();
}

function placeBid() {
  const featured = MOCK_AUCTIONS.find(a => a.featured);
  if (!featured) return;
  const inp    = $('bid-amount');
  const amt    = parseFloat(inp?.value || 0);
  const minBid = featured.currentBid + 0.1;
  if (!amt || amt < minBid) { toast(`Minimum bid is ${polAmt(minBid.toFixed(2))}`, 'err'); return; }
  featured.currentBid = amt;
  featured.bids++;
  MOCK_BID_HISTORY.unshift({ bidder: '0xYou…0000', amount: amt, time: 'just now' });
  if (MOCK_BID_HISTORY.length > 5) MOCK_BID_HISTORY.pop();
  refreshBidUI();
  if (inp) inp.value = '';
  toast(`Your bid of ${polAmt(amt)} is now the highest!`);
}

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadDashboardData();
  initSidebar();
  initNav();

  const page = location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '')  renderOverview();
  if (page === 'items.html')    { renderAllItems();  initItemFilters(); }
  if (page === 'earnings.html') { renderEarnings(); initEarningsSearch(); }
  if (page === 'mint.html')     initMintPage();
  if (page === 'profile.html')  renderProfile();
  if (page === 'withdraw.html') { renderWithdraw(); initWithdrawSearch(); }
  if (page === 'referral.html') { renderReferral(); initReferralsSearch(); }
  if (page === 'auction.html')  renderAuction();
});
