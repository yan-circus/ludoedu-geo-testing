// ─── Version ─────────────────────────────────────────────────────────────────

const APP_VERSION = { hash: '472298e', date: '2026-05-05', time: '20:56', msg: 'Apprentissage : recentrage carte + compteur pays + améliorations UX' };

// ─── Constants ───────────────────────────────────────────────────────────────

const LIVES_MAX              = 3;
const FEEDBACK_DELAY_CORRECT = 700;
const FEEDBACK_DELAY_WRONG   = 2500;
const SMALL_KM2              = 2000;
const TIME_LIMIT             = 5;      // seconds per question
const SCORE_MIN              = 100;
const SCORE_MAX              = 1000;
const ZOOM_FACTOR            = 0.87;   // zoom in per tick (< 1)
const ZOOM_MIN_W             = 40;     // max zoom in (SVG units)

const LEVEL_NAMES = {
  1: 'Monde entier', 2: 'Europe', 3: 'Union Européenne',
  4: 'Afrique', 5: 'Asie', 6: 'Amérique', 7: 'Océanie',
};
const GAME_TYPE_NAMES = { 1: 'Classique', 2: 'Sans chrono' };

const SKIN_IDS   = { sombre: 1, colore: 2, tresor: 3, multi: 4 };
const SKIN_NAMES = { 1: 'sombre', 2: 'colore', 3: 'tresor', 4: 'multi' };

const VIEWBOXES = {
  monde:    '0 0 2000 857',
  Europe:   '800 60 520 240',
  UE:       '800 60 520 240',
  Afrique:  '780 195 590 510',
  Asie:     '1100 50 750 440',
  Amérique: '0 30 930 800',
  Océanie:  '1470 340 540 360',
};

const CLASS_TO_ISO = {
  "Angola":                          "AO",
  "Antigua and Barbuda":             "AG",
  "Argentina":                       "AR",
  "Australia":                       "AU",
  "Azerbaijan":                      "AZ",
  "Bahamas":                         "BS",
  "Canada":                          "CA",
  "Cape Verde":                      "CV",
  "Chile":                           "CL",
  "China":                           "CN",
  "Comoros":                         "KM",
  "Cyprus":                          "CY",
  "Denmark":                         "DK",
  "Federated States of Micronesia":  "FM",
  "Fiji":                            "FJ",
  "France":                          "FR",
  "Greece":                          "GR",
  "Indonesia":                       "ID",
  "Italy":                           "IT",
  "Japan":                           "JP",
  "Malaysia":                        "MY",
  "Malta":                           "MT",
  "Mauritius":                       "MU",
  "New Zealand":                     "NZ",
  "Norway":                          "NO",
  "Oman":                            "OM",
  "Papua New Guinea":                "PG",
  "Philippines":                     "PH",
  "Russian Federation":              "RU",
  "Saint Kitts and Nevis":           "KN",
  "Samoa":                           "WS",
  "São Tomé and Principe":           "ST",
  "Seychelles":                      "SC",
  "Solomon Islands":                 "SB",
  "Tonga":                           "TO",
  "Trinidad and Tobago":             "TT",
  "Turkey":                          "TR",
  "United Kingdom":                  "GB",
  "United States":                   "US",
  "Vanuatu":                         "VU",
  "Canary Islands (Spain)":          "ES",
  "American Samoa":                  "AS",
  "Cayman Islands":                  "KY",
  "Faeroe Islands":                  "FO",
  "Falkland Islands":                "FK",
  "French Polynesia":                "PF",
  "Guadeloupe":                      "GP",
  "New Caledonia":                   "NC",
  "Northern Mariana Islands":        "MP",
  "Puerto Rico":                     "PR",
  "Turks and Caicos Islands":        "TC",
  "United States Virgin Islands":    "VI",
};

// ─── Themes ──────────────────────────────────────────────────────────────────

const THEMES = {
  sombre: {
    '--bg':           '#1a1a2e', '--surface':      '#16213e', '--accent':       '#0f3460',
    '--text':         '#e0e0e0', '--text-dim':     '#888',    '--ocean':        '#2a4a6b',
    '--country-fill': '#c8d6c8', '--hover-fill':   '#f0c040', '--correct':      '#2ecc71',
    '--wrong':        '#e74c3c', '--selected-fill':'#3ab5e6', '--radius-btn':   '6px',
    '--h1-font':      'inherit',
  },
  colore: {
    '--bg':           '#e8f4fd', '--surface':      '#ffffff', '--accent':       '#2980b9',
    '--text':         '#1a1a2a', '--text-dim':     '#d0e8f8', '--ocean':        '#5bafd6',
    '--country-fill': '#a8d8a8', '--hover-fill':   '#f39c12', '--correct':      '#27ae60',
    '--wrong':        '#c0392b', '--selected-fill':'#2980b9', '--radius-btn':   '6px',
    '--h1-font':      'inherit',
  },
  tresor: {
    '--bg':           '#1e1006', '--surface':      '#2e1a08', '--accent':       '#7a4a15',
    '--text':         '#f0ddb0', '--text-dim':     '#d4b880', '--ocean':        '#3a5c3a',
    '--country-fill': '#c8a060', '--hover-fill':   '#e8b030', '--correct':      '#5a9040',
    '--wrong':        '#b03020', '--selected-fill':'#d4801a', '--radius-btn':   '6px',
    '--h1-font':      "Georgia, 'Times New Roman', serif",
  },
  multi: {
    '--bg':           '#1a1a2e', '--surface':      '#16213e', '--accent':       '#0f3460',
    '--text':         '#e0e0e0', '--text-dim':     '#888',    '--ocean':        '#1a2a4a',
    '--country-fill': '#c8d6c8', '--hover-fill':   '#f0c040', '--correct':      '#2ecc71',
    '--wrong':        '#e74c3c', '--selected-fill':'#3ab5e6', '--radius-btn':   '6px',
    '--h1-font':      'inherit',
  },
};

