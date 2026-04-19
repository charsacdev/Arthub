/* ============================================================
   ArtsHub Dashboard — All JS (single file)
   ============================================================ */

/* ── Helpers ── */
function $(id)    { return document.getElementById(id); }
function setText(id, v) { const el = $(id); if (el) el.textContent = v; }
function ethToUSD(e) {
  return (e * 3420).toLocaleString('en-US', { style:'currency', currency:'USD' });
}

function toast(msg, type = 'ok') {
  const wrap = $('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-icon">${type==='ok'?'✓':'✕'}</div><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
}

/* ── Data access ── */
function getArtist() {
  return COLLECTIONS.find(a => a.id === CURRENT_ARTIST_ID);
}

/* ============================================================
   SIDEBAR — shared across all pages
   ============================================================ */
function initSidebar() {
  const artist = getArtist();
  if (!artist) return;

  const avatar = $('sb-avatar-img');
  if (avatar) avatar.src = artist.avatar;
  setText('sb-name', artist.artist);
  setText('sb-item-count', artist.items.length);

  /* mark active link by matching current filename */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sb-link[data-page]').forEach(link => {
    if (link.dataset.page === page) link.classList.add('active');
  });

  /* hamburger */
  const hbg = $('hamburger');
  const nav = $('navLinks');
  if (hbg && nav) hbg.addEventListener('click', () => nav.classList.toggle('open'));
}

/* ============================================================
   MODAL helpers (used on multiple pages)
   ============================================================ */
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ============================================================
   QUICK-MINT (modal on Overview + Items page)
   ============================================================ */
function mintFromModal() {
  const name  = $('mm-name')?.value.trim();
  const cat   = $('mm-cat')?.value;
  const price = parseFloat($('mm-price')?.value);
  if (!name)           { toast('Please enter a name','err'); return; }
  if (!price || price <= 0) { toast('Please enter a valid price','err'); return; }

  createNFT(name, cat, price);
  closeModal('mintModal');
  toast(`"${name}" minted for Ξ ${price.toFixed(2)} 🎉`);
  $('mm-name').value  = '';
  $('mm-price').value = '';

  /* refresh table if on items page */
  if (typeof renderAllItems === 'function') renderAllItems();
  /* refresh overview if on index page */
  if (typeof renderOverview === 'function') renderOverview();
}

function createNFT(name, category, price) {
  const a = getArtist();
  if (!a) return;
  const id = Date.now();
  a.items.unshift({
    id, name, category, price,
    image: `https://picsum.photos/seed/nft${id}/400/400`,
    likes: 0, sold: false
  });
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
  setText('ov-earnings', `Ξ ${a.totalEarnings.toFixed(2)}`);
  setText('ov-items',    a.items.length);
  setText('ov-sold',     sold.length);
  setText('ov-likes',    likes.toLocaleString());

  /* recent items */
  const list = $('ov-recent');
  if (list) {
    list.innerHTML = a.items.slice(0,4).map(item => `
      <div class="item-row">
        <div class="item-thumb"><img src="${item.image}" alt="${item.name}" loading="lazy"/></div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-cat">${item.category}</div>
        </div>
        <div class="item-right">
          <div class="item-price">Ξ ${item.price.toFixed(2)}</div>
          <div class="item-status ${item.sold?'s-sold':'s-live'}">${item.sold?'Sold':'Listed'}</div>
        </div>
      </div>`).join('');
  }
}

/* ============================================================
   ITEMS page  (items.html)
   ============================================================ */
let itemFilter = 'all';

function renderAllItems() {
  const a = getArtist();
  const tbl = $('items-tbl');
  if (!tbl || !a) return;

  const rows = (itemFilter==='live' ? a.items.filter(i=>!i.sold)
               : itemFilter==='sold' ? a.items.filter(i=>i.sold)
               : a.items);

  tbl.innerHTML = `
    <thead><tr>
      <th>Item</th><th>Status</th><th>Price</th><th>Likes</th><th>Actions</th>
    </tr></thead>
    <tbody>${rows.length ? rows.map(itemRow).join('') :
      '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-4);">No items found.</td></tr>'
    }</tbody>`;
}

