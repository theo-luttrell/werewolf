import './style.css';
import { db } from './firebase.js';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { views } from './src/views.js';

const appDiv = document.getElementById('app');

// Local client state
let roomCode = sessionStorage.getItem('ww_roomCode') || '';
let playerId = sessionStorage.getItem('ww_playerId') || '';
let currentRole = '';
let isAlive = true;

// Utility to generate a simple ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Rendering utility
function render(html, theme = '') {
  appDiv.innerHTML = html;
  document.body.className = theme;
}

// Attach event listeners for dropdowns
function attachDropdown(onSelect) {
  const trigger = document.getElementById('dropdownTrigger');
  const optionsMenu = document.getElementById('dropdownOptions');
  const selectedValue = document.getElementById('selectedValue');
  const submitBtn = document.getElementById('nightSubmit');
  let selectedId = null;

  if (!trigger) return;

  trigger.onclick = (e) => {
    e.stopPropagation();
    trigger.classList.toggle('open');
    optionsMenu.classList.toggle('show');
  };

  document.querySelectorAll('.option-item.targetable').forEach(item => {
    item.onclick = (e) => {
      e.stopPropagation();
      selectedId = item.dataset.id;
      selectedValue.innerText = item.querySelector('span').innerText;
      selectedValue.style.color = '#ffffff';
      selectedValue.style.fontWeight = 'bold';
      trigger.classList.remove('open');
      optionsMenu.classList.remove('show');
      submitBtn.style.display = 'inline-block';
    };
  });

  document.addEventListener('click', () => {
    trigger.classList.remove('open');
    optionsMenu.classList.remove('show');
  });

  submitBtn.onclick = () => {
    if (selectedId) onSelect(selectedId);
    submitBtn.innerText = "Submitted";
    submitBtn.disabled = true;
  };
}

// ----------------- State Machine -----------------

let roomRef = null;
let unsubscribe = null;

function joinRoom(code) {
  roomCode = code.toUpperCase();
  sessionStorage.setItem('ww_roomCode', roomCode);
  showNickname();
}

function showLogin() {
  render(views.login());
  const inputs = Array.from(document.querySelectorAll('.pin-box'));
  inputs.forEach((box, i) => {
    box.addEventListener('input', () => {
      if (box.value.length === 1 && i < inputs.length - 1) inputs[i+1].focus();
      if (inputs.every(b => b.value.length === 1)) {
        joinRoom(inputs.map(b => b.value).join(''));
      }
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && box.value.length === 0 && i > 0) {
        inputs[i-1].focus();
      }
    });
  });
}

function showNickname() {
  render(views.nickname());
  const btn = document.getElementById('nicknameSubmit');
  const input = document.getElementById('nicknameInput');
  btn.onclick = async () => {
    const name = input.value.trim();
    if (name) {
      playerId = generateId();
      sessionStorage.setItem('ww_playerId', playerId);
      
      const rRef = doc(db, "rooms", roomCode);
      await setDoc(rRef, {
        players: {
          [playerId]: { name, isAlive: true, role: 'unassigned' }
        }
      }, { merge: true });
      listenToRoom();
    }
  };
}

function listenToRoom() {
  if (unsubscribe) unsubscribe();
  roomRef = doc(db, "rooms", roomCode);
  unsubscribe = onSnapshot(roomRef, (snapshot) => {
    const data = snapshot.data();
    if (!data) return;

    const me = data.players && data.players[playerId];
    if (me) {
      currentRole = me.role;
      isAlive = me.isAlive;
    }

    handleState(data);
  });
}

let lastState = '';
let hasActed = false;

function handleState(data) {
  if (data.state !== lastState) {
     hasActed = false;
  }

  if (data.state === lastState && data.state !== 'day' && data.state !== 'discussion' && data.state !== 'voting') {
     // day/discussion/voting might have data updates like events or timer
     // but we can optimize later.
  }
  lastState = data.state;

  if (data.state === 'lobby') {
    render(views.waiting());
  } 
  else if (data.state === 'reveal') {
    render(views.reveal(currentRole), `theme-${currentRole}`);
  } 
  else if (data.state === 'night') {
    if (hasActed) {
      render(views.actionWaiting(), `theme-${currentRole}`);
      return;
    }

    const playersArr = Object.entries(data.players || {}).map(([id, p]) => ({id, ...p}));
    if (currentRole === 'werewolf') {
      render(views.nightWerewolf(playersArr), 'theme-werewolf');
      attachDropdown((targetId) => submitAction(targetId));
    } else if (currentRole === 'doctor') {
      render(views.nightDoctor(playersArr), 'theme-doctor');
      attachDropdown((targetId) => submitAction(targetId));
    } else {
      render(views.nightVillager(), 'theme-villager');
    }
  }
  else if (data.state === 'day') {
    render(views.day(data.events || []), 'theme-day');
  }
  else if (data.state === 'discussion') {
    render(views.discussion(), 'theme-day');
    startTimer(data.timer || 60);
  }
  else if (data.state === 'voting') {
    if (hasActed) {
      render(views.actionWaiting(), 'theme-day');
      return;
    }

    const playersArr = Object.entries(data.players || {}).map(([id, p]) => ({id, ...p}));
    render(views.voting(playersArr), 'theme-day');
    attachDropdown((targetId) => submitAction(targetId));
  }
  else if (data.state === 'vote_summary') {
    render(views.voteSummary(data.voteResult || ''), 'theme-day');
  }
  else if (data.state === 'end') {
    render(views.end(data.winner, data.winText), `theme-${data.winner}`); // theme maps to werewolf or villager
  }
}

function submitAction(targetId) {
  hasActed = true;
  if (lastState === 'night') render(views.actionWaiting(), `theme-${currentRole}`);
  if (lastState === 'voting') render(views.actionWaiting(), 'theme-day');

  const rRef = doc(db, "rooms", roomCode);
  setDoc(rRef, {
    actions: {
      [playerId]: { target: targetId }
    }
  }, { merge: true });
}

let timerInterval;
function startTimer(duration) {
  let timeLeft = duration;
  const display = document.getElementById('countdownDisplay');
  const circle = document.getElementById('progressCircle');
  if (!display || !circle) return;

  const CIRCUMFERENCE = 2 * Math.PI * 72; 
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    display.innerText = `${minutes}:${seconds}`;

    const offset = CIRCUMFERENCE - (timeLeft / duration) * CIRCUMFERENCE;
    circle.style.strokeDashoffset = offset;

    if (timeLeft <= 10 && timeLeft > 5) {
      display.classList.add('warning');
      circle.classList.add('warning');
    } else if (timeLeft <= 5) {
      display.classList.remove('warning');
      circle.classList.remove('warning');
      display.classList.add('critical', 'pulse-critical');
      circle.classList.add('critical');
    }

    if (timeLeft === 0) {
      clearInterval(timerInterval);
      display.classList.remove('pulse-critical');
      display.innerText = "Time's Up!";
      display.style.fontSize = "24px";
    } else {
      timeLeft--;
    }
  }, 1000);
}

// Entry
if (roomCode && playerId) {
  listenToRoom();
} else {
  showLogin();
}
