const STORAGE_KEY = 'spinly_state_v3';

// High-contrast stealth-tech segment palette
const COLORS = [
  '#00e5ff', // Electric Cyan
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#f43f5e', // Crimson Rose
  '#14b8a6', // Teal
  '#38bdf8'  // Sky Blue
];

const defaultState = {
  options: [],
  history: [],
  sound: true
};

let state = loadState();
let rotation = 0;
let isSpinning = false;
let currentWinnerIndex = null;
let audioCtx = null;

// DOM-Referenzen
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const hintText = document.getElementById('hintText');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const oddsLabel = document.getElementById('oddsLabel');
const countBadge = document.getElementById('countBadge');

const soundToggle = document.getElementById('soundToggle');
const soundIconOn = document.getElementById('soundIconOn');
const soundIconOff = document.getElementById('soundIconOff');
const soundLabel = document.getElementById('soundLabel');

const addForm = document.getElementById('addForm');
const optionInput = document.getElementById('optionInput');
const optionList = document.getElementById('optionList');
const winnerCard = document.getElementById('winnerCard');
const winnerName = document.getElementById('winnerName');
const winnerTime = document.getElementById('winnerTime');
const spinAgainBtn = document.getElementById('spinAgainBtn');
const removeWinnerBtn = document.getElementById('removeWinnerBtn');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// High-DPI Canvas Setup
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const size = 316;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);
}

// Mechanischer Klick-Sound per Web Audio API
function playTick(isWin = false) {
  if (!state.sound) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = isWin ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isWin ? 720 : 480, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isWin ? 1080 : 150, audioCtx.currentTime + (isWin ? 0.2 : 0.035));

    gain.gain.setValueAtTime(isWin ? 0.16 : 0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isWin ? 0.22 : 0.04));

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + (isWin ? 0.22 : 0.04));
  } catch {
    // Audio optional
  }
}