function itemRow(item) {
  return `<tr>
    <td><div class="tbl-item">
      <div class="tbl-thumb"><img src="${item.image}" alt="${item.name}"/></div>
      <div><div class="tbl-name">${item.name}</div><div class="tbl-cat">${item.category}</div></div>
    </div></td>
    <td><span class="badge ${item.sold?'badge-sold':'badge-live'}">${item.sold?'Sold':'Listed'}</span></td>
    <td class="tbl-price">Ξ ${item.price.toFixed(2)}</td>
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
  if (!isNaN(p) && p > 0) { item.price = p; renderAllItems(); toast(`Price → Ξ ${p.toFixed(2)}`); }
}

function removeItem(id) {
  if (!confirm('Remove this NFT?')) return;
  const a = getArtist();
  if (!a) return;
  a.items = a.items.filter(i=>i.id!==id);
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
      renderAllItems();
    });
  });
}

/* ============================================================
   EARNINGS page  (earnings.html)
   ============================================================ */
function renderEarnings() {
  const a = getArtist();
  if (!a) return;

  const sold   = a.items.filter(i=>i.sold);
  const active = a.items.filter(i=>!i.sold);
  const floor  = active.length ? Math.min(...active.map(i=>i.price)) : 0;

  setText('earn-total',  `Ξ ${a.totalEarnings.toFixed(2)}`);
  setText('earn-usd',    `≈ ${ethToUSD(a.totalEarnings)}`);
  setText('earn-sold',   sold.length);
  setText('earn-active', active.length);
  setText('earn-floor',  floor > 0 ? `Ξ ${floor.toFixed(2)}` : '—');

  const tbl = $('sold-tbl');
  if (!tbl) return;
  tbl.innerHTML = `
    <thead><tr><th>Item</th><th>Status</th><th>Price</th><th>Likes</th><th></th></tr></thead>
    <tbody>${sold.length ? sold.map(item=>`<tr>
      <td><div class="tbl-item">
        <div class="tbl-thumb"><img src="${item.image}" alt="${item.name}"/></div>
        <div><div class="tbl-name">${item.name}</div><div class="tbl-cat">${item.category}</div></div>
      </div></td>
      <td><span class="badge badge-sold">Sold</span></td>
      <td class="tbl-price">Ξ ${item.price.toFixed(2)}</td>
      <td class="tbl-likes">♥ ${item.likes}</td>
      <td></td>
    </tr>`).join('') :
      '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-4);">No sold items yet.</td></tr>'
    }</tbody>`;
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

  /* drag and drop */
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
  toast(`"${name}" minted and listed for Ξ ${price.toFixed(2)} 🎉`);

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
  setText('prof-ws-earnings', `Ξ ${a.totalEarnings.toFixed(2)}`);
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
   AUTH
   ============================================================ */
function signOut() {
  localStorage.removeItem('artsHub_session');
  window.location.href = '../auth/login.html';
}

function initNavSession() {
  try {
    const s = JSON.parse(localStorage.getItem('artsHub_session') || 'null');
    if (s && s.name) setText('sb-name', s.name);
  } catch(e) {}
}

/* ============================================================
   NAVBAR wallet display
   ============================================================ */
function initNav() {
  const a = getArtist();
  if (!a) return;
  setText('nav-wallet', a.wallet);
}

/* ============================================================
   BOOT — each page calls what it needs via data-page attribute
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initNav();

  const page = location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '')  renderOverview();
  if (page === 'items.html')    { renderAllItems();  initItemFilters(); }
  if (page === 'earnings.html') renderEarnings();
  if (page === 'mint.html')     initMintPage();
  if (page === 'profile.html')  renderProfile();
});