// ─── Theme ───────────────────────────────────────────────────────────────────

// Distribute hues using the golden angle + prime scrambling to break alphabetical clustering
function countryHue(iso) {
  const n = iso.charCodeAt(0) * 677 + iso.charCodeAt(1);
  return (n * 137.508) % 360;
}

function applyMulticolorPaths(active) {
  Object.entries(countryPaths).forEach(([iso, paths]) => {
    const h = countryHue(iso);
    paths.forEach(path => {
      if (active) {
        path.style.setProperty('--c-fill',     `hsl(${h},55%,50%)`);
        path.style.setProperty('--c-hover',    `hsl(${h},65%,72%)`);
        path.style.setProperty('--c-selected', `hsl(${h},55%,80%)`);
      } else {
        path.style.removeProperty('--c-fill');
        path.style.removeProperty('--c-hover');
        path.style.removeProperty('--c-selected');
      }
    });
  });
}

function applyTheme(name) {
  const vars = THEMES[name];
  if (!vars) return;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  document.body.dataset.theme = name;
  localStorage.setItem('geo-theme', name);
  document.querySelectorAll('.theme-card').forEach(c =>
    c.classList.toggle('active', c.dataset.theme === name)
  );
  applyMulticolorPaths(name === 'multi');
}

// ─── State ───────────────────────────────────────────────────────────────────

let countries      = [];
let countryPaths   = {};   // ISO → SVGPathElement[]  (paths only, no circles)
let countryCircles = {};   // ISO → SVGCircleElement  (separate, invisible by default)
let countryById    = {};   // ISO → country object

let mode  = 'game';
let level = 'monde';

// ViewBox state (current)
let vb = { x: 0, y: 0, w: 2000, h: 857 };

// Game state
let gameState     = 'idle';
let score         = 0;
let lives         = 0;
let currentCountry = null;
let queue         = [];
let activePaths   = new Set();
let gameStartTime = null;
let gamePoolSize  = 0;
let correctCount  = 0;

// Learning state
let selectedId    = null;
let shownCircleId = null;
let sortCol       = 'nom';
let sortDir       = 'asc';

// Drag / touch state
let isDragging      = false;
let lastDragScreen  = null;
let mouseDownPos    = null;
let lastTouchDist   = null;
let touchMoved      = false;
let lastTapTime     = 0;

