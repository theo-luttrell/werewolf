import { icons } from './icons.js';

export const views = {
  login: () => `
    <div class="wait-container animate-fade-in" style="text-align: center; padding: 20px;">
        <h1 class="wait-title" style="margin-bottom: 20px; font-size: 36px; letter-spacing: 2px;">WEREWOLF</h1>
        <p class="wait-sub" style="animation: none; margin-bottom: 30px;">Enter Room Code</p>
        <div class="pin-container" style="margin-top: 0;">
            <input type="text" class="pin-box stagger-1" maxlength="1" id="p1" autofocus>
            <input type="text" class="pin-box stagger-2" maxlength="1" id="p2">
            <input type="text" class="pin-box stagger-3" maxlength="1" id="p3">
            <input type="text" class="pin-box stagger-4" maxlength="1" id="p4">
        </div>
    </div>
  `,

  nickname: () => `
    <div class="wait-container animate-fade-in" style="text-align: center; padding: 20px;">
        <h1 class="wait-title" style="margin-bottom: 20px; font-size: 36px; letter-spacing: 2px;">WEREWOLF</h1>
        <p class="wait-sub" style="animation: none; margin-bottom: 30px;">Choose Your Name</p>
        <div class="form-container stagger-1" style="margin-top: 0;">
            <input type="text" class="nickname-input" id="nicknameInput" placeholder="Enter Nickname" maxlength="15" autofocus>
            <button type="submit" class="submit-btn" id="nicknameSubmit">Join Game</button>
        </div>
    </div>
  `,

  waiting: () => `
    <div class="wait-container animate-fade-in">
        <div class="spinner"></div>
        <h2 class="wait-title">You're in!</h2>
        <p class="wait-sub">Waiting for the host to start the game...</p>
    </div>
  `,

  actionWaiting: () => `
    <div class="wait-container animate-fade-in">
        <div class="spinner"></div>
        <h2 class="wait-title">Action Received</h2>
        <p class="wait-sub">Waiting for other players to finish...</p>
    </div>
  `,

  reveal: (role) => `
    <div class="reveal-container view-screen active animate-fade-in">
        <div class="role-icon-container float-anim" style="width:80px;height:80px;margin: 0 auto 20px auto; color: inherit;">
            ${icons[role] || icons.villager}
        </div>
        <p class="reveal-text">
            You are a...
            <span id="roleLabel" class="role-text show">${role.toUpperCase()}</span>
        </p>
    </div>
  `,

  nightWerewolf: (players, currentPlayerId, actions) => {
    const options = players.map((p, i) => {
      const delay = (i % 5) + 1;
      if (p.id === currentPlayerId) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name} (You)</span></div>`;
      }
      if (p.role === 'werewolf') {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name}</span><span class="status-badge werewolf">Wolf</span></div>`;
      } else if (!p.isAlive) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable stagger-${delay}" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

    let otherWolfTargets = '';
    if (actions) {
      const wolfTargets = [];
      Object.entries(actions).forEach(([actId, act]) => {
        if (actId !== currentPlayerId) {
          const actor = players.find(x => x.id === actId);
          if (actor && actor.role === 'werewolf') {
            const targetName = players.find(x => x.id === act.target)?.name || 'Unknown';
            wolfTargets.push(`<div style="font-size: 14px; margin-top: 8px; color: #ffcccc; display:flex; align-items:center; gap:6px;">
                <div style="width:16px;height:16px;">${icons.werewolf}</div> ${actor.name} is targeting ${targetName}
            </div>`);
          }
        }
      });
      if (wolfTargets.length > 0) {
        otherWolfTargets = `<div class="animate-fade-in" style="margin-top: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
           <strong style="color: #ff6b6b; font-size:12px; text-transform:uppercase;">Pack Activity:</strong>
           ${wolfTargets.join('')}
        </div>`;
      }
    }

    return `
      <div class="night-container animate-fade-in">
          <div class="moon-icon float-anim" style="width:40px;height:40px;margin: 0 auto 10px auto;">${icons.moon}</div>
          <h1 class="night-title">Night Phase</h1>
          <p class="night-subtitle">Werewolves, choose a target to kill:</p>
          <div class="custom-select-wrapper stagger-1">
              <div class="select-trigger" id="dropdownTrigger">
                  <span id="selectedValue">Select Player...</span>
                  <div class="arrow-icon"></div>
              </div>
              <div class="select-options" id="dropdownOptions">${options}</div>
          </div>
          ${otherWolfTargets}
          <button class="submit-btn stagger-2" id="nightSubmit" style="margin-top:20px; display:none;">Submit Action</button>
      </div>
    `;
  },

  nightDoctor: (players, currentPlayerId) => {
    const options = players.map((p, i) => {
      const delay = (i % 5) + 1;
      if (p.id === currentPlayerId) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name} (You)</span></div>`;
      }
      if (!p.isAlive) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable stagger-${delay}" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

    return `
      <div class="night-container animate-fade-in">
          <div class="moon-icon float-anim" style="width:40px;height:40px;margin: 0 auto 10px auto;">${icons.moon}</div>
          <h1 class="night-title">Night Phase</h1>
          <p class="night-subtitle">Doctor, choose a target to save:</p>
          <div class="custom-select-wrapper stagger-1">
              <div class="select-trigger" id="dropdownTrigger">
                  <span id="selectedValue">Select Player...</span>
                  <div class="arrow-icon"></div>
              </div>
              <div class="select-options" id="dropdownOptions">${options}</div>
          </div>
          <button class="submit-btn stagger-2" id="nightSubmit" style="margin-top:20px; display:none;">Submit Action</button>
      </div>
    `;
  },

  nightSeer: (players, currentPlayerId) => {
    const options = players.map((p, i) => {
      const delay = (i % 5) + 1;
      if (p.id === currentPlayerId) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name} (You)</span></div>`;
      }
      if (!p.isAlive) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable stagger-${delay}" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

    return `
      <div class="night-container animate-fade-in">
          <div class="moon-icon float-anim" style="width:40px;height:40px;margin: 0 auto 10px auto;">${icons.moon}</div>
          <h1 class="night-title">Night Phase</h1>
          <p class="night-subtitle">Seer, gaze into your crystal ball to reveal a player's true identity:</p>
          <div class="custom-select-wrapper stagger-1">
              <div class="select-trigger" id="dropdownTrigger">
                  <span id="selectedValue">Select Player...</span>
                  <div class="arrow-icon"></div>
              </div>
              <div class="select-options" id="dropdownOptions">${options}</div>
          </div>
          <button class="submit-btn stagger-2" id="nightSubmit" style="margin-top:20px; display:none;">Peer into soul</button>
      </div>
    `;
  },

  nightSeerResult: (targetName, targetRole) => {
    const roleSvg = icons[targetRole] || icons.villager;
    return `
      <div class="night-container animate-fade-in">
          <div class="moon-icon float-anim" style="width:40px;height:40px;margin: 0 auto 10px auto;">${icons.seer}</div>
          <h1 class="night-title">Vision Received</h1>
          <p class="night-subtitle">The spirits have revealed the truth about ${targetName}.</p>
          <div class="stagger-1" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 25px; margin-top: 20px;">
             <div style="width:60px; height:60px; margin: 0 auto 15px auto; color:#ffffff;">${roleSvg}</div>
             <div style="font-size: 24px; font-weight: bold; color: #ffffff;">${targetRole.toUpperCase()}</div>
          </div>
      </div>
    `;
  },

  nightMinion: (wolfNames) => {
    return `
      <div class="night-container animate-fade-in">
          <div class="moon-icon float-anim" style="width:40px;height:40px;margin: 0 auto 10px auto;">${icons.minion}</div>
          <h1 class="night-title">Night Phase</h1>
          <p class="night-subtitle">You are a Minion. Help the Werewolves win.</p>
          <div class="stagger-1" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,0,0,0.2); border-radius: 12px; padding: 20px; margin-top: 20px;">
             <div style="color: #ef4444; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 10px;">Your Pack</div>
             ${wolfNames.map(name => `<div style="color: #ffffff; font-size: 18px; margin: 5px 0; display:flex; align-items:center; justify-content:center; gap:8px;">
                 <div style="width:20px;height:20px;color:#ef4444;">${icons.werewolf}</div> ${name}
             </div>`).join('')}
             ${wolfNames.length === 0 ? '<div style="color: #94a3b8;">No wolves exist. You are alone.</div>' : ''}
          </div>
          <div class="stagger-2" style="display:flex; justify-content:center; margin-top:25px;">
              <div class="spinner" style="border-top-color:#ef4444; width:30px; height:30px;"></div>
          </div>
          <p class="wait-sub stagger-2" style="margin-top:15px; font-size:14px;">Waiting for wolves to strike...</p>
      </div>
    `;
  },

  nightVillager: () => `
    <div class="night-container animate-fade-in">
        <div class="moon-icon float-anim" style="width:40px;height:40px;margin: 0 auto 10px auto;">${icons.moon}</div>
        <h1 class="night-title">Night Phase</h1>
        <p class="night-subtitle">It is nighttime in the village.</p>
        <div style="display:flex; justify-content:center; margin-bottom:25px;">
            <div class="spinner" style="border-top-color:#ffd700"></div>
        </div>
        <p class="wait-sub">Waiting for other roles to move...</p>
    </div>
  `,

  day: (events) => {
    const eventLines = events.map((ev, i) => `<p class="summary-line line-${i + 1}" style="animation-delay:${1.8 + i * 1.4}s">${ev}</p>`).join('');
    return `
      <div class="summary-container animate-fade-in">
          <div class="sun-icon float-anim" style="width:60px;height:60px;margin: 0 auto 10px auto;color:#eab308;">${icons.sun}</div>
          <h1 class="summary-title">Morning Report</h1>
          ${eventLines}
      </div>
    `;
  },

  discussion: () => `
    <div class="discussion-container animate-fade-in">
        <h1 class="phase-title">Town Discussion</h1>
        <p class="phase-subtitle">Debate clues and find the hidden werewolves.</p>
        <div class="timer-wrapper stagger-1">
            <svg class="timer-svg">
                <circle class="track-ring" cx="80" cy="80" r="72"></circle>
                <circle id="progressCircle" class="progress-ring" cx="80" cy="80" r="72"></circle>
            </svg>
            <div id="countdownDisplay" class="timer-text">1:00</div>
        </div>
    </div>
  `,

  voting: (players, currentPlayerId) => {
    const options = players.map((p, i) => {
      const delay = (i % 5) + 1;
      if (p.id === currentPlayerId) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name} (You)</span></div>`;
      }
      if (!p.isAlive) {
        return `<div class="option-item disabled stagger-${delay}"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable stagger-${delay}" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

    return `
      <div class="night-container animate-fade-in" style="max-width:340px;">
          <h1 class="phase-title" style="color:inherit">Voting Phase</h1>
          <p class="phase-subtitle">Vote to exile someone.</p>
          <div class="custom-select-wrapper stagger-1">
              <div class="select-trigger" id="dropdownTrigger">
                  <span id="selectedValue">Select Player...</span>
                  <div class="arrow-icon"></div>
              </div>
              <div class="select-options" id="dropdownOptions">${options}</div>
          </div>
          <button class="submit-btn stagger-2" id="nightSubmit" style="margin-top:20px; display:none;">Cast Vote</button>
      </div>
    `;
  },

  voteSummary: (msg) => `
    <div class="summary-container animate-fade-in">
        <h1 class="summary-title" style="color:inherit">Voting Results</h1>
        <p class="summary-line" style="animation-delay:0.5s; opacity:1; transform:none">${msg}</p>
    </div>
  `,

  end: (winner, winText) => {
    const color = winner === 'werewolf' ? '#ef4444' : '#eab308';
    return `
      <div class="view-screen active animate-fade-in" style="text-align: center;">
          <h1 class="summary-title" style="color: ${color}; text-transform:uppercase; font-size: 32px; border-bottom: 2px solid ${color}; padding-bottom: 10px; margin-bottom: 15px;">
             ${winner} VICTORY!
          </h1>
          <p class="wait-sub" style="color: #cbd5e1; margin-bottom: 25px; font-weight: 500; font-size:18px;">${winText}</p>
      </div>
    `;
  },

  deadSpectator: (players, actions) => {
    const playerList = players.map((p, i) => {
      const delay = (i % 5) + 1;
      return `
      <div class="stagger-${delay}" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">
         <span style="color: ${p.isAlive ? '#1e293b' : '#94a3b8'}; font-weight: 600; ${!p.isAlive ? 'text-decoration: line-through;' : ''}">${p.name}</span>
         <span style="color: ${p.role === 'werewolf' ? '#dc2626' : (p.role === 'doctor' ? '#0284c7' : '#16a34a')}; font-weight:bold; text-transform:uppercase;">${p.role}</span>
      </div>
      `;
    }).join('');

    let liveActionsHtml = '';
    if (actions && Object.keys(actions).length > 0) {
      const actionLines = Object.entries(actions).map(([actId, act]) => {
        const actor = players.find(x => x.id === actId);
        if (!actor) return '';
        
        const history = act.history || [act.target];
        const targetNames = history.map(tId => {
           const t = players.find(x => x.id === tId);
           return t ? `<strong>${t.name}</strong>` : '<strong>Unknown</strong>';
        }).join(' ➔ ');

        return `<div class="stagger-1" style="font-size: 14px; padding: 5px 0; color: #475569; display:flex; align-items:center; gap:5px; flex-wrap: wrap;">
            <div style="width:14px;height:14px;color:#ea580c;flex-shrink:0;">${icons[actor.role] || icons.villager}</div>
            <span style="word-break: break-word;"><strong>${actor.name}</strong> targeted ${targetNames}</span>
        </div>`;
      }).join('');

      liveActionsHtml = `
        <div class="animate-fade-in" style="margin-top: 20px; background: rgba(0,0,0,0.05); border-radius: 8px; padding: 15px; text-align: left;">
           <h3 style="color: #ea580c; margin-top:0; font-size:16px;">Live Actions</h3>
           ${actionLines}
        </div>
      `;
    }

    return `
      <div class="summary-container animate-fade-in" style="max-width: 400px; margin: 0 auto;">
          <div class="float-anim" style="width:50px;height:50px;margin: 0 auto 15px auto; color:#dc2626;">${icons.skull}</div>
          <h1 class="summary-title" style="color: #dc2626; border-bottom: 2px solid #fecaca; padding-bottom: 10px; margin-bottom: 15px;">You are Dead</h1>
          <p class="wait-sub" style="color: #64748b; margin-bottom: 25px; font-weight: 500; animation:none;">You are now a spectator.</p>
          <div class="stagger-1" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; text-align: left; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              ${playerList}
          </div>
          ${liveActionsHtml}
      </div>
    `;
  }
};
