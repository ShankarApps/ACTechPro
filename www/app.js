let DB = [];
let activeBrand = null;

const screenBrand = document.getElementById('screenBrand');
const screenCode  = document.getElementById('screenCode');
const brandGrid   = document.getElementById('brandGrid');
const brandName   = document.getElementById('brandName');
const codeInput   = document.getElementById('codeInput');
const output      = document.getElementById('output');
const backBtn     = document.getElementById('backBtn');

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function norm(s) {
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

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

function showBrandScreen() {
  activeBrand = null;
  codeInput.value = '';
  output.innerHTML = '';
  screenCode.hidden = true;
  screenBrand.hidden = false;
  window.scrollTo(0, 0);
}

function selectBrand(brand) {
  activeBrand = brand;
  brandName.textContent = brand;
  codeInput.value = '';
  output.innerHTML = '';
  screenBrand.hidden = true;
  screenCode.hidden = false;
  history.pushState({ screen: 'code' }, '');
  window.scrollTo(0, 0);
  codeInput.focus();
}

function renderResult() {
  const q = norm(codeInput.value);
  if (!q) { output.innerHTML = ''; return; }

  const list = DB.filter(e => e.brand === activeBrand);
  const exact = list.find(e => norm(e.code) === q);

  if (exact) {
    output.innerHTML =
      '<div class="detail-card">' +
        '<span class="big-code">' + esc(exact.code) + '</span>' +
        '<p class="label">Meaning</p>' +
        '<p class="value">' + esc(exact.meaning) + '</p>' +
        '<p class="label">What to check</p>' +
        '<p class="value">' + esc(exact.check) + '</p>' +
      '</div>';
    return;
  }

  const similar = list.filter(e => norm(e.code).startsWith(q));
  let html = '<p class="msg error">Code <b>' + esc(codeInput.value.trim()) +
             '</b> not found for ' + esc(activeBrand) + '.</p>';
  if (similar.length) {
    html += '<p class="suggest-title">Did you mean:</p><div class="chips">' +
      similar.map(e => '<button type="button" class="chip" data-code="' + esc(e.code) + '">' +
                       esc(e.code) + '</button>').join('') +
      '</div>';
  }
  output.innerHTML = html;
  output.querySelectorAll('.chip').forEach(ch =>
    ch.addEventListener('click', () => {
      codeInput.value = ch.dataset.code;
      renderResult();
    }));
}

codeInput.addEventListener('input', renderResult);

backBtn.addEventListener('click', () => history.back());
window.addEventListener('popstate', () => {
  if (!screenCode.hidden) showBrandScreen();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(rs => rs.forEach(r => r.unregister())).catch(() => {});
}
if (window.caches) {
  caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
}

loadDB();