// Timer state
let timerRaf     = null;
let timerStart   = null;
let timerEnabled = true;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const mapContainer = document.getElementById('map-container');
const questionEl   = document.getElementById('question');
const messageEl    = document.getElementById('message');
const scoreEl      = document.getElementById('score');
const livesEl      = document.getElementById('lives');
const startBtn     = document.getElementById('start-btn');
const levelSelect  = document.getElementById('level-select');
const listBody     = document.getElementById('list-body');
const btnGame      = document.getElementById('btn-game');
const btnLearn     = document.getElementById('btn-learn');
const timerFill    = document.getElementById('timer-fill');
const timerBtn     = document.getElementById('timer-btn');

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const [countriesData, svgText] = await Promise.all([
    fetch('countries.json').then(r => r.json()),
    fetch('world.svg').then(r => r.text()),
  ]);

  countries   = countriesData;
  countryById = Object.fromEntries(countries.map(c => [c.id, c]));

  mapContainer.innerHTML = svgText;

  const counterEl = document.createElement('div');
  counterEl.id = 'country-counter';
  counterEl.className = 'hidden';
  mapContainer.appendChild(counterEl);
  const svg = mapContainer.querySelector('svg');
  svg.removeAttribute('width');
  svg.removeAttribute('height');

  function registerPath(path, id) {
    if (!countryPaths[id]) countryPaths[id] = [];
    countryPaths[id].push(path);
    path.classList.add('country');
    path.dataset.countryId = id;
    path.addEventListener('click', onPathClick);
  }

  svg.querySelectorAll('path[id]').forEach(path => {
    const id = path.getAttribute('id');
    if (/^[A-Z]{2}$/.test(id)) registerPath(path, id);
  });

  svg.querySelectorAll('path[class]').forEach(path => {
    const cls = path.getAttribute('class');
    const id  = CLASS_TO_ISO[cls];
    if (id) registerPath(path, id);
  });

  drawSmallCountryMarkers(svg);
  setupMapInteraction(svg);

  btnGame.addEventListener('click',  () => setMode('game'));
  btnLearn.addEventListener('click', () => setMode('learning'));
  startBtn.addEventListener('click', () => {
    if (gameState === 'idle') startGame(); else resetGameIdle();
  });

  levelSelect.addEventListener('change', e => {
    level = e.target.value;
    resetZoom();
    if (mode === 'learning') { applyLevelInactive(); renderList(); }
    if (gameState !== 'idle') resetGameIdle();
    if (mode === 'game' && gameState === 'idle') applyLevelInactive();
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sortCol = btn.dataset.col;
      sortDir = btn.dataset.dir;
      updateSortIndicators();
      renderList();
    });
  });

  // Help modal
  const helpOverlay = document.getElementById('help-overlay');
  const helpBtn     = document.getElementById('help-btn');
  const helpClose   = document.getElementById('help-close');
  document.getElementById('help-version').textContent =
    `${APP_VERSION.hash} · ${APP_VERSION.date} ${APP_VERSION.time}`;

  helpBtn.addEventListener('click',  () => helpOverlay.classList.remove('hidden'));
  helpClose.addEventListener('click', () => helpOverlay.classList.add('hidden'));
  helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.classList.add('hidden'); });

  // Triple-clic sur la version → mode développeur
  let devClickCount = 0, devClickTimer = null;
  document.getElementById('help-version').addEventListener('click', () => {
    devClickCount++;
    clearTimeout(devClickTimer);
    devClickTimer = setTimeout(() => { devClickCount = 0; }, 600);
    if (devClickCount >= 3) {
      devClickCount = 0;
      document.body.classList.toggle('dev-mode');
      updateDevPanel();
    }
  });

  // Scores modal
  document.getElementById('scores-btn').addEventListener('click', openScoresModal);
  document.getElementById('scores-close').addEventListener('click', () =>
    document.getElementById('scores-overlay').classList.add('hidden')
  );
  document.getElementById('scores-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('scores-overlay'))
      document.getElementById('scores-overlay').classList.add('hidden');
  });
  document.querySelectorAll('.scores-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.scores-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('scores-mine').classList.toggle('hidden',   tab.dataset.tab !== 'mine');
      document.getElementById('scores-global').classList.toggle('hidden', tab.dataset.tab !== 'global');
      if (tab.dataset.tab === 'global') loadLeaderboard();
    });
  });
  document.getElementById('scores-level-select').addEventListener('change', loadLeaderboard);

  // Settings modal
  const overlay      = document.getElementById('settings-overlay');
  const settingsBtn  = document.getElementById('settings-btn');
  const settingsClose = document.getElementById('settings-close');

  settingsBtn.addEventListener('click',  () => overlay.classList.remove('hidden'));
  settingsClose.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

  document.querySelectorAll('.theme-card').forEach(card =>
    card.addEventListener('click', () => {
      applyTheme(card.dataset.theme);
      const skinId = SKIN_IDS[card.dataset.theme];
      if (skinId) window.firebaseService?.updateUserSkin(skinId).catch(console.error);
    })
  );

  applyTheme(localStorage.getItem('geo-theme') || 'sombre');
  // La pref Firestore écrasera le localStorage une fois le user connecté (voir onFirebaseAuthChanged)

  // Fullscreen
  document.getElementById('fs-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('is-fullscreen', !!document.fullscreenElement);
  });

  // Auth modal
  const authOverlay  = document.getElementById('auth-overlay');
  const authBtn      = document.getElementById('auth-btn');
  const userDropdown = document.getElementById('user-dropdown');

  authBtn.addEventListener('click', () => {
    if (window.firebaseService?.getUser()) {
      userDropdown.classList.toggle('hidden');
    } else {
      authOverlay.classList.remove('hidden');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    window.firebaseService.signOut().catch(console.error);
    userDropdown.classList.add('hidden');
  });

  document.addEventListener('click', e => {
    if (!document.getElementById('user-area').contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });

  document.getElementById('auth-close').addEventListener('click', () =>
    authOverlay.classList.add('hidden')
  );
  authOverlay.addEventListener('click', e => {
    if (e.target === authOverlay) authOverlay.classList.add('hidden');
  });
  document.getElementById('play-anon').addEventListener('click', () =>
    authOverlay.classList.add('hidden')
  );

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('auth-login').classList.toggle('hidden',    tab.dataset.tab !== 'login');
      document.getElementById('auth-register').classList.toggle('hidden', tab.dataset.tab !== 'register');
    });
  });

  document.getElementById('login-btn').addEventListener('click', async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    errorEl.textContent = '';
    document.getElementById('login-btn').disabled = true;
    try {
      await window.firebaseService.signIn(email, password);
      authOverlay.classList.add('hidden');
    } catch (err) {
      errorEl.textContent = authErrorMsg(err);
    } finally {
      document.getElementById('login-btn').disabled = false;
    }
  });

  document.getElementById('register-btn').addEventListener('click', async () => {
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName  = document.getElementById('reg-lastname').value.trim();
    const email     = document.getElementById('reg-email').value.trim();
    const password  = document.getElementById('reg-password').value;
    const errorEl   = document.getElementById('register-error');
    errorEl.textContent = '';
    document.getElementById('register-btn').disabled = true;
    try {
      await window.firebaseService.signUp(email, password, firstName, lastName);
      authOverlay.classList.add('hidden');
    } catch (err) {
      errorEl.textContent = authErrorMsg(err);
    } finally {
      document.getElementById('register-btn').disabled = false;
    }
  });

  window.onFirebaseAuthChanged = user => {
    const display = document.getElementById('user-display');
    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      display.textContent = name;
      document.getElementById('dropdown-name').textContent = user.email;
      authBtn.classList.add('logged-in');
      window.firebaseService.getUserSkin().then(skinId => {
        const themeName = SKIN_NAMES[skinId];
        if (themeName) applyTheme(themeName);
      }).catch(() => {});
    } else {
      display.textContent = 'Me connecter';
      authBtn.classList.remove('logged-in');
      userDropdown.classList.add('hidden');
    }
  };

  // Service worker (PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  timerBtn.addEventListener('click', () => {
    timerEnabled = !timerEnabled;
    timerBtn.classList.toggle('active', timerEnabled);
    timerBtn.title = timerEnabled ? 'Désactiver le chrono' : 'Activer le chrono';
    document.body.dataset.timer = timerEnabled ? 'on' : 'off';
    if (!timerEnabled) resetTimerGauge();
  });
  document.body.dataset.timer = 'on';

  resetZoom();
}

