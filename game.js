// ─── Constants ───────────────────────────────────────────────────────────────

const LIVES_MAX              = 3;
const POINTS_CORRECT         = 100;
const FEEDBACK_DELAY_CORRECT = 700;
const FEEDBACK_DELAY_WRONG   = 1400;

const VIEWBOXES = {
  monde:    '0 0 2000 857',
  Europe:   '800 60 520 240',
  Afrique:  '780 195 590 510',
  Asie:     '1100 50 750 440',
  Amérique: '0 30 930 800',
  Océanie:  '1470 340 540 360',
};

const SMALL_KM2 = 2000; // seuil pour afficher un cercle marqueur

// Maps SVG class="..." names (multi-polygon countries) to ISO codes.
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
  // Territories → parent or own ISO (inactive in game, present visually)
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

// ─── State ───────────────────────────────────────────────────────────────────

let countries    = [];
let countryPaths = {};   // ISO → SVGPathElement[]
let countryById  = {};   // ISO → country object

let mode         = 'game';      // 'game' | 'learning'
let level        = 'monde';     // continent name or 'monde'

// Game state
let gameState    = 'idle';
let score        = 0;
let lives        = 0;
let currentCountry = null;
let queue        = [];
let activePaths  = new Set();

// Learning state
let selectedId   = null;        // currently highlighted country in learning mode
let sortCol      = 'nom';
let sortDir      = 'asc';

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

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const [countriesData, svgText] = await Promise.all([
    fetch('countries.json').then(r => r.json()),
    fetch('world.svg').then(r => r.text()),
  ]);

  countries   = countriesData;
  countryById = Object.fromEntries(countries.map(c => [c.id, c]));

  mapContainer.innerHTML = svgText;
  const svg = mapContainer.querySelector('svg');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('viewBox', VIEWBOXES[level]);

  function registerPath(path, id) {
    if (!countryPaths[id]) countryPaths[id] = [];
    countryPaths[id].push(path);
    path.classList.add('country');
    path.dataset.countryId = id;
    path.addEventListener('click', onPathClick);
  }

  // Format 1: <path id="XX">
  svg.querySelectorAll('path[id]').forEach(path => {
    const id = path.getAttribute('id');
    if (/^[A-Z]{2}$/.test(id)) registerPath(path, id);
  });

  // Format 2: <path class="Country Name"> (multi-polygon)
  svg.querySelectorAll('path[class]').forEach(path => {
    const cls = path.getAttribute('class');
    const id  = CLASS_TO_ISO[cls];
    if (id) registerPath(path, id);
  });

  drawSmallCountryMarkers(svg);

  // Event listeners
  btnGame.addEventListener('click',  () => setMode('game'));
  btnLearn.addEventListener('click', () => setMode('learning'));
  startBtn.addEventListener('click', startGame);

  levelSelect.addEventListener('change', e => {
    level = e.target.value;
    updateMapView();
    if (mode === 'learning') renderList();
    if (gameState !== 'idle') resetGameIdle();
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.col;
      const dir = btn.dataset.dir;
      sortCol = col;
      sortDir = dir;
      updateSortIndicators();
      renderList();
    });
  });

  updateMapView();
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
    renderList();
    questionEl.textContent = 'Cliquez sur un pays de la liste ou de la carte';
    setMessage('', '');
  } else {
    listBody.innerHTML = '';
    questionEl.textContent = 'Choisissez un niveau et cliquez sur Démarrer';
    setMessage('', '');
  }
}

// ─── Game mode ────────────────────────────────────────────────────────────────

function getCountriesForLevel() {
  return countries.filter(c => {
    if (!countryPaths[c.id]) return false;
    if (level === 'monde') return true;
    return c.continent === level;
  });
}

function startGame() {
  score = 0;
  lives = LIVES_MAX;
  gameState = 'playing';
  selectedId = null;

  const pool = getCountriesForLevel();
  queue = shuffle([...pool]);
  activePaths = new Set(pool.map(c => c.id));

  Object.entries(countryPaths).forEach(([id, paths]) => {
    const active = activePaths.has(id);
    paths.forEach(p => {
      p.classList.remove('correct', 'wrong', 'selected', 'inactive');
      if (!active) p.classList.add('inactive');
    });
  });

  updateUI();
  startBtn.textContent = 'Recommencer';
  nextQuestion();
}

function nextQuestion() {
  if (queue.length === 0) { endGame(true); return; }
  currentCountry = queue.pop();
  questionEl.textContent = `Cliquez sur : ${currentCountry.nom}`;
  setMessage('', '');
  gameState = 'playing';
}

