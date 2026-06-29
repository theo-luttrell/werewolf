export const views = {
  login: () => `
    <div class="pin-container">
        <input type="text" class="pin-box" maxlength="1" id="p1" autofocus>
        <input type="text" class="pin-box" maxlength="1" id="p2">
        <input type="text" class="pin-box" maxlength="1" id="p3">
        <input type="text" class="pin-box" maxlength="1" id="p4">
    </div>
  `,

  nickname: () => `
    <div class="form-container">
        <input type="text" class="nickname-input" id="nicknameInput" placeholder="Enter Nickname" maxlength="15" autofocus>
        <button type="submit" class="submit-btn" id="nicknameSubmit">Submit</button>
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

  nightWerewolf: (players) => {
    const options = players.map(p => {
      if (p.role === 'werewolf') {
        return `<div class="option-item disabled"><span>${p.name}</span><span class="status-badge werewolf">Wolf</span></div>`;
      } else if (!p.isAlive) {
        return `<div class="option-item disabled"><span>${p.name}</span><span class="status-badge dead">Dead</span></div>`;
      }
      return `<div class="option-item targetable" data-id="${p.id}"><span>${p.name}</span></div>`;
    }).join('');

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
          <button class="submit-btn" id="nightSubmit" style="margin-top:20px; display:none;">Submit Action</button>
      </div>
    `;
  },

  nightDoctor: (players) => {
    const options = players.map(p => {
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
    const eventLines = events.map((ev, i) => `<p class="summary-line line-${i+1}" style="animation-delay:${1.8 + i*1.4}s">${ev}</p>`).join('');
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

  voting: (players) => {
    const options = players.map(p => {
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
  `
};