// ─── ViewBox / Zoom / Pan ─────────────────────────────────────────────────────

function parseViewBox(str) {
  const [x, y, w, h] = str.split(' ').map(Number);
  return { x, y, w, h };
}

function applyViewBox() {
  const svg = mapContainer.querySelector('svg');
  if (svg) svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  updateDevPanel();
}

function updateDevPanel() {
  if (!document.body.classList.contains('dev-mode')) return;
  const baseW  = parseViewBox(VIEWBOXES[level] ?? VIEWBOXES.monde).w;
  const zoomPct = Math.round((baseW / vb.w) * 100);
  document.getElementById('dev-zoom').textContent = zoomPct + ' %';
  document.getElementById('dev-screen').textContent = `${window.innerWidth} × ${window.innerHeight}`;
}

function defaultZoomFactor() {
  if (window.innerWidth <= 500)  return 0.25;  // 400% mobile
  if (window.innerWidth <= 1400) return 0.5;   // 200% tablette
  return level === 'monde' ? 0.5 : 1;          // desktop : 200% monde, 100% autres
}

function resetZoom() {
  const base   = parseViewBox(VIEWBOXES[level] ?? VIEWBOXES.monde);
  const factor = defaultZoomFactor();
  const cx = base.x + base.w / 2;
  const cy = base.y + base.h / 2;
  vb = {
    x: cx - (base.w * factor) / 2,
    y: cy - (base.h * factor) / 2,
    w: base.w * factor,
    h: base.h * factor,
  };
  applyViewBox();
}

function svgPoint(clientX, clientY) {
  const svg = mapContainer.querySelector('svg');
  const pt  = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: svgP.x, y: svgP.y };
}

function setupMapInteraction(svg) {
  // Zoom with mouse wheel
  mapContainer.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
    const m = svgPoint(e.clientX, e.clientY);
    const newW = vb.w * factor;
    const newH = vb.h * factor;
    if (newW < ZOOM_MIN_W) return; // max zoom in
    vb.x = m.x - (m.x - vb.x) * factor;
    vb.y = m.y - (m.y - vb.y) * factor;
    vb.w = newW;
    vb.h = newH;
    applyViewBox();
  }, { passive: false });

  // Pan with drag
  mapContainer.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    mouseDownPos   = { x: e.clientX, y: e.clientY };
    lastDragScreen = { x: e.clientX, y: e.clientY };
    document.body.classList.add('dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const svg = mapContainer.querySelector('svg');
    const ctm = svg.getScreenCTM();
    vb.x -= (e.clientX - lastDragScreen.x) / ctm.a;
    vb.y -= (e.clientY - lastDragScreen.y) / ctm.d;
    lastDragScreen = { x: e.clientX, y: e.clientY };
    applyViewBox();
  });

  window.addEventListener('mouseup', e => {
    if (mouseDownPos && document.body.classList.contains('dev-mode')) {
      const dx = Math.round(e.clientX - mouseDownPos.x);
      const dy = Math.round(e.clientY - mouseDownPos.y);
      const dist = Math.round(Math.hypot(dx, dy));
      const dragged = Math.abs(dx) > 5 || Math.abs(dy) > 5;
      document.getElementById('dev-drag').textContent =
        `dx=${dx} dy=${dy} dist=${dist}px ${dragged ? '→ DRAG' : '→ CLIC'}`;
    }
    isDragging = false;
    lastDragScreen = null;
    document.body.classList.remove('dragging');
  });

  // Double-click to reset zoom
  mapContainer.addEventListener('dblclick', resetZoom);

  // ── Touch: pan (1 doigt) + pinch-zoom (2 doigts) + double-tap reset ──
  mapContainer.addEventListener('touchstart', e => {
    touchMoved = false;
    if (e.touches.length === 1) {
      lastDragScreen = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const now = Date.now();
      if (now - lastTapTime < 300) resetZoom();
      lastTapTime = now;
    } else if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  mapContainer.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && lastDragScreen) {
      const dx = e.touches[0].clientX - lastDragScreen.x;
      const dy = e.touches[0].clientY - lastDragScreen.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        touchMoved = true;
        document.body.classList.add('touch-dragging');
      }
      const ctm = mapContainer.querySelector('svg').getScreenCTM();
      vb.x -= dx / ctm.a;
      vb.y -= dy / ctm.d;
      lastDragScreen = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      applyViewBox();
    } else if (e.touches.length === 2 && lastTouchDist !== null) {
      touchMoved = true;
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = lastTouchDist / newDist;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const m  = svgPoint(cx, cy);
      const newW = vb.w * factor;
      const newH = vb.h * factor;
      if (newW >= ZOOM_MIN_W) {
        vb.x = m.x - (m.x - vb.x) * factor;
        vb.y = m.y - (m.y - vb.y) * factor;
        vb.w = newW;
        vb.h = newH;
        applyViewBox();
      }
      lastTouchDist = newDist;
    }
  }, { passive: false });

  mapContainer.addEventListener('touchend', e => {
    lastTouchDist = null;
    if (e.touches.length === 0) {
      lastDragScreen = null;
    } else if (e.touches.length === 1) {
      lastDragScreen = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    setTimeout(() => {
      touchMoved = false;
      document.body.classList.remove('touch-dragging');
    }, 50);
  });
}

