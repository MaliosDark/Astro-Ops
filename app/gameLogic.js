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
  let   balanceAT   = 100.0;

  // Helper: sleep for ms
  const sleep = ms => new Promise(res => setTimeout(res, ms));

  // Center & float status panel
  Object.assign(statusPanel.style, {
    position:      'fixed',
    top:           '50%',
    left:          '50%',
    transform:     'translate(-50%, -50%)',
    zIndex:        '3000',
    pointerEvents: 'none'
  });

  const hud = window.AstroUI;

  // Wire HUD buttons → modals or actions
  hud.onMission(() => showModal('mission'));
  hud.onUpgrade(() => showModal('upgrade'));
  hud.onRaid   (() => showModal('raid'));
  hud.onHelp   (() => showModal('howto'));
  hud.onClaim   (() => showModal('claim'));
//   hud.onClaim  (() => { 
//     window.performClaim();
//     closeModal();
//   });

  // CONNECT WALLET
  connectBtn.addEventListener('click', () => {
    hud.setWallet('DemoWalletXYZ');
    hud.setBalance(balanceAT);
    hud.setStatus('Ready!');
    document.getElementById('hero').style.display   = 'none';
    canvas.style.display                            = 'block';
    document.getElementById('gb-ui').style.display  = 'flex';
  });

  // 1️⃣ MISSION logic with travel animation
  const cooldown   = 8 * 3600;
  let lastMissionT = 0;

  window.startMission = async function(type) {
    // close the mission modal right away
    closeModal();

    const now = Date.now() / 1000;
    if (now - lastMissionT < cooldown) {
      hud.setStatus('On cooldown');
      return;
    }

    hud.setStatus(`Launching ${type}…`);
    await window.animateShipLaunch();
    hud.setStatus('In transit…');
    await window.animateRaidTo(type);

    // simulate outcome
    const configs = {
      MiningRun:    { chance: 0.9,  reward: 10 },
      BlackMarket:  { chance: 0.7,  reward: 30 },
      ArtifactHunt: { chance: 0.5,  reward: 60 },
    };
    const cfg     = configs[type];
    const ok      = Math.random() < cfg.chance;
    const gain    = ok ? cfg.reward : 0;

    if (ok) {
      balanceAT += gain;
      hud.setStatus(`+${gain} AT`);
    } else {
      hud.setStatus('Mission failed');
    }
    hud.setBalance(balanceAT);

    hud.setStatus('Returning home…');
    await window.animateShipReturn();

    lastMissionT = now;
  };

  // 2️⃣ UPGRADE
  window.performUpgrade = function(level) {
    closeModal();
    const costs = [0, 50,100,150,225,300,400];
    const cost  = costs[level-1]||0;
    if (balanceAT >= cost) {
      balanceAT -= cost;
      hud.setStatus(`Upgraded to L${level}`);
    } else {
      hud.setStatus('Not enough AT');
    }
    hud.setBalance(balanceAT);
  };

  // 3️⃣ RAID
  window.performRaid = function(idx) {
    closeModal();
    const targets = [
      { chance:0,   loot:0 },
      { chance:0.7, loot:20 },
      { chance:0.5, loot:15 },
    ];
    const t       = targets[idx%targets.length];
    const ok      = Math.random() < t.chance;
    if (ok) {
      balanceAT += t.loot;
      hud.setStatus(`+${t.loot} AT`);
    } else {
      hud.setStatus('Raid failed');
    }
    hud.setBalance(balanceAT);
  };

  // 4️⃣ CLAIM
  window.performClaim = function() {
    closeModal();
    const pts = 5;
    balanceAT += pts;
    hud.setStatus(`+${pts} AT`);
    hud.setBalance(balanceAT);
  };

  // Animation stubs (attached to window by shipAnimator.js)
  // window.animateShipLaunch
  // window.animateRaidTo
  // window.animateShipReturn
}
