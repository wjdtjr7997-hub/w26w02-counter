const settings = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

let currentMode = 'pomodoro';
let remainingSeconds = settings[currentMode];
let totalSeconds = settings[currentMode];
let timerId = null;
let isRunning = false;
let soundOn = true;
let sessionCount = Number(localStorage.getItem('pomodoroSessions') || 0);

const timeDisplay = document.querySelector('#timeDisplay');
const statusText = document.querySelector('#statusText');
const startButton = document.querySelector('#startButton');
const resetButton = document.querySelector('#resetButton');
const progressRing = document.querySelector('#progressRing');
const sessionCountDisplay = document.querySelector('#sessionCount');
const soundToggle = document.querySelector('#soundToggle');
const modeTabs = document.querySelectorAll('.mode-tab');
const applySettingsButton = document.querySelector('#applySettings');

const modeLabels = {
  pomodoro: '집중할 시간이에요',
  shortBreak: '잠깐 쉬어가세요',
  longBreak: '충분히 쉬어가세요'
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  document.title = `${formatTime(remainingSeconds)} · 뽀모도로 타이머`;
  const progress = totalSeconds ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  progressRing.style.background = `conic-gradient(var(--primary) ${progress * 360}deg, var(--ring-track) ${progress * 360}deg)`;
  sessionCountDisplay.textContent = sessionCount;
}

function playAlert() {
  if (!soundOn) return;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.5);
}

function finishSession() {
  clearInterval(timerId);
  timerId = null;
  isRunning = false;
  if (currentMode === 'pomodoro') {
    sessionCount += 1;
    localStorage.setItem('pomodoroSessions', sessionCount);
  }
  playAlert();
  startButton.textContent = '다시 시작';
  statusText.textContent = currentMode === 'pomodoro' ? '집중 세션이 끝났어요!' : '휴식이 끝났어요!';
  updateDisplay();
}

function tick() {
  if (remainingSeconds <= 0) {
    finishSession();
    return;
  }
  remainingSeconds -= 1;
  updateDisplay();
}

function toggleTimer() {
  if (isRunning) {
    clearInterval(timerId);
    timerId = null;
    isRunning = false;
    startButton.textContent = '계속하기';
    statusText.textContent = '잠시 멈췄어요';
    return;
  }
  isRunning = true;
  startButton.textContent = '일시정지';
  statusText.textContent = modeLabels[currentMode];
  timerId = setInterval(tick, 1000);
}

function setMode(mode) {
  clearInterval(timerId);
  timerId = null;
  isRunning = false;
  currentMode = mode;
  totalSeconds = settings[mode];
  remainingSeconds = totalSeconds;
  startButton.textContent = '시작';
  statusText.textContent = modeLabels[mode];
  modeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
  updateDisplay();
}

function applySettings() {
  const values = {
    pomodoro: Number(document.querySelector('#pomodoroInput').value),
    shortBreak: Number(document.querySelector('#shortBreakInput').value),
    longBreak: Number(document.querySelector('#longBreakInput').value)
  };
  Object.entries(values).forEach(([mode, minutes]) => {
    if (Number.isFinite(minutes) && minutes >= 1) settings[mode] = Math.min(minutes, 60) * 60;
  });
  setMode(currentMode);
}

startButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', () => setMode(currentMode));
modeTabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
applySettingsButton.addEventListener('click', applySettings);
soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? '🔔' : '🔕';
  soundToggle.setAttribute('aria-label', soundOn ? '알림음 끄기' : '알림음 켜기');
  soundToggle.setAttribute('aria-pressed', String(soundOn));
});

updateDisplay();