// ─── Timer ───────────────────────────────────────────────────────────────────

function startTimer() {
  stopTimer();
  if (!timerEnabled) return;
  timerStart = performance.now();
  tickTimer();
}

function tickTimer() {
  const elapsed = (performance.now() - timerStart) / 1000;
  const ratio   = Math.max(0, 1 - elapsed / TIME_LIMIT);
  timerFill.style.clipPath = `inset(${(1 - ratio) * 100}% 0 0 0)`;
  if (elapsed >= TIME_LIMIT) { handleTimeout(); return; }
  timerRaf = requestAnimationFrame(tickTimer);
}

function stopTimer() {
  if (timerRaf !== null) { cancelAnimationFrame(timerRaf); timerRaf = null; }
  timerStart = null;
}

function resetTimerGauge() {
  stopTimer();
  timerFill.style.clipPath = 'inset(100% 0 0 0)';
}

function scoreForTime() {
  if (!timerEnabled || timerStart === null) return SCORE_MIN;
  const elapsed  = (performance.now() - timerStart) / 1000;
  const timeLeft = Math.max(0, TIME_LIMIT - elapsed);
  return Math.round(SCORE_MIN + (SCORE_MAX - SCORE_MIN) * (timeLeft / TIME_LIMIT) ** 2);
}

function requeueCurrent() {
  const pos = Math.max(0, queue.length - 2);
  queue.splice(pos, 0, currentCountry);
}

function handleTimeout() {
  if (gameState !== 'playing') return;
  lives--;
  requeueCurrent();
  highlight(currentCountry.id, 'correct');
  document.body.classList.add('wrong-reveal');
  setMessage(`⏱ Temps écoulé — c'était ${currentCountry.nom}`, 'wrong');
  gameState = 'feedback';
  updateUI();
  setTimeout(() => {
    document.body.classList.remove('wrong-reveal');
    unhighlight(currentCountry.id, 'correct');
    resetTimerGauge();
    if (lives <= 0) endGame(false);
    else nextQuestion();
  }, FEEDBACK_DELAY_WRONG);
}

// ─── Mode switching ───────────────────────────────────────────────────────────

function setMode(newMode) {
  mode = newMode;
  document.body.dataset.mode = mode;
  btnGame.classList.toggle('active',  mode === 'game');
  btnLearn.classList.toggle('active', mode === 'learning');

  clearAllHighlights();
  selectedId = null;

  if (mode === 'learning') {
    resetGameIdle();
    applyLevelInactive();
    renderList();
    setQuestionText('Cliquez sur un pays de la liste ou de la carte');
    setMessage('', '');
  } else {
    listBody.innerHTML = '';
    applyLevelInactive();
    setQuestionText('Choisissez un niveau et cliquez sur Démarrer');
    setMessage('', '');
  }
}

// ─── Game mode ────────────────────────────────────────────────────────────────

function getCountriesForLevel() {
  return countries.filter(c => {
    if (!countryPaths[c.id]) return false;
    if (level === 'monde')   return true;
    if (level === 'UE')      return c.is_EU;
    return c.continents.includes(level);
  });
}

function applyLevelInactive() {
  const pool = new Set(getCountriesForLevel().map(c => c.id));
  Object.entries(countryPaths).forEach(([id, paths]) => {
    paths.forEach(p => {
      p.classList.remove('inactive');
      if (!pool.has(id)) p.classList.add('inactive');
    });
  });
}

