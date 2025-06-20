// app/gameLogic.js

import { showModal, closeModal } from './modal.js';
import {
  animateShipLaunch,
  animateRaidTo,
  animateShipReturn,
  testTravel
} from './shipAnimator.js';

export function setupGame(canvas) {
  const connectBtn  = document.getElementById('connect-btn');
  const statusPanel = document.getElementById('status-panel');
  const hud         = window.AstroUI;

  // --- Game state ---
  let balanceAT      = 100.0;
  let shipLevel      = 1;        // starts at level 1
  const maxLevel     = 7;
  let lastMissionT   = 0;        // timestamp of last mission
  const cooldown     = 8 * 3600; // seconds

  // --- Performance & stats counters ---
  let raidWins       = 0; // how many raids succeeded
  let raidFails      = 0; // how many raids failed
  let missionSuccess = 0; // how many missions succeeded
  let missionFail    = 0; // how many missions failed
  let killCount      = 0; // total enemy units killed in canvas battles

  // helper: pause
  const sleep = ms => new Promise(res => setTimeout(res, ms));

  // center status panel on screen
  Object.assign(statusPanel.style, {
    position:      'fixed',
    top:           '50%',
    left:          '50%',
    transform:     'translate(-50%, -50%)',
    zIndex:        '3000',
    pointerEvents: 'none'
  });

  // --- Hook up HUD buttons ---
  hud.onMission(() => showModal('mission'));
  hud.onUpgrade(() => showModal('upgrade'));
  hud.onRaid   (() => showModal('raid'));
  hud.onClaim  (() => showModal('claim'));
  hud.onHelp   (() => showModal('howto'));

  // --- Connect wallet handler ---
  connectBtn.addEventListener('click', () => {
    hud.setWallet('DemoWalletXYZ');
    hud.setBalance(balanceAT);
    hud.setStatus('Ready!');

    // Show the game UI
    document.getElementById('hero').style.display  = 'none';
    canvas.style.display                           = 'block';
    document.getElementById('gb-ui').style.display = 'flex';

    // Initialize all counters on HUD
    hud.setRaidsWon(raidWins);
    hud.setKills(killCount);
  });

  // --- 1️⃣ Missions ---
  /**
   * Start a mission.
   * @param {string} type  "MiningRun" | "BlackMarket" | "ArtifactHunt"
   * @param {string} mode  "unshielded" or "shielded"
   */
  window.startMission = async function(type, mode = 'unshielded') {
    closeModal();

    const now = Date.now() / 1000;
    if (now - lastMissionT < cooldown) {
      hud.setStatus('On cooldown');
      return;
    }

    // launch animation
    hud.setStatus(`Launching ${type}…`);
    await animateShipLaunch();

    // travel animation
    hud.setStatus('In transit…');
    await animateRaidTo(type);

    // mission parameters
    const configs = {
      MiningRun:    { chance: 0.90, baseReward: 10 },
      BlackMarket:  { chance: 0.70, baseReward: 30 },
      ArtifactHunt: { chance: 0.50, baseReward: 60 },
    };
    const cfg = configs[type];
    if (!cfg) {
      hud.setStatus('Unknown mission');
      return;
    }

    // determine success
    const success = Math.random() < cfg.chance;
    let reward = 0;

    if (success) {
      // reward scales with ship level
      reward = cfg.baseReward * shipLevel;

      // shielded penalty
      if (mode === 'shielded') {
        reward = Math.floor(reward * 0.8);
      }

      balanceAT += reward;
      hud.setBalance(balanceAT);
      hud.setStatus(`+${reward} AT`);

      missionSuccess++;
    } else {
      hud.setStatus('Mission failed');
      missionFail++;
    }

    // return animation
    hud.setStatus('Returning home…');
    await animateShipReturn();

    lastMissionT = now;

    // Optionally, you could display mission stats in the HUD
    // e.g. hud.setMissionStats(missionSuccess, missionFail);
  };

  // --- 2️⃣ Upgrade ---
  window.performUpgrade = function(level) {
    closeModal();

    // enforce only next‐level upgrades
    if (level !== shipLevel + 1) {
      hud.setStatus(`Can only upgrade to L${shipLevel + 1}`);
      return;
    }

    const costs = { 2:50, 3:100, 4:150, 5:225, 6:300, 7:400 };
    const cost  = costs[level] || Infinity;

    if (balanceAT >= cost) {
      balanceAT -= cost;
      shipLevel = level;
      hud.setBalance(balanceAT);
      hud.setStatus(`Upgraded to L${level}`);
    } else {
      hud.setStatus('Not enough AT');
    }
  };

  // --- 3️⃣ Raiding other players ---
  window.performRaid = function(idx) {
    closeModal();

    // raid targets are dummy here
    const targets = [
      { chance: 0.0, loot: 0 },
      { chance: 0.7, loot: 20 },
      { chance: 0.5, loot: 15 },
    ];
    const t  = targets[idx % targets.length];
    const ok = Math.random() < t.chance;

    if (ok) {
      balanceAT += t.loot;
      hud.setBalance(balanceAT);
      hud.setStatus(`+${t.loot} AT`);
      raidWins++;
    } else {
      hud.setStatus('Raid failed');
      raidFails++;
    }

    hud.setRaidsWon(raidWins);
    // optionally hud.setRaidsLost(raidFails);
  };

  // --- 4️⃣ Claim periodic AT ---
  window.performClaim = function() {
    closeModal();
    const pts = 5;
    balanceAT += pts;
    hud.setBalance(balanceAT);
    hud.setStatus(`+${pts} AT`);
  };

  // --- 5️⃣ Canvas battle end event listener ---
  window.addEventListener('battleEnd', event => {
    const survivors = event.detail; 
    // Each wave spawns 5 enemies → kills = 5 (all enemies died)
    // if you wanted partial kills: kills = waveSize - survivors
    const waveSize      = 5;
    const enemiesDied   = waveSize; 
    killCount += enemiesDied;
    hud.setKills(killCount);
  });

  // Animation hooks (shipAnimator.js) already wired:
  // window.animateShipLaunch, window.animateRaidTo, window.animateShipReturn
}
