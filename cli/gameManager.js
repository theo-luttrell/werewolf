import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf-8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}
const db = getFirestore();

export class GameManager {
  constructor() {
    this.roomCode = null;
    this.players = {}; // stores public {name, isAlive} + private {role}
    this.actions = {}; // mapped by playerId -> {target}
    this.state = 'setup'; 
    this.onActionSubmitted = null;
  }

  generateRoomCode() {
    this.roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    return this.roomCode;
  }

  async openGame(onPlayerJoin) {
    this.generateRoomCode();
    await db.collection("rooms").doc(this.roomCode).set({
      state: 'lobby',
      createdAt: FieldValue.serverTimestamp()
    });

    // Listen to players subcollection
    db.collection("rooms").doc(this.roomCode).collection("players").onSnapshot((snap) => {
      let newJoin = false;
      snap.forEach(docSnap => {
        if (!this.players[docSnap.id]) {
          this.players[docSnap.id] = docSnap.data();
          newJoin = true;
        } else {
          // Merge updates (e.g. isAlive)
          this.players[docSnap.id] = { ...this.players[docSnap.id], ...docSnap.data() };
        }
      });
      if (newJoin && onPlayerJoin) {
        onPlayerJoin(this.players);
      }
    });

    // Listen to private subcollection for actions and roles
    db.collection("rooms").doc(this.roomCode).collection("private").onSnapshot(async (snap) => {
      let newActionCount = 0;
      snap.forEach(docSnap => {
        const pId = docSnap.id;
        const pData = docSnap.data();
        if (this.players[pId]) {
          this.players[pId].role = pData.role;
        }
        
        if (pData.target) {
          if (!this.actions[pId] || this.actions[pId].target !== pData.target) {
            newActionCount++;
            if (this.onActionSubmitted) {
              this.onActionSubmitted(pData.role || 'unknown');
            }
          }
          this.actions[pId] = { target: pData.target };
        }
      });

      // Sync werewolf actions
      if (newActionCount > 0) {
        let werewolfActions = {};
        for (const [id, act] of Object.entries(this.actions)) {
          if (this.players[id] && this.players[id].role === 'werewolf') {
            werewolfActions[id] = act;
          }
        }
        await db.collection("rooms").doc(this.roomCode).collection("werewolfData").doc("actions").set(werewolfActions);
      }
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

    const batch = db.batch();

    playerIds.forEach((id, i) => {
      this.players[id].role = roles[i];
      const privRef = db.collection("rooms").doc(this.roomCode).collection("private").doc(id);
      batch.update(privRef, { role: roles[i], target: null });
    });

    const roomRef = db.collection("rooms").doc(this.roomCode);
    batch.update(roomRef, { state: 'reveal' });

    await batch.commit();
    this.state = 'reveal';
  }

  async checkWinCondition() {
    let aliveWolves = 0;
    let aliveTown = 0;

    Object.values(this.players).forEach(p => {
      if (p.isAlive) {
        if (p.role === 'werewolf') aliveWolves++;
        else aliveTown++;
      }
    });

    if (aliveWolves === 0) {
      await this.endGame('villager', 'The Werewolves have been eliminated!');
      return true;
    }
    if (aliveWolves >= aliveTown) {
      await this.endGame('werewolf', 'The Werewolves have overrun the town!');
      return true;
    }
    return false;
  }

  async startNight() {
    this.actions = {}; // Clear memory actions
    const batch = db.batch();
    
    // Clear private targets
    for (const id of Object.keys(this.players)) {
      const privRef = db.collection("rooms").doc(this.roomCode).collection("private").doc(id);
      batch.update(privRef, { target: null });
    }
    
    // Clear werewolf sync
    const wolfRef = db.collection("rooms").doc(this.roomCode).collection("werewolfData").doc("actions");
    batch.set(wolfRef, {});

    // Update room
    const roomRef = db.collection("rooms").doc(this.roomCode);
    batch.update(roomRef, { state: 'night' });

    await batch.commit();
    this.state = 'night';
  }

  async endNight() {
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
      const docName = this.players[doctorTarget]?.name;
      events.push(`The Doctor saved <span class="highlight-save">${docName}</span>.`);
    }

    if (werewolfTarget) {
      if (werewolfTarget === doctorTarget) {
        events.push(`The Werewolves attacked, but their target was saved by the Doctor!`);
      } else {
        const wolfName = this.players[werewolfTarget]?.name;
        events.push(`The Werewolves killed <span class="highlight-kill">${wolfName}</span>.`);
        this.players[werewolfTarget].isAlive = false;
        
        await db.collection("rooms").doc(this.roomCode).collection("players").doc(werewolfTarget).update({
           isAlive: false
        });
      }
    } else {
      events.push(`The Werewolves were quiet...`);
    }

    await db.collection("rooms").doc(this.roomCode).update({
      state: 'day',
      events: events
    });
    this.state = 'day';
  }

  async startDiscussion(seconds = 60) {
    await db.collection("rooms").doc(this.roomCode).update({
      state: 'discussion',
      timer: seconds
    });
    this.state = 'discussion';
  }

  async startVoting() {
    this.actions = {};
    const batch = db.batch();
    
    // Clear private targets
    for (const id of Object.keys(this.players)) {
      const privRef = db.collection("rooms").doc(this.roomCode).collection("private").doc(id);
      batch.update(privRef, { target: null });
    }

    // Update room
    const roomRef = db.collection("rooms").doc(this.roomCode);
    batch.update(roomRef, { state: 'voting' });

    await batch.commit();
    this.state = 'voting';
  }

  async endVoting() {
    const votes = {};
    Object.values(this.actions).forEach(action => {
      if (action.target) {
        votes[action.target] = (votes[action.target] || 0) + 1;
      }
    });

    let exiled = null;
    let maxVotes = 0;
    let tie = false;

    for (const [id, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        exiled = id;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    }

    let resultMsg = "The village was peaceful; no one voted.";
    if (maxVotes > 0) {
      if (tie) {
        resultMsg = "The village was tied. No one is exiled today.";
      } else {
        const name = this.players[exiled]?.name;
        resultMsg = `The village exiled <span class="highlight-kill">${name}</span> with ${maxVotes} votes.`;
        this.players[exiled].isAlive = false;
        await db.collection("rooms").doc(this.roomCode).collection("players").doc(exiled).update({
           isAlive: false
        });
      }
    }

    await db.collection("rooms").doc(this.roomCode).update({
      state: 'vote_summary',
      voteResult: resultMsg
    });
    this.state = 'vote_summary';
  }

  async endGame(winner, text) {
    await db.collection("rooms").doc(this.roomCode).update({
      state: 'end',
      winner: winner, // 'werewolf' or 'villager'
      winText: text
    });
    this.state = 'end';
  }
}