function startGame() {
  score = 0;
  lives = LIVES_MAX;
  correctCount = 0;
  gameState = 'playing';
  document.body.classList.remove('game-over');
  selectedId = null;
  hideAllCircles();

  const pool = getCountriesForLevel();
  gameStartTime = Date.now();
  gamePoolSize  = pool.length;
  updateCounter();
  queue = shuffle([...pool]);
  activePaths = new Set(pool.map(c => c.id));

  Object.entries(countryPaths).forEach(([id, paths]) => {
    const active = activePaths.has(id);
    paths.forEach(p => {
      p.classList.remove('correct', 'wrong', 'selected', 'inactive');
      if (!active) p.classList.add('inactive');
    });
  });

  document.body.classList.add('game-running');
  updateUI();
  startBtn.textContent = 'Arrêter';
  nextQuestion();
}

function nextQuestion() {
  if (queue.length === 0) { endGame(true); return; }
  currentCountry = queue.pop();
  resetZoom();
  setQuestion(currentCountry.nom, null, 'Cliquez sur :');
  setMessage('', '');
  gameState = 'playing';
  startTimer();
}

function handleGameClick(clickedId) {
  if (gameState !== 'playing') return;
  if (!activePaths.has(clickedId)) return;

  if (clickedId === currentCountry.id) {
    const pts = scoreForTime();
    stopTimer();
    score += pts;
    correctCount++;
    highlight(currentCountry.id, 'correct');
    setMessage(`✓ Bravo, c'est bien ${currentCountry.nom} ! +${pts} pts`, 'correct');
    gameState = 'feedback';
    updateUI();
    updateCounter();
    setTimeout(() => {
      unhighlight(currentCountry.id, 'correct');
      resetTimerGauge();
      nextQuestion();
    }, FEEDBACK_DELAY_CORRECT);
  } else {
    stopTimer();
    lives--;
    requeueCurrent();
    highlight(clickedId, 'wrong');
    highlight(currentCountry.id, 'correct');
    document.body.classList.add('wrong-reveal');
    setMessage(`✗ Non — c'était ${currentCountry.nom}`, 'wrong');
    gameState = 'feedback';
    updateUI();
    setTimeout(() => {
      document.body.classList.remove('wrong-reveal');
      unhighlight(clickedId, 'wrong');
      unhighlight(currentCountry.id, 'correct');
      resetTimerGauge();
      if (lives <= 0) endGame(false);
      else nextQuestion();
    }, FEEDBACK_DELAY_WRONG);
  }
}

function endGame(won) {
  const timeMs = gameStartTime ? Date.now() - gameStartTime : 0;
  gameStartTime = null;

  resetTimerGauge();
  document.body.classList.remove('game-running');
  document.body.classList.add('game-over');
  gameState = 'idle';
  setQuestionText(won ? 'Félicitations !' : 'Game over');
  setMessage('', '');
  clearAllHighlights();
  applyLevelInactive();
  startBtn.textContent = 'Démarrer';

  window.firebaseService?.saveGame({
    levelKey: level, timerEnabled, score, timeMs, won, poolSize: gamePoolSize,
  }).catch(console.error);
}

function resetGameIdle() {
  resetTimerGauge();
  document.body.classList.remove('game-running');
  document.body.classList.remove('game-over');
  gameState = 'idle';
  clearAllHighlights();
  applyLevelInactive();
  startBtn.textContent = 'Démarrer';
  document.getElementById('country-counter').classList.add('hidden');
  updateUI();
}

// ─── Learning mode ────────────────────────────────────────────────────────────

function handleLearningClick(clickedId) {
  const country = countryById[clickedId];
  if (!country) return;

  hideAllCircles();
  if (selectedId) {
    unhighlight(selectedId, 'selected');
    unhighlight(selectedId, 'correct');
  }
  document.body.classList.remove('wrong-reveal');

  if (selectedId === clickedId) {
    selectedId = null;
    setQuestionText('Cliquez sur un pays de la liste ou de la carte');
    deselectListRow();
  } else {
    selectedId = clickedId;
    highlight(clickedId, 'selected');
    setQuestion(country.nom, `Capitale : ${country.capitale}  ·  Population : ${formatPop(country.population)}`);
    selectListRow(clickedId);
  }
}

function centerOnCountry(id) {
  const paths = countryPaths[id];
  let cx, cy;

  if (paths && paths.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paths.forEach(p => {
      try {
        const bb = p.getBBox();
        if (bb.width === 0 && bb.height === 0) return;
        minX = Math.min(minX, bb.x);
        minY = Math.min(minY, bb.y);
        maxX = Math.max(maxX, bb.x + bb.width);
        maxY = Math.max(maxY, bb.y + bb.height);
      } catch (_) {}
    });
    if (isFinite(minX)) {
      cx = (minX + maxX) / 2;
      cy = (minY + maxY) / 2;
    }
  }

  if (cx === undefined) {
    const circle = countryCircles[id];
    if (circle) {
      cx = parseFloat(circle.getAttribute('cx'));
      cy = parseFloat(circle.getAttribute('cy'));
    }
  }

  if (cx === undefined) return;
  vb.x = cx - vb.w / 2;
  vb.y = cy - vb.h / 2;
  applyViewBox();
}

