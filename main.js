import './style.css';
import { db, auth } from './firebase.js';
import { doc, collection, onSnapshot, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { views } from './src/views.js';

const appDiv = document.getElementById('app');

// Local client state
let roomCode = sessionStorage.getItem('ww_roomCode') || '';
let playerId = sessionStorage.getItem('ww_playerId') || '';
let currentRole = '';
let isAlive = true;

// Shared Game State
let gameState = {
  state: 'lobby',
  players: {},
  actions: {}
};

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

let roomUnsub = null;
let playersUnsub = null;
let privateUnsub = null;
let werewolfUnsub = null;
let deadUnsub = null;

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
      try {
        await signInAnonymously(auth);
        playerId = auth.currentUser.uid;
        sessionStorage.setItem('ww_playerId', playerId);
        
        const rRef = doc(db, "rooms", roomCode, "players", playerId);
        await setDoc(rRef, {
          name, isAlive: true
        }, { merge: true });

        const privRef = doc(db, "rooms", roomCode, "private", playerId);
        await setDoc(privRef, {
          role: 'unassigned', target: null
        }, { merge: true });

        listenToRoom();
      } catch (err) {
        console.error("Auth error:", err);
      }
    }
  };
}

function listenToRoom() {
  if (roomUnsub) roomUnsub();
  if (playersUnsub) playersUnsub();
  if (privateUnsub) privateUnsub();

  // 1. Listen to public room state
  roomUnsub = onSnapshot(doc(db, "rooms", roomCode), (snap) => {
    const data = snap.data();
    if (data) {
      Object.assign(gameState, data);
      handleState(gameState);
    }
  });

  // 2. Listen to public players list
  playersUnsub = onSnapshot(collection(db, "rooms", roomCode, "players"), (snap) => {
    gameState.players = {};
    snap.forEach(docSnap => {
      gameState.players[docSnap.id] = docSnap.data();
    });
    if (gameState.players[playerId]) {
      isAlive = gameState.players[playerId].isAlive;
    }
    handleState(gameState);
  });

  // 3. Listen to our own private data
  privateUnsub = onSnapshot(doc(db, "rooms", roomCode, "private", playerId), (snap) => {
    const data = snap.data();
    if (data) {
      currentRole = data.role;
      gameState.privateData = data;
      
      // Werewolf Vision Sync
      if (currentRole === 'werewolf' && !werewolfUnsub) {
        werewolfUnsub = onSnapshot(doc(db, "rooms", roomCode, "werewolfData", "actions"), (wSnap) => {
          const wData = wSnap.data();
          if (wData) {
            gameState.actions = { ...gameState.actions, ...wData };
          }
          handleState(gameState);
        });
      }
    }
    handleState(gameState);
  });
}

let lastState = '';
let hasActed = false;

function handleState(data) {
  if (data.state !== lastState) {
     hasActed = false;
  }

  // Handle Dead Spectator Vision Sync
  if (!isAlive && !deadUnsub && data.state !== 'lobby') {
    deadUnsub = onSnapshot(collection(db, "rooms", roomCode, "private"), (pSnap) => {
      pSnap.forEach(pDoc => {
        if (gameState.players[pDoc.id]) {
          gameState.players[pDoc.id].role = pDoc.data().role;
        }
        if (pDoc.data().target) {
          gameState.actions[pDoc.id] = { target: pDoc.data().target };
        }
      });
      // Force a re-render of the dead spectator view
      if (data.state !== 'end') {
        const playersArr = Object.entries(gameState.players || {}).map(([id, p]) => ({id, ...p}));
        render(views.deadSpectator(playersArr, gameState.actions), 'theme-day');
      }
    });
  }

  lastState = data.state;

  if (data.state === 'lobby') {
    render(views.waiting());
  } 
  else if (data.state === 'reveal') {
    render(views.reveal(currentRole), `theme-${currentRole}`);
  } 
  else if (!isAlive && data.state !== 'end') {
    const playersArr = Object.entries(gameState.players || {}).map(([id, p]) => ({id, ...p}));
    render(views.deadSpectator(playersArr, gameState.actions), 'theme-day');
  }
  else if (data.state === 'night') {
    if (hasActed) {
      render(views.actionWaiting(), `theme-${currentRole}`);
      return;
    }

    const playersArr = Object.entries(gameState.players || {}).map(([id, p]) => ({id, ...p}));
    if (currentRole === 'werewolf') {
      render(views.nightWerewolf(playersArr, playerId, gameState.actions), 'theme-werewolf');
      attachDropdown((targetId) => submitAction(targetId));
    } else if (currentRole === 'minion') {
      const wolfIds = gameState.privateData?.werewolves || [];
      const wolfNames = wolfIds.map(id => gameState.players[id]?.name || 'Unknown Wolf');
      render(views.nightMinion(wolfNames), 'theme-minion');
    } else if (currentRole === 'doctor') {
      render(views.nightDoctor(playersArr, playerId), 'theme-doctor');
      attachDropdown((targetId) => submitAction(targetId));
    } else if (currentRole === 'seer') {
      if (gameState.privateData?.seerResult) {
        const resultPlayerName = gameState.players[gameState.privateData.seerResult.id]?.name || 'Unknown';
        render(views.nightSeerResult(resultPlayerName, gameState.privateData.seerResult.role), 'theme-seer');
      } else if (hasActed) {
        render(views.actionWaiting(), 'theme-seer');
      } else {
        render(views.nightSeer(playersArr, playerId), 'theme-seer');
        attachDropdown((targetId) => submitAction(targetId));
      }
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

    const playersArr = Object.entries(gameState.players || {}).map(([id, p]) => ({id, ...p}));
    render(views.voting(playersArr, playerId), 'theme-day');
    attachDropdown((targetId) => submitAction(targetId));
  }
  else if (data.state === 'vote_summary') {
    render(views.voteSummary(data.voteResult || ''), 'theme-day');
  }
  else if (data.state === 'end') {
    render(views.end(data.winner, data.winText), `theme-${data.winner}`);
  }
}

function submitAction(targetId) {
  hasActed = true;
  if (lastState === 'night') render(views.actionWaiting(), `theme-${currentRole}`);
  if (lastState === 'voting') render(views.actionWaiting(), 'theme-day');

  const privRef = doc(db, "rooms", roomCode, "private", playerId);
  setDoc(privRef, {
    target: targetId
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
// We can't immediately re-listen if they refresh without auth syncing.
// Firebase auth syncs asynchronously.
auth.onAuthStateChanged((user) => {
  if (user && roomCode && playerId === user.uid) {
    listenToRoom();
  } else {
    showLogin();
  }
});