function handleGameClick(clickedId) {
  if (gameState !== 'playing') return;
  if (!activePaths.has(clickedId)) return;

  if (clickedId === currentCountry.id) {
    score += POINTS_CORRECT;
    highlight(currentCountry.id, 'correct');
    setMessage(`✓ Bravo, c'est bien ${currentCountry.nom} !`, 'correct');
    gameState = 'feedback';
    setTimeout(() => {
      unhighlight(currentCountry.id, 'correct');
      updateUI();
      nextQuestion();
    }, FEEDBACK_DELAY_CORRECT);
  } else {
    lives--;
    highlight(clickedId, 'wrong');
    highlight(currentCountry.id, 'correct');
    setMessage(`✗ Non — c'était ${currentCountry.nom}`, 'wrong');
    gameState = 'feedback';
    setTimeout(() => {
      unhighlight(clickedId, 'wrong');
      unhighlight(currentCountry.id, 'correct');
      updateUI();
      if (lives <= 0) endGame(false);
      else nextQuestion();
    }, FEEDBACK_DELAY_WRONG);
  }
}

function endGame(won) {
  gameState = 'idle';
  questionEl.textContent = won
    ? `Félicitations ! Tous les pays trouvés — ${score} pts !`
    : `Game over ! Score final : ${score} pts`;
  setMessage('', '');
  clearAllHighlights();
}

function resetGameIdle() {
  gameState = 'idle';
  clearAllHighlights();
  startBtn.textContent = 'Démarrer';
  updateUI();
}

// ─── Learning mode ────────────────────────────────────────────────────────────

function handleLearningClick(clickedId) {
  const country = countryById[clickedId];
  if (!country) return;

  // Deselect previous
  if (selectedId) unhighlight(selectedId, 'selected');

  if (selectedId === clickedId) {
    // Toggle off
    selectedId = null;
    questionEl.textContent = 'Cliquez sur un pays de la liste ou de la carte';
    deselectListRow();
  } else {
    selectedId = clickedId;
    highlight(clickedId, 'selected');
    questionEl.textContent =
      `${country.nom}  ·  Capitale : ${country.capitale}  ·  Population : ${formatPop(country.population)}`;
    selectListRow(clickedId);
  }
}

function selectFromList(id) {
  if (selectedId) unhighlight(selectedId, 'selected');

  if (selectedId === id) {
    selectedId = null;
    questionEl.textContent = 'Cliquez sur un pays de la liste ou de la carte';
    deselectListRow();
  } else {
    selectedId = id;
    highlight(id, 'selected');
    const country = countryById[id];
    questionEl.textContent =
      `${country.nom}  ·  Capitale : ${country.capitale}  ·  Population : ${formatPop(country.population)}`;
    selectListRow(id);
  }
}

// ─── Unified click handler ────────────────────────────────────────────────────

function onPathClick(e) {
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

    // Combined bounding box of all paths for this country
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
    const pathSize = Math.max(maxX - minX, maxY - minY);
    const r = Math.max(10, pathSize * 2.5);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r',  String(r));
    circle.classList.add('country');
    circle.dataset.countryId = country.id;
    circle.addEventListener('click', onPathClick);

    svg.appendChild(circle);
    countryPaths[country.id].push(circle);
  });
}

// ─── Country list (learning mode) ────────────────────────────────────────────

function renderList() {
  const pool = getCountriesForLevel();

  const sorted = [...pool].sort((a, b) => {
    let va = a[sortCol];
    let vb = b[sortCol];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 :  1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  listBody.innerHTML = '';
  sorted.forEach(c => {
    const tr = document.createElement('tr');
    tr.dataset.id = c.id;
    if (c.id === selectedId) tr.classList.add('selected');

    const tdNom = document.createElement('td');
    tdNom.textContent = c.nom;

    const tdPop = document.createElement('td');
    tdPop.textContent = formatPop(c.population);
    tdPop.style.textAlign = 'right';

    const tdSup = document.createElement('td');
    tdSup.textContent = formatSup(c.superficie);
    tdSup.style.textAlign = 'right';

    tr.append(tdNom, tdPop, tdSup);
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function highlight(id, cls) {
  (countryPaths[id] || []).forEach(p => p.classList.add(cls));
}

function unhighlight(id, cls) {
  (countryPaths[id] || []).forEach(p => p.classList.remove(cls));
}

function clearAllHighlights() {
  Object.values(countryPaths).flat()
    .forEach(p => p.classList.remove('correct', 'wrong', 'selected', 'inactive'));
}

function updateMapView() {
  const svg = mapContainer.querySelector('svg');
  if (svg) svg.setAttribute('viewBox', VIEWBOXES[level] ?? VIEWBOXES.monde);
}

function updateUI() {
  scoreEl.textContent = `${score} pts`;
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

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Start ────────────────────────────────────────────────────────────────────

init();
