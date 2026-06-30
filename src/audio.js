// BGM uses HTML Audio mapped to local files downloaded to public/audio/
const bgm = {
  lobby: new Audio('/audio/lobby.mp3'),
  day: new Audio('/audio/day.mp3'),
  night: new Audio('/audio/night.mp3'),
};

Object.values(bgm).forEach(audio => {
  audio.loop = true;
  audio.volume = 0.2;
});
bgm.night.volume = 0.3; // Night a bit louder

let currentBGM = null;
let audioUnlocked = false;
let pendingBGM = null;

// SFX uses Web Audio API for instantaneous, reliable sounds without external files
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export const audio = {
  init: () => {
    if (audioUnlocked) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Play a silent tone to unlock AudioContext on iOS/Safari
    const osc = audioCtx.createOscillator();
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.01);
    
    audioUnlocked = true;
    
    if (pendingBGM) {
      audio.playBGM(pendingBGM);
      pendingBGM = null;
    }
  },
  
  playBGM: (trackName) => {
    if (!audioUnlocked) {
      pendingBGM = trackName;
      return;
    }
    const nextBGM = bgm[trackName];
    
    if (currentBGM === nextBGM) return; // Already playing
    
    if (currentBGM) {
      currentBGM.pause();
      currentBGM.currentTime = 0;
    }
    
    if (nextBGM) {
      nextBGM.play().catch(e => console.warn("BGM play failed:", e));
      currentBGM = nextBGM;
    } else {
      currentBGM = null;
    }
  },
  
  playSFX: (effectName) => {
    if (!audioUnlocked && audioCtx.state === 'suspended') audioCtx.resume();
    
    if (effectName === 'click') {
      playTone(800, 'sine', 0.05, 0.4);
    } 
    else if (effectName === 'tick') {
      playTone(1200, 'square', 0.02, 0.1);
    } 
    else if (effectName === 'win') {
      setTimeout(() => playTone(440, 'sine', 0.2, 0.5), 0);
      setTimeout(() => playTone(554, 'sine', 0.2, 0.5), 150);
      setTimeout(() => playTone(659, 'sine', 0.4, 0.5), 300);
    } 
    else if (effectName === 'lose') {
      setTimeout(() => playTone(300, 'sawtooth', 0.4, 0.5), 0);
      setTimeout(() => playTone(280, 'sawtooth', 0.4, 0.5), 300);
      setTimeout(() => playTone(250, 'sawtooth', 0.8, 0.5), 600);
    }
  },
  
  stopAll: () => {
    if (currentBGM) {
      currentBGM.pause();
      currentBGM.currentTime = 0;
      currentBGM = null;
    }
  }
};
