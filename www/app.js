/* AC Tech Pro — app logic (offline-first PWA) */

let DB = [];
let visible = [];
let activeBrand = null;

const searchBox     = document.getElementById('searchBox');
const brandGrid     = document.getElementById('brandGrid');
const output        = document.getElementById('output');
const resultsTitle  = document.getElementById('resultsTitle');
const netBadge      = document.getElementById('netBadge');

/* ---------- load data ---------- */
async function loadDB() {
  try {
    const res = await fetch('data.json');
    DB = await res.json();
  } catch (e) {
    output.innerHTML = '<p class="text-center text-slate-400 py-8">Could not load database. Check data.json.</p>';
    return;
  }
  renderBrands();
  showAllCodes();
}

/* ---------- brands grid ---------- */
function renderBrands() {
  const brands = [...new Set(DB.map(e => e.brand))].sort();
  brandGrid.innerHTML = '';
  brands.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'brand-btn';
    btn.textContent = b;
    btn.addEventListener('click', () => selectBrand(b, btn));
    brandGrid.appendChild(btn);
  });
}

function selectBrand(brand, btn) {
  activeBrand = brand;
  searchBox.value = '';
  document.querySelectorAll('.brand-btn').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  resultsTitle.textContent = brand + ' — Error Codes';
  renderList(DB.filter(e => e.brand === brand));
}

/* ---------- lists & details ---------- */
function showAllCodes() {
  activeBrand = null;
  resultsTitle.textContent = 'All Error Codes';
  document.querySelectorAll('.brand-btn').forEach(x => x.classList.remove('active'));
  renderList(DB);
}

function renderList(list) {
  visible = list;
  if (!list.length) {
    output.innerHTML = '<p class="text-center text-slate-400 py-8">No codes found. Try another search.</p>';
    return;
  }
  output.innerHTML = list.map((e, i) =>
    '<button class="code-item" data-i="' + i + '">' +
      '<span class="code-badge">' + e.code + '</span>' +
      '<span class="code-meaning">' + e.meaning + '</span>' +
      '<span class="code-brand">' + e.brand + '</span>' +
    '</button>'
  ).join('');
  output.querySelectorAll('.code-item').forEach(el =>
    el.addEventListener('click', () => showDetail(visible[+el.dataset.i]))
  );
}

function showDetail(entry) {
  resultsTitle.textContent = 'Diagnosis';
  output.innerHTML =
    '<button class="back-btn" id="backBtn">&larr; Back to list</button>' +
    '<div class="detail-card">' +
      '<div><span class="big-code">' + entry.code + '</span></div>' +
      '<p class="text-sm text-slate-400 mb-1">Brand</p>' +
      '<p class="font-semibold mb-4">' + entry.brand + '</p>' +
      '<p class="text-sm text-slate-400 mb-1">Meaning</p>' +
      '<p class="mb-4">' + entry.meaning + '</p>' +
      '<p class="text-sm text-slate-400 mb-1">What to check</p>' +
      '<p class="text-cyan-200">' + entry.check + '</p>' +
    '</div>';
  document.getElementById('backBtn').addEventListener('click', () => {
    if (activeBrand) {
      resultsTitle.textContent = activeBrand + ' — Error Codes';
      renderList(DB.filter(e => e.brand === activeBrand));
    } else {
      showAllCodes();
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- search ---------- */
searchBox.addEventListener('input', () => {
  const q = searchBox.value.trim().toLowerCase();
  document.querySelectorAll('.brand-btn').forEach(x => x.classList.remove('active'));
  activeBrand = null;
  if (!q) { showAllCodes(); return; }
  resultsTitle.textContent = 'Search Results';
  renderList(DB.filter(e =>
    e.brand.toLowerCase().includes(q) ||
    e.code.toLowerCase().includes(q) ||
    e.meaning.toLowerCase().includes(q) ||
    e.check.toLowerCase().includes(q)
  ));
});

/* ---------- online / offline badge ---------- */
function updateNet() {
  const on = navigator.onLine;
  netBadge.textContent = on ? 'ONLINE' : 'OFFLINE';
  netBadge.className = on
    ? 'ml-auto text-xs px-2 py-1 rounded-full bg-emerald-900 text-emerald-300'
    : 'ml-auto text-xs px-2 py-1 rounded-full bg-amber-900 text-amber-300';
}
window.addEventListener('online', updateNet);
window.addEventListener('offline', updateNet);
updateNet();

/* ---------- service worker (offline cache) ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

loadDB();