function selectFromList(id) {
  hideAllCircles();
  if (selectedId) {
    unhighlight(selectedId, 'selected');
    unhighlight(selectedId, 'correct');
  }
  document.body.classList.remove('wrong-reveal');

  if (selectedId === id) {
    selectedId = null;
    setQuestionText('Cliquez sur un pays de la liste ou de la carte');
    deselectListRow();
  } else {
    selectedId = id;
    highlight(id, 'correct');
    document.body.classList.add('wrong-reveal');
    setTimeout(() => document.body.classList.remove('wrong-reveal'), FEEDBACK_DELAY_WRONG);
    showCircle(id);
    centerOnCountry(id);
    const country = countryById[id];
    setQuestion(country.nom, `Capitale : ${country.capitale}  ·  Population : ${formatPop(country.population)}`);
    selectListRow(id);
  }
}

// ─── Unified click handler ────────────────────────────────────────────────────

function onPathClick(e) {
  if (isDragging || touchMoved) return;
  if (mouseDownPos) {
    const dx = e.clientX - mouseDownPos.x;
    const dy = e.clientY - mouseDownPos.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return;
  }
  const id = e.currentTarget.dataset.countryId;
  if (mode === 'game') handleGameClick(id);
  else                 handleLearningClick(id);
}

// ─── Small-country markers ────────────────────────────────────────────────────

function drawSmallCountryMarkers(svg) {
  countries.forEach(country => {
    if (country.superficie >= SMALL_KM2) return;
    const paths = countryPaths[country.id];
    if (!paths || paths.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paths.forEach(p => {
      try {
        const bb = p.getBBox();
        if (bb.width === 0 && bb.height === 0) return;
        minX = Math.min(minX, bb.x);
        minY = Math.min(minY, bb.y);
        maxX = Math.max(maxX, bb.x + bb.width);
        maxY = Math.max(maxY, bb.y + bb.height);
      } catch (_) {}
    });
    if (!isFinite(minX)) return;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const r  = Math.max(10, Math.max(maxX - minX, maxY - minY) * 2.5);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r',  String(r));
    circle.classList.add('country', 'small-marker');
    circle.dataset.countryId = country.id;
    circle.addEventListener('click', onPathClick);

    svg.appendChild(circle);
    countryCircles[country.id] = circle;
  });
}

function showCircle(id) {
  const c = countryCircles[id];
  if (c) { c.classList.add('visible'); shownCircleId = id; }
}

function hideCircle(id) {
  const c = countryCircles[id];
  if (c) c.classList.remove('visible');
  if (shownCircleId === id) shownCircleId = null;
}

function hideAllCircles() {
  if (shownCircleId) hideCircle(shownCircleId);
}

// ─── Country list (learning mode) ────────────────────────────────────────────

function renderList() {
  const pool   = getCountriesForLevel();
  const sorted = [...pool].sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 :  1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  listBody.innerHTML = '';
  sorted.forEach((c, i) => {
    const tr = document.createElement('tr');
    tr.dataset.id = c.id;
    if (c.id === selectedId) tr.classList.add('selected');

    const tdNum = document.createElement('td');
    tdNum.textContent = i + 1;
    tdNum.className = 'col-num';

    const tdNom = document.createElement('td');
    tdNom.textContent = c.nom;

    const tdPop = document.createElement('td');
    tdPop.textContent = formatPop(c.population);
    tdPop.style.textAlign = 'right';

    const tdSup = document.createElement('td');
    tdSup.textContent = formatSup(c.superficie);
    tdSup.style.textAlign = 'right';

    tr.append(tdNum, tdNom, tdPop, tdSup);
    tr.addEventListener('click', () => selectFromList(c.id));
    listBody.appendChild(tr);
  });
}

function selectListRow(id) {
  deselectListRow();
  const row = listBody.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    row.classList.add('selected');
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function deselectListRow() {
  listBody.querySelectorAll('tr.selected').forEach(r => r.classList.remove('selected'));
}

function updateSortIndicators() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.toggle('active',
      btn.dataset.col === sortCol && btn.dataset.dir === sortDir
    );
  });
}

// ─── Question display helpers ────────────────────────────────────────────────

function setQuestion(name, details, label) {
  questionEl.innerHTML = '';
  if (label) {
    const s = document.createElement('span');
    s.className = 'q-label';
    s.textContent = label;
    questionEl.appendChild(s);
  }
  if (name) {
    const s = document.createElement('span');
    s.className = 'q-name';
    s.textContent = name;
    questionEl.appendChild(s);
  }
  if (details) {
    const s = document.createElement('span');
    s.className = 'q-details';
    s.textContent = details;
    questionEl.appendChild(s);
  }
}

