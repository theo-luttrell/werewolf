export const views = {
  login: () => `
    <div class="wait-container" style="text-align: center; padding: 20px;">
        <h1 class="wait-title" style="margin-bottom: 20px; font-size: 36px; letter-spacing: 2px;">WEREWOLF</h1>
        <p class="wait-sub" style="animation: none; margin-bottom: 30px;">Enter Room Code</p>
        <div class="pin-container" style="margin-top: 0;">
            <input type="text" class="pin-box" maxlength="1" id="p1" autofocus>
            <input type="text" class="pin-box" maxlength="1" id="p2">
            <input type="text" class="pin-box" maxlength="1" id="p3">
            <input type="text" class="pin-box" maxlength="1" id="p4">
        </div>
    </div>
  `,

  nickname: () => `
    <div class="wait-container" style="text-align: center; padding: 20px;">
        <h1 class="wait-title" style="margin-bottom: 20px; font-size: 36px; letter-spacing: 2px;">WEREWOLF</h1>
        <p class="wait-sub" style="animation: none; margin-bottom: 30px;">Choose Your Name</p>
        <div class="form-container" style="margin-top: 0;">
            <input type="text" class="nickname-input" id="nicknameInput" placeholder="Enter Nickname" maxlength="15" autofocus>
            <button type="submit" class="submit-btn" id="nicknameSubmit">Join Game</button>
        </div>
    </div>
  `,

  waiting: () => `
    <div class="wait-container">
        <div class="spinner"></div>
        <h2 class="wait-title">You're in!</h2>
        <p class="wait-sub">Waiting for the host to start the game...</p>
    </div>
  `,

  actionWaiting: () => `
    <div class="wait-container">
        <div class="spinner"></div>
        <h2 class="wait-title">Action Received</h2>
        <p class="wait-sub">Waiting for other players to finish...</p>
    </div>
  `,

  reveal: (role) => `
    <div class="reveal-container view-screen active">
        <p class="reveal-text">
            You are a...
            <span id="roleLabel" class="role-text show">${role.toUpperCase()}</span>
        </p>
    </div>
  `,

  nightWerewolf: (players, currentPlayerId, actions) => {
    const options = players.map(p => {
      if (p.id === currentPlayerId) {
        return `<div class="option-item disabled"><span>${p.name} (You)</span></div>`;
      }
      if (p.role === 'werewolf') {
        return `<div class="option-item disabled"><span>${p.name}</span><span class="status-badge werewolf">Wolf</span></div>`;
      } else if (!p.isAlive) {
        return `<div class="option-item disabled"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

    let otherWolfTargets = '';
    if (actions) {
      const wolfTargets = [];
      Object.entries(actions).forEach(([actId, act]) => {
        if (actId !== currentPlayerId) {
          const actor = players.find(x => x.id === actId);
          if (actor && actor.role === 'werewolf') {
            const targetName = players.find(x => x.id === act.target)?.name || 'Unknown';
            wolfTargets.push(`<div style="font-size: 14px; margin-top: 8px; color: #ffcccc;">🐺 ${actor.name} is targeting ${targetName}</div>`);
          }
        }
      });
      if (wolfTargets.length > 0) {
        otherWolfTargets = `<div style="margin-top: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
           <strong style="color: #ff6b6b; font-size:12px; text-transform:uppercase;">Pack Activity:</strong>
           ${wolfTargets.join('')}
        </div>`;
      }
    }

    return `
      <div class="night-container">
          <div class="moon-icon">🌙</div>
          <h1 class="night-title">Night Phase</h1>
          <p class="night-subtitle">Werewolves, choose a target to kill:</p>
          <div class="custom-select-wrapper">
              <div class="select-trigger" id="dropdownTrigger">
                  <span id="selectedValue">Select Player...</span>
                  <div class="arrow-icon"></div>
              </div>
              <div class="select-options" id="dropdownOptions">${options}</div>
          </div>
          ${otherWolfTargets}
          <button class="submit-btn" id="nightSubmit" style="margin-top:20px; display:none;">Submit Action</button>
      </div>
    `;
  },

  nightDoctor: (players, currentPlayerId) => {
    const options = players.map(p => {
      if (p.id === currentPlayerId) {
        return `<div class="option-item disabled"><span>${p.name} (You)</span></div>`;
      }
      if (!p.isAlive) {
        return `<div class="option-item disabled"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

    return `
      <div class="night-container">
          <div class="moon-icon">🌙</div>
          <h1 class="night-title">Night Phase</h1>
          <p class="night-subtitle">Doctor, choose a target to save:</p>
          <div class="custom-select-wrapper">
              <div class="select-trigger" id="dropdownTrigger">
                  <span id="selectedValue">Select Player...</span>
                  <div class="arrow-icon"></div>
              </div>
              <div class="select-options" id="dropdownOptions">${options}</div>
          </div>
          <button class="submit-btn" id="nightSubmit" style="margin-top:20px; display:none;">Submit Action</button>
      </div>
    `;
  },

  nightVillager: () => `
    <div class="night-container">
        <div class="moon-icon">🌙</div>
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
      <div class="summary-container">
          <div class="sun-icon">☀️</div>
          <h1 class="summary-title">Morning Report</h1>
          ${eventLines}
      </div>
    `;
  },

  discussion: () => `
    <div class="discussion-container">
        <h1 class="phase-title">Town Discussion</h1>
        <p class="phase-subtitle">Debate clues and find the hidden werewolves.</p>
        <div class="timer-wrapper">
            <svg class="timer-svg">
                <circle class="track-ring" cx="80" cy="80" r="72"></circle>
                <circle id="progressCircle" class="progress-ring" cx="80" cy="80" r="72"></circle>
            </svg>
            <div id="countdownDisplay" class="timer-text">1:00</div>
        </div>
    </div>
  `,

  voting: (players, currentPlayerId) => {
    const options = players.map(p => {
      if (p.id === currentPlayerId) {
        return `<div class="option-item disabled"><span>${p.name} (You)</span></div>`;
      }
      if (!p.isAlive) {
        return `<div class="option-item disabled"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

    return `
      <div class="night-container" style="max-width:340px;">
          <h1 class="phase-title" style="color:inherit">Voting Phase</h1>
          <p class="phase-subtitle">Vote to exile someone.</p>
          <div class="custom-select-wrapper">
              <div class="select-trigger" id="dropdownTrigger">
                  <span id="selectedValue">Select Player...</span>
                  <div class="arrow-icon"></div>
              </div>
              <div class="select-options" id="dropdownOptions">${options}</div>
          </div>
          <button class="submit-btn" id="nightSubmit" style="margin-top:20px; display:none;">Cast Vote</button>
      </div>
    `;
  },

  voteSummary: (msg) => `
    <div class="summary-container">
        <h1 class="summary-title" style="color:inherit">Voting Results</h1>
        <p class="summary-line" style="animation-delay:0.5s; opacity:1; transform:none">${msg}</p>
    </div>
  `,

  end: (winner, winText) => `
    <div class="view-screen active">
        <h2 class="win-title">${winner} Victory!</h2>
        <p class="win-description">${winText}</p>
    </div>
  `,

  deadSpectator: (players, actions) => {
    const playerList = players.map(p => `
      <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">
         <span style="color: ${p.isAlive ? '#1e293b' : '#94a3b8'}; font-weight: 600; ${!p.isAlive ? 'text-decoration: line-through;' : ''}">${p.name}</span>
         <span style="color: ${p.role === 'werewolf' ? '#dc2626' : (p.role === 'doctor' ? '#0284c7' : '#16a34a')}; font-weight:bold; text-transform:uppercase;">${p.role}</span>
      </div>
    `).join('');

    let liveActionsHtml = '';
    if (actions && Object.keys(actions).length > 0) {
      const actionLines = Object.entries(actions).map(([actId, act]) => {
        const actor = players.find(x => x.id === actId);
        const target = players.find(x => x.id === act.target);
        if (!actor || !target) return '';
        return `<div style="font-size: 14px; padding: 5px 0; color: #475569;">▶ <strong>${actor.name}</strong> (${actor.role}) targeted <strong>${target.name}</strong></div>`;
      }).join('');

      liveActionsHtml = `
        <div style="margin-top: 20px; background: rgba(0,0,0,0.05); border-radius: 8px; padding: 15px; text-align: left;">
           <h3 style="color: #ea580c; margin-top:0; font-size:16px;">Live Actions</h3>
           ${actionLines}
        </div>
      `;
    }

    return `
      <div class="summary-container" style="max-width: 400px; margin: 0 auto;">
          <h1 class="summary-title" style="color: #dc2626; border-bottom: 2px solid #fecaca; padding-bottom: 10px; margin-bottom: 15px;">💀 You are Dead</h1>
          <p style="color: #64748b; margin-bottom: 25px; font-weight: 500;">You are now a spectator.</p>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; text-align: left; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              ${playerList}
          </div>
          ${liveActionsHtml}
      </div>
    `;
  }
};
