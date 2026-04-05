/* ── State ──────────────────────────────── */
const STORAGE_KEY = 'paypal_stored_data';
let clickCount = 0;
let clickTimer = null;

/* ── DOM refs ──────────────────────────── */
const loginScreen  = document.getElementById('login-screen');
const signupScreen = document.getElementById('signup-screen');
const dataScreen   = document.getElementById('data-screen');
const loginForm    = document.getElementById('login-form');
const signupForm   = document.getElementById('signup-form');
const loginBtn     = document.getElementById('login-btn');
const signupBtn    = document.getElementById('signup-btn');
const backToLogin  = document.getElementById('back-to-login');
const closeData    = document.getElementById('close-data');
const exportBtn    = document.getElementById('export-btn');
const clearBtn     = document.getElementById('clear-btn');
const clickHint    = document.getElementById('click-hint');

/* ── Helpers ───────────────────────────── */
function getData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function addEntry(type, details) {
  const data = getData();
  data.unshift({
    id: Date.now() + '_' + Math.random().toString(36).slice(2,8),
    type,
    details,
    timestamp: new Date().toISOString()
  });
  saveData(data);
}

function showScreen(screen) {
  [loginScreen, signupScreen, dataScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  return days + 'd ago';
}

/* ── Render Data Panel ─────────────────── */
function renderData() {
  const data = getData();
  const logins  = data.filter(d => d.type === 'login').length;
  const signups = data.filter(d => d.type === 'signup').length;

  document.getElementById('stat-total').textContent   = data.length;
  document.getElementById('stat-logins').textContent   = logins;
  document.getElementById('stat-signups').textContent  = signups;

  const list = document.getElementById('data-list');

  if (data.length === 0) {
    list.innerHTML = '<div class="empty-state">No stored records yet.<br>Submit the login or signup form to store data.</div>';
    return;
  }

  list.innerHTML = data.map(entry => {
    const isLogin = entry.type === 'login';
    const icon  = isLogin ? '🔑' : '✨';
    const label = isLogin ? 'Login Attempt' : 'Sign Up';
    const detail = entry.details.email || entry.details.name || '—';
    return `
      <div class="data-entry">
        <div class="entry-icon ${entry.type}">${icon}</div>
        <div class="entry-info">
          <div class="entry-type">${label}</div>
          <div class="entry-detail">${escapeHtml(detail)}</div>
        </div>
        <div class="entry-time">${timeAgo(entry.timestamp)}</div>
      </div>`;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Login Form Submit ─────────────────── */
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  addEntry('login', { email, password });
  toast('Logged in! Credentials stored.');
  loginForm.reset();
});

/* ── Login Button Click Counter ────────── */
loginBtn.addEventListener('click', function() {
  clickCount++;

  // Reset counter after 4s of no clicks
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    clickCount = 0;
    clickHint.textContent = '';
  }, 4000);

  // Show subtle hints after 5 clicks
  if (clickCount >= 5 && clickCount < 10) {
    clickHint.textContent = `${10 - clickCount} more…`;
  }

  if (clickCount >= 10) {
    clickCount = 0;
    clickHint.textContent = '';
    renderData();
    showScreen(dataScreen);
  }
});

/* ── Sign Up ───────────────────────────── */
signupBtn.addEventListener('click', function() {
  showScreen(signupScreen);
});

signupForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  addEntry('signup', { name, email, password });
  toast('Account created! Info stored.');
  signupForm.reset();
  showScreen(loginScreen);
});

/* ── Navigation ────────────────────────── */
backToLogin.addEventListener('click', function(e) {
  e.preventDefault();
  showScreen(loginScreen);
});

closeData.addEventListener('click', function() {
  showScreen(loginScreen);
});

/* ── Export ─────────────────────────────── */
exportBtn.addEventListener('click', function() {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'paypal-stored-data.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported!');
});

/* ── Clear All ─────────────────────────── */
clearBtn.addEventListener('click', function() {
  if (confirm('Delete all stored records? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    renderData();
    toast('All data cleared.');
  }
});