function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function drawWheel() {
  const size = 316;
  const center = size / 2;
  const outerBezel = center - 4;
  const radius = center - 16;
  const count = state.options.length;

  ctx.clearRect(0, 0, size, size);

  // Outer calibrated bezel ring
  ctx.beginPath();
  ctx.arc(center, center, outerBezel, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0d12';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#1e222e';
  ctx.stroke();

  // Calibrated tick marks around bezel
  const ticks = 36;
  for (let t = 0; t < ticks; t++) {
    const angle = (t * Math.PI * 2) / ticks;
    const isMajor = t % 3 === 0;
    const r1 = outerBezel - 2;
    const r2 = outerBezel - (isMajor ? 8 : 5);
    ctx.beginPath();
    ctx.moveTo(center + Math.cos(angle) * r1, center + Math.sin(angle) * r1);
    ctx.lineTo(center + Math.cos(angle) * r2, center + Math.sin(angle) * r2);
    ctx.lineWidth = isMajor ? 1.5 : 1;
    ctx.strokeStyle = isMajor ? '#384156' : '#1e222e';
    ctx.stroke();
  }

  if (count === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f1117';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e222e';
    ctx.stroke();

    ctx.fillStyle = '#7c8496';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('POOL EMPTY', center, center - 54);
    return;
  }

  const sliceAngle = (Math.PI * 2) / count;

  state.options.forEach((label, i) => {
    const startAngle = rotation + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    // Segment
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();

    // Crisp dark divider
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#08090c';
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06080a';
    ctx.font = '700 13px "Inter", -apple-system, BlinkMacSystemFont, sans-serif';

    const maxChars = count > 8 ? 9 : 13;
    const displayText = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
    ctx.fillText(displayText, radius - 14, 4.5);
    ctx.restore();
  });

  // Inner ring around center hub
  ctx.beginPath();
  ctx.arc(center, center, 38, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#08090c';
  ctx.stroke();
}

// Berechnet das Segment unter dem Zeiger (12 Uhr = 1.5 * PI)
function getPointerIndex(currentRotation) {
  const count = state.options.length;
  if (count === 0) return -1;
  const sliceAngle = (Math.PI * 2) / count;
  const pointerAngle = Math.PI * 1.5;
  const normalized = (((pointerAngle - currentRotation) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(normalized / sliceAngle) % count;
}

function spin() {
  if (isSpinning || state.options.length < 2) return;

  isSpinning = true;
  spinBtn.disabled = true;
  winnerCard.classList.add('hidden');
  statusDot.classList.remove('standby');
  statusDot.classList.add('spinning');
  statusText.textContent = 'EXECUTING // SPINNING';
  hintText.textContent = 'Calculating random vector...';

  const startRotation = rotation;
  const extraSpins = (5 + Math.random() * 4) * Math.PI * 2;
  const targetRotation = startRotation + extraSpins;
  const duration = 3400 + Math.random() * 800;
  const startTime = performance.now();
  let lastIndex = getPointerIndex(rotation);

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Quartic Ease-Out
    const easeOut = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (targetRotation - startRotation) * easeOut;

    const currentIndex = getPointerIndex(rotation);
    if (currentIndex !== lastIndex) {
      playTick(false);
      vibrate(8);
      lastIndex = currentIndex;
    }

    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin();
    }
  }

  requestAnimationFrame(animate);
}

function finishSpin() {
  isSpinning = false;
  spinBtn.disabled = state.options.length < 2;
  statusDot.classList.remove('spinning');
  currentWinnerIndex = getPointerIndex(rotation);
  const chosen = state.options[currentWinnerIndex];

  playTick(true);
  vibrate([35, 45, 75]);

  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  winnerName.textContent = chosen;
  winnerTime.textContent = time;
  winnerCard.classList.remove('hidden');

  statusText.textContent = `LOCKED // ${chosen.toUpperCase()}`;
  hintText.textContent = 'Tap wheel or press SPIN to execute';

  state.history.unshift({ name: chosen, time });
  state.history = state.history.slice(0, 5);
  saveState();
  renderHistory();
}

function renderOptions() {
  optionList.innerHTML = '';
  const count = state.options.length;
  const canSpin = count >= 2;

  countBadge.textContent = `${String(count).padStart(2, '0')} ITEMS`;
  oddsLabel.textContent = count > 0 ? `${(100 / count).toFixed(1)}% / SLOT` : '0.0% / SLOT';
  clearAllBtn.classList.toggle('hidden', count === 0);

  if (!isSpinning) {
    statusDot.classList.toggle('standby', !canSpin);
    statusText.textContent = canSpin
      ? `READY // ${count} OPTIONS`
      : 'STANDBY // ADD OPTIONS';
  }

  if (count === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'NO OPTIONS IN POOL — ADD ITEMS ABOVE';
    optionList.appendChild(empty);
  } else {
    state.options.forEach((opt, index) => {
      const li = document.createElement('li');
      li.className = 'option-item';

      const left = document.createElement('div');
      left.className = 'option-left';

      const bar = document.createElement('span');
      bar.className = 'color-bar';
      bar.style.background = COLORS[index % COLORS.length];

      const idx = document.createElement('span');
      idx.className = 'option-index';
      idx.textContent = String(index + 1).padStart(2, '0');

      const span = document.createElement('span');
      span.textContent = opt;

      left.append(bar, idx, span);

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.type = 'button';
      delBtn.textContent = '×';
      delBtn.setAttribute('aria-label', `${opt} entfernen`);
      delBtn.addEventListener('click', () => {
        if (isSpinning) return;
        state.options.splice(index, 1);
        saveState();
        updateUI();
      });

      li.append(left, delBtn);
      optionList.appendChild(li);
    });
  }

  spinBtn.disabled = !canSpin || isSpinning;
  hintText.textContent = canSpin
    ? 'Tap wheel or press SPIN to execute'
    : 'Add at least 2 options to enable wheel';
}

function renderHistory() {
  if (state.history.length === 0) {
    historySection.classList.add('hidden');
    return;
  }
  historySection.classList.remove('hidden');
  historyList.innerHTML = '';
  state.history.forEach((entry) => {
    const li = document.createElement('li');
    const nameSpan = document.createElement('strong');
    nameSpan.style.color = 'var(--text)';
    nameSpan.textContent = entry.name;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'history-time';
    timeSpan.textContent = entry.time;

    li.append(nameSpan, timeSpan);
    historyList.appendChild(li);
  });
}

function updateUI() {
  if (state.sound) {
    soundIconOn.classList.remove('hidden');
    soundIconOff.classList.add('hidden');
    soundLabel.textContent = 'SFX ON';
    soundToggle.classList.remove('muted');
  } else {
    soundIconOn.classList.add('hidden');
    soundIconOff.classList.remove('hidden');
    soundLabel.textContent = 'SFX OFF';
    soundToggle.classList.add('muted');
  }

  renderOptions();
  renderHistory();
  drawWheel();
}

// Event-Listener
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isSpinning) return;
  const val = optionInput.value.trim();
  if (!val) return;
  state.options.push(val);
  optionInput.value = '';
  winnerCard.classList.add('hidden');
  saveState();
  updateUI();
});

spinBtn.addEventListener('click', spin);
canvas.addEventListener('click', spin);
spinAgainBtn.addEventListener('click', spin);

removeWinnerBtn.addEventListener('click', () => {
  if (isSpinning || currentWinnerIndex === null) return;
  state.options.splice(currentWinnerIndex, 1);
  currentWinnerIndex = null;
  winnerCard.classList.add('hidden');
  saveState();
  updateUI();
});

soundToggle.addEventListener('click', () => {
  state.sound = !state.sound;
  saveState();
  updateUI();
});

clearAllBtn.addEventListener('click', () => {
  if (isSpinning) return;
  state.options = [];
  winnerCard.classList.add('hidden');
  saveState();
  updateUI();
});

clearHistoryBtn.addEventListener('click', () => {
  state.history = [];
  saveState();
  renderHistory();
});

// Service Worker registrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

setupCanvas();
updateUI();