function setQuestionText(text) {
  questionEl.innerHTML = '';
  questionEl.textContent = text;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function highlight(id, cls) {
  (countryPaths[id] || []).forEach(p => p.classList.add(cls));
  if (cls === 'correct' && countryCircles[id]) countryCircles[id].classList.add('correct-outline');
}

function unhighlight(id, cls) {
  (countryPaths[id] || []).forEach(p => p.classList.remove(cls));
  if (cls === 'correct' && countryCircles[id]) countryCircles[id].classList.remove('correct-outline');
}

function clearAllHighlights() {
  Object.values(countryPaths).flat()
    .forEach(p => p.classList.remove('correct', 'wrong', 'selected', 'inactive'));
  Object.values(countryCircles).forEach(c => c.classList.remove('correct-outline'));
  document.body.classList.remove('wrong-reveal');
  hideAllCircles();
}

function updateUI() {
  scoreEl.textContent = score;
  livesEl.textContent = '♥'.repeat(lives) + '♡'.repeat(Math.max(0, LIVES_MAX - lives));
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className   = type;
}

function formatPop(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace('.', ',') + ' Md';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M';
  return n.toLocaleString('fr-FR');
}

function formatSup(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M km²';
  return n.toLocaleString('fr-FR') + ' km²';
}

// ─── Scores modal ────────────────────────────────────────────────────────────

async function openScoresModal() {
  document.getElementById('scores-overlay').classList.remove('hidden');

  const user = window.firebaseService?.getUser();
  const mineEl = document.getElementById('scores-mine');
  if (user) {
    mineEl.innerHTML = '<p class="scores-msg">Chargement…</p>';
    try {
      renderMyScores(await window.firebaseService.getMyScores());
    } catch(_) {
      mineEl.innerHTML = '<p class="scores-msg">Erreur de chargement.</p>';
    }
  } else {
    mineEl.innerHTML = '<p class="scores-msg">Connectez-vous pour voir vos scores.</p>';
  }

  await loadLeaderboard();
}

async function loadLeaderboard() {
  const levelId = parseInt(document.getElementById('scores-level-select').value);
  const el = document.getElementById('scores-global-content');
  el.innerHTML = '<p class="scores-msg">Chargement…</p>';
  try {
    renderLeaderboard(await window.firebaseService.getLevelLeaderboard(levelId));
  } catch(_) {
    el.innerHTML = '<p class="scores-msg">Erreur de chargement.</p>';
  }
}

function starsStr(n) {
  const s = Math.max(0, Math.min(3, n || 0));
  return '★'.repeat(s) + '☆'.repeat(3 - s);
}

function renderMyScores(docs) {
  const el = document.getElementById('scores-mine');
  if (!docs.length) {
    el.innerHTML = '<p class="scores-msg">Aucune partie enregistrée.</p>';
    return;
  }
  docs.sort((a, b) => a.level_id - b.level_id || a.game_type_id - b.game_type_id);

  const table = document.createElement('table');
  table.className = 'scores-table';
  table.innerHTML = '<thead><tr><th>Niveau</th><th>Mode</th><th>Score</th><th>★</th><th>Date</th></tr></thead>';
  const tbody = document.createElement('tbody');

  docs.forEach(d => {
    const tr = document.createElement('tr');
    [
      LEVEL_NAMES[d.level_id]       || '–',
      GAME_TYPE_NAMES[d.game_type_id] || '–',
      (d.score || 0).toLocaleString('fr-FR'),
      starsStr(d.stars),
      new Date(d.date).toLocaleDateString('fr-FR'),
    ].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  el.innerHTML = '';
  el.appendChild(table);
}

function renderLeaderboard(docs) {
  const el = document.getElementById('scores-global-content');
  if (!docs.length) {
    el.innerHTML = '<p class="scores-msg">Aucun score pour ce niveau.</p>';
    return;
  }
  const myUid = window.firebaseService?.getUser()?.uid;

  const table = document.createElement('table');
  table.className = 'scores-table';
  table.innerHTML = '<thead><tr><th>#</th><th>Joueur</th><th>Score</th><th>★</th><th>Mode</th><th>Date</th></tr></thead>';
  const tbody = document.createElement('tbody');

  docs.forEach((d, i) => {
    const tr = document.createElement('tr');
    if (d.user_id === myUid) tr.classList.add('scores-me');

    [String(i + 1), d.display_name || '—'].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    [
      (d.score || 0).toLocaleString('fr-FR'),
      starsStr(d.stars),
      GAME_TYPE_NAMES[d.game_type_id] || '–',
      new Date(d.date).toLocaleDateString('fr-FR'),
    ].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  el.innerHTML = '';
  el.appendChild(table);
}

function updateCounter() {
  const el = document.getElementById('country-counter');
  el.textContent = `${correctCount} / ${gamePoolSize}`;
  el.classList.remove('hidden');
}

function authErrorMsg(err) {
  switch (err.code) {
    case 'auth/email-already-in-use': return 'Cet email est déjà utilisé.';
    case 'auth/invalid-email':        return 'Email invalide.';
    case 'auth/weak-password':        return 'Mot de passe trop court (min. 6 caractères).';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':   return 'Email ou mot de passe incorrect.';
    default:                          return err.message;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Start ────────────────────────────────────────────────────────────────────

init();
