import { db } from '../firebase.js';
import { doc, setDoc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';

export class GameManager {
  constructor() {
    this.roomCode = '';
    this.dayNumber = 0;
    this.players = {};
    this.actions = {};
    this.state = 'setup'; // local state for host
    this.onActionSubmitted = null;
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async openGame(onPlayerJoin) {
    this.roomCode = this.generateRoomCode();
    await setDoc(doc(db, "rooms", this.roomCode), {
      state: 'lobby',
      dayNumber: 0,
      players: {},
      actions: {},
      events: []
    });

    onSnapshot(doc(db, "rooms", this.roomCode), (snap) => {
      const data = snap.data();
      if (!data) return;
      
      const newPlayers = Object.keys(data.players || {}).length > Object.keys(this.players).length;
      this.players = data.players || {};
      if (newPlayers && onPlayerJoin) {
        onPlayerJoin(this.players);
      }
      
      const incomingActions = data.actions || {};
      if (this.onActionSubmitted && Object.keys(incomingActions).length > Object.keys(this.actions).length) {
         for (const playerId in incomingActions) {
           if (!this.actions[playerId]) {
             this.onActionSubmitted(this.players[playerId]?.role || 'unknown');
           }
         }
      }
      this.actions = incomingActions;
    });

    this.state = 'lobby';
    return this.roomCode;
  }

  async assignRoles(werewolves, doctors, villagers) {
    werewolves = Number(werewolves);
    doctors = Number(doctors);
    villagers = Number(villagers);
    const playerIds = Object.keys(this.players);
    const totalRoles = werewolves + doctors + villagers;
    if (playerIds.length !== totalRoles) {
      throw new Error(`Role count (${totalRoles}) does not match player count (${playerIds.length})`);
    }

    let roles = [];
    for(let i=0; i<werewolves; i++) roles.push('werewolf');
    for(let i=0; i<doctors; i++) roles.push('doctor');
    for(let i=0; i<villagers; i++) roles.push('villager');

    // Shuffle
    roles.sort(() => Math.random() - 0.5);

    playerIds.forEach((id, i) => {
      this.players[id].role = roles[i];
    });

    await updateDoc(doc(db, "rooms", this.roomCode), {
      players: this.players,
      state: 'reveal'
    });
    this.state = 'reveal';
  }

  async startNight() {
    this.dayNumber++;
    await updateDoc(doc(db, "rooms", this.roomCode), {
      state: 'night',
      dayNumber: this.dayNumber,
      actions: {}
    });
    this.actions = {};
    this.state = 'night';
  }

  async endNight() {
    // Resolve actions
    let werewolfTargets = [];
    let doctorTarget = null;

    Object.entries(this.actions).forEach(([playerId, action]) => {
      const player = this.players[playerId];
      if (player && player.role === 'werewolf') {
        werewolfTargets.push(action.target);
      } else if (player && player.role === 'doctor') {
        doctorTarget = action.target;
      }
    });

    let werewolfTarget = null;
    if (werewolfTargets.length > 0) {
       werewolfTarget = werewolfTargets[Math.floor(Math.random() * werewolfTargets.length)];
    }

    const events = [];

    if (doctorTarget) {
      const p = this.players[doctorTarget];
      if (p) events.push(`The <span class="highlight-save">Doctor</span> saved <span class="highlight-save">${p.name}</span>.`);
    }

    if (werewolfTarget) {
      if (werewolfTarget !== doctorTarget) {
        const p = this.players[werewolfTarget];
        if (p) {
          events.push(`<span class="highlight-kill">${p.name}</span> was torn apart by the <span class="highlight-kill">werewolves</span>.`);
          this.players[werewolfTarget].isAlive = false;
        }
      } else {
         // Saved by doctor!
      }
    }

    await updateDoc(doc(db, "rooms", this.roomCode), {
      players: this.players,
      events: events,
      state: 'day'
    });
    this.state = 'day';
  }

  async endDiscussion() {
    await updateDoc(doc(db, "rooms", this.roomCode), {
      state: 'voting',
      actions: {}
    });
    this.actions = {};
    this.state = 'voting';
  }

  async endVoting() {
    // Tally votes
    const votes = {};
    Object.values(this.actions).forEach(action => {
      votes[action.target] = (votes[action.target] || 0) + 1;
    });

    let maxVotes = 0;
    let exiledId = null;
    let tie = false;

    Object.entries(votes).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        exiledId = targetId;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    });

    let resultMsg = '';

    if (tie || !exiledId) {
      resultMsg = 'The town was divided. No one was exiled today.';
    } else {
      const p = this.players[exiledId];
      resultMsg = `<span class="highlight-kill">${p.name}</span> was exiled from the village.`;
      this.players[exiledId].isAlive = false;
    }
    
    await updateDoc(doc(db, "rooms", this.roomCode), {
      players: this.players,
      voteResult: resultMsg,
      state: 'vote_summary'
    });
    this.state = 'vote_summary';
  }

  async checkWinCondition() {
    const alivePlayers = Object.values(this.players).filter(p => p.isAlive);
    const werewolves = alivePlayers.filter(p => p.role === 'werewolf').length;
    const villagersAndDoctors = alivePlayers.length - werewolves;

    if (werewolves === 0) {
       await updateDoc(doc(db, "rooms", this.roomCode), {
         state: 'end',
         winner: 'villager',
         winText: 'All werewolves have been eliminated. The village is safe!'
       });
       return true;
    } else if (werewolves >= villagersAndDoctors) {
       await updateDoc(doc(db, "rooms", this.roomCode), {
         state: 'end',
         winner: 'werewolf',
         winText: 'The werewolves have overrun the village!'
       });
       return true;
    }
    return false;
  }
}
