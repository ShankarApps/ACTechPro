/* AC Tech Pro — app logic (fully offline, no external libraries) */

let DB = [];
let activeBrand = null;
let activeSeries = null;

const $ = id => document.getElementById(id);
const screenBrand  = $('screenBrand');
const screenSeries = $('screenSeries');
const screenCode   = $('screenCode');
const brandGrid    = $('brandGrid');
const seriesGrid   = $('seriesGrid');
const codeInput    = $('codeInput');
const output       = $('output');
const viewer       = $('viewer');
const viewerImg    = $('viewerImg');

/* ---------- helpers ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// "e-1", "E 1", "e1" all become "E1"
function norm(s) { return String(s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }

function seriesOf(brand) {
  return [...new Set(DB.filter(e => e.brand === brand && e.series).map(e => e.series))];
}

/* ---------- load data ---------- */
async function loadDB() {
  try {
    const res = await fetch('data.json');
    DB = await res.json();
  } catch (e) {
    brandGrid.innerHTML = '<p class="msg error">Could not load database (data.json).</p>';
    return;
  }
  renderBrands();
}

/* ---------- screens ---------- */
function show(which) {
  screenBrand.hidden  = which !== 'brand';
  screenSeries.hidden = which !== 'series';
  screenCode.hidden   = which !== 'code';
  window.scrollTo(0, 0);
}

function renderBrands() {
  const brands = [...new Set(DB.map(e => e.brand))].sort();
  brandGrid.innerHTML = '';
  brands.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'brand-btn';
    btn.textContent = b;
    btn.addEventListener('click', () => selectBrand(b));
    brandGrid.appendChild(btn);
  });
}

function selectBrand(brand) {
  activeBrand = brand;
  activeSeries = null;
  const list = seriesOf(brand);
  if (list.length) {
    $('seriesBrandName').textContent = brand;
    seriesGrid.innerHTML = '';
    list.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'brand-btn';
      btn.textContent = s;
      btn.addEventListener('click', () => selectSeries(s));
      seriesGrid.appendChild(btn);
    });
    history.pushState({ screen: 'series' }, '');
    show('series');
  } else {
    openCodeScreen();
  }
}

function selectSeries(series) {
  activeSeries = series;
  openCodeScreen();
}

function openCodeScreen() {
  $('brandName').textContent = activeBrand;
  $('seriesLine').hidden = !activeSeries;
  $('seriesName').textContent = activeSeries || '';
  codeInput.value = '';
  output.innerHTML = '';
  history.pushState({ screen: 'code' }, '');
  show('code');
  codeInput.focus();
}

/* ---------- result ---------- */
function entriesForSelection() {
  return DB.filter(e => e.brand === activeBrand &&
    (activeSeries ? e.series === activeSeries : !e.series));
}

function renderResult() {
  const q = norm(codeInput.value);
  if (!q) { output.innerHTML = ''; return; }

  const list = entriesForSelection();
  const exact = list.find(e => norm(e.code) === q);

  if (exact) { renderDetail(exact); return; }

  const similar = list.filter(e => norm(e.code).startsWith(q));
  let html = '<p class="msg error">Code <b>' + esc(codeInput.value.trim()) +
             '</b> not found for ' + esc(activeBrand) +
             (activeSeries ? ' (' + esc(activeSeries) + ')' : '') + '.</p>';
  if (similar.length) {
    html += '<p class="suggest-title">Did you mean:</p><div class="chips">' +
      similar.map(e => '<button type="button" class="chip" data-code="' + esc(e.code) + '">' +
                       esc(e.code) + '</button>').join('') + '</div>';
  }
  output.innerHTML = html;
  output.querySelectorAll('.chip').forEach(ch =>
    ch.addEventListener('click', () => { codeInput.value = ch.dataset.code; renderResult(); }));
}

function renderDetail(e) {
  let html = '<div class="detail-card"><div class="badges">' +
    '<span class="big-code">' + esc(e.code) + '</span>' +
    (e.reset ? '<span class="reset-badge">' + esc(e.reset) + '</span>' : '') +
    '</div>' +
    '<p class="label">Meaning</p><p class="value">' + esc(e.meaning) + '</p>';

  if (e.cause) html += '<p class="label">Cause</p><p class="value">' + esc(e.cause) + '</p>';

  html += '<p class="label">What to check</p>';
  if (Array.isArray(e.steps) && e.steps.length) {
    html += '<ol class="steps">' + e.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
  } else {
    html += '<p class="value">' + esc(e.check || '') + '</p>';
  }

  if (e.image) {
    html += '<button type="button" class="more-btn" id="moreBtn">More details (flow chart)</button>';
  }
  html += '</div>';
  output.innerHTML = html;

  const more = $('moreBtn');
  if (more) more.addEventListener('click', () => openViewer(e.image));
}

codeInput.addEventListener('input', renderResult);

/* ---------- flow chart viewer ---------- */
let zoom = 200;
function applyZoom() { viewerImg.style.width = zoom + '%'; }
function openViewer(src) {
  zoom = 200;
  applyZoom();
  viewerImg.src = src;
  viewer.hidden = false;
  history.pushState({ screen: 'viewer' }, '');
}
function closeViewerUI() { viewer.hidden = true; viewerImg.removeAttribute('src'); }
$('zoomIn').addEventListener('click',  () => { zoom = Math.min(500, zoom + 50); applyZoom(); });
$('zoomOut').addEventListener('click', () => { zoom = Math.max(100, zoom - 50); applyZoom(); });
$('viewerClose').addEventListener('click', () => history.back());

/* ---------- navigation (Android back button) ---------- */
$('backSeries').addEventListener('click', () => history.back());
$('backCode').addEventListener('click',   () => history.back());

window.addEventListener('popstate', e => {
  const s = (e.state && e.state.screen) || 'brand';
  if (s !== 'viewer') closeViewerUI();
  if (s === 'brand') {
    activeBrand = null; activeSeries = null;
    show('brand');
  } else if (s === 'series') {
    activeSeries = null;
    show('series');
  } else if (s === 'code') {
    show('code');
  }
});

/* ---------- remove old offline cache from earlier versions ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(rs => rs.forEach(r => r.unregister())).catch(() => {});
}
if (window.caches) {
  caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
}

loadDB();
