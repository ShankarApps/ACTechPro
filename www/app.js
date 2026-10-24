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
let current = 'brand';
function show(which) {
  current = which;
  $('bottomBar').hidden = which === 'brand';
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
  const matches = list.filter(e => norm(e.code) === q);

  if (matches.length) {
    renderDetails(matches);
    const longerPossible = list.some(o => norm(o.code) !== q && norm(o.code).startsWith(q));
    if (!longerPossible) codeInput.blur();       // result shown -> close keyboard
    return;
  }

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
    ch.addEventListener('click', () => { codeInput.value = ch.dataset.code; renderResult(); codeInput.blur(); }));
}

function cardHtml(e, idx) {
  const badges = [e.type, e.blinks, e.reset].filter(Boolean);
  let html = '<div class="detail-card"><div class="badges">' +
    '<span class="big-code">' + esc(e.code) + '</span>' +
    badges.map(b => '<span class="reset-badge">' + esc(b) + '</span>').join('') +
    '</div>';

  if (e.meaning) html += '<p class="label">Meaning</p><p class="value">' + esc(e.meaning) + '</p>';
  if (e.details) html += '<p class="label">Details</p><p class="value">' + esc(e.details) + '</p>';
  if (e.cause)   html += '<p class="label">Cause</p><p class="value">' + esc(e.cause) + '</p>';

  // "What to check" only when there is something to show
  if (Array.isArray(e.steps) && e.steps.length) {
    html += '<p class="label">What to check</p><ol class="steps">' +
      e.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>';
  } else if (e.check) {
    html += '<p class="label">What to check</p><p class="value">' + esc(e.check) + '</p>';
  }

  if (e.image) {
    html += '<button type="button" class="more-btn" data-image="' + esc(e.image) + '">More details (flow chart)</button>';
  }
  return html + '</div>';
}

function renderDetails(entries) {
  output.innerHTML = entries.map(cardHtml).join('<div class="card-gap"></div>');
  output.querySelectorAll('.more-btn').forEach(btn =>
    btn.addEventListener('click', () => { codeInput.blur(); openViewer(btn.dataset.image); }));
}

codeInput.addEventListener('input', renderResult);

/* ---------- keyboard: opens only when the search box is tapped ---------- */
codeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); codeInput.blur(); }   // Search key closes keyboard
});
codeInput.addEventListener('focus', () => document.body.classList.add('typing'));
codeInput.addEventListener('blur',  () => document.body.classList.remove('typing'));

/* ---------- flow chart viewer ---------- */
let zoom = 200;
function applyZoom() { viewerImg.style.width = zoom + '%'; }
function openViewer(src) {
  zoom = 200;
  applyZoom();
  viewerImg.src = src;
  viewer.hidden = false;
}
function closeViewerUI() { viewer.hidden = true; viewerImg.removeAttribute('src'); }
$('zoomIn').addEventListener('click',  () => { zoom = Math.min(500, zoom + 50); applyZoom(); });
$('zoomOut').addEventListener('click', () => { zoom = Math.max(100, zoom - 50); applyZoom(); });
$('viewerClose').addEventListener('click', () => goBack());

/* ---------- back navigation (screen button + Android back button) ---------- */
// Returns true if the app handled the back press, false if we are on the first screen.
function goBack() {
  if (!viewer.hidden) { closeViewerUI(); return true; }
  if (current === 'code') {
    if (activeSeries) { activeSeries = null; show('series'); }
    else { activeBrand = null; show('brand'); }
    return true;
  }
  if (current === 'series') { activeBrand = null; show('brand'); return true; }
  return false;
}
window.handleAndroidBack = goBack;      // called from MainActivity.java
$('bottomBack').addEventListener('click', goBack);

/* ---------- remove old offline cache from earlier versions ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(rs => rs.forEach(r => r.unregister())).catch(() => {});
}
if (window.caches) {
  caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
}

loadDB();
