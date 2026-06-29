const sounds = {
  bgm_lobby: new Audio('https://actions.google.com/sounds/v1/ambiences/barn_and_animals.ogg'),
  bgm_day: new Audio('https://actions.google.com/sounds/v1/nature/morning_in_the_village.ogg'),
  bgm_night: new Audio('https://actions.google.com/sounds/v1/horror/ambient_horror_drone.ogg'),
  sfx_click: new Audio('https://actions.google.com/sounds/v1/foley/pen_click.ogg'),
  sfx_tick: new Audio('https://actions.google.com/sounds/v1/alarms/mechanical_clock_tick.ogg'),
  sfx_win: new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_success_fanfare.ogg'),
  sfx_lose: new Audio('https://actions.google.com/sounds/v1/horror/scary_ghost_wail.ogg')
};

// Configure loops and volumes
sounds.bgm_lobby.loop = true;
sounds.bgm_lobby.volume = 0.3;

sounds.bgm_day.loop = true;
sounds.bgm_day.volume = 0.2;

sounds.bgm_night.loop = true;
sounds.bgm_night.volume = 0.4;

sounds.sfx_click.volume = 0.7;
sounds.sfx_tick.volume = 0.3;
sounds.sfx_win.volume = 0.6;
sounds.sfx_lose.volume = 0.6;

let currentBGM = null;
let audioUnlocked = false;

export const audio = {
  init: () => {
    if (audioUnlocked) return;
    // Browsers require a user gesture to play audio.
    // We play and immediately pause an invisible sound to unlock the audio context.
    sounds.sfx_click.play().then(() => {
      sounds.sfx_click.pause();
      sounds.sfx_click.currentTime = 0;
      audioUnlocked = true;
    }).catch(e => console.warn("Audio unlock failed:", e));
  },
  
  playBGM: (trackName) => {
    if (!audioUnlocked) return;
    const nextBGM = sounds[`bgm_${trackName}`];
    
    if (currentBGM === nextBGM) return; // Already playing
    
    // Stop current
    if (currentBGM) {
      currentBGM.pause();
      currentBGM.currentTime = 0;
    }
    
    // Play next
    if (nextBGM) {
      nextBGM.play().catch(e => console.warn("BGM play failed:", e));
      currentBGM = nextBGM;
    } else {
      currentBGM = null;
    }
  },
  
  playSFX: (effectName) => {
    if (!audioUnlocked) return;
    const sfx = sounds[`sfx_${effectName}`];
    if (sfx) {
      // Clone the node so we can play overlapping sounds (like fast clicking)
      const clone = sfx.cloneNode();
      clone.volume = sfx.volume;
      clone.play().catch(e => console.warn("SFX play failed:", e));
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
