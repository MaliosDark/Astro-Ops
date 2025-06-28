// src/utils/gameLogic.js
import { animateShipLaunch, animateRaidTo, animateShipReturn } from './shipAnimator';
import { createBurnTransaction, signAndSerializeTransaction, checkTokenBalance, getTokenBalance } from './solanaTransactions';
import walletService from '../services/walletService.js';
import apiService from '../services/apiService.js';
import ENV from '../config/environment.js';
import { createRaidTransition } from './raidAnimations.js';

/**
 * Start a mission with animation and API call
 */
export async function startMission(type, mode = 'Unshielded') {
  try {
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Starting ${type} mission...`);
    }
    
    await animateShipLaunch();
    await animateRaidTo(type);
    
    // Simulate mission success/failure
    const success = Math.random() > 0.3; // 70% success rate
    const reward = success ? Math.floor(Math.random() * 50) + 10 : 0;
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(success ? `Mission success! +${reward} BR` : 'Mission failed');
      if (success) {
        const currentBalance = parseFloat(document.getElementById('balance-val')?.textContent || '0');
        window.AstroUI.setBalance(currentBalance + reward);
      }
    }
    
    await animateShipReturn();
  } catch (error) {
    console.error('Mission failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Mission failed: ${error.message}`);
    }
    if (window.__shipInFlight) {
      await animateShipReturn();
    }
  }
}

/**
 * Perform ship upgrade
 */
export async function performUpgrade(level) {
  try {
    const cost = [0, 0, 50, 100, 150, 225, 300, 400][level] || 100;
    const currentBalance = parseFloat(document.getElementById('balance-val')?.textContent || '0');
    
    if (currentBalance < cost) {
      throw new Error(`Not enough BR. Need ${cost}, have ${currentBalance}`);
    }
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Upgraded to Level ${level}!`);
      window.AstroUI.setBalance(currentBalance - cost);
    }
  } catch (error) {
    console.error('Upgrade failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Upgrade failed: ${error.message}`);
    }
  }
}

/**
 * Perform raid on another player's mission
 */
export async function performRaid(missionId) {
  try {
    await createRaidTransition(async () => {
      // Simulate raid
      const success = Math.random() > 0.4; // 60% success rate
      const stolen = success ? Math.floor(Math.random() * 30) + 5 : 0;
      
      if (success && window.AstroUI) {
        const currentBalance = parseFloat(document.getElementById('balance-val')?.textContent || '0');
        window.AstroUI.setBalance(currentBalance + stolen);
      }
      
      return { stolen, success };
    });
    
    if (window.AstroUI) {
      window.AstroUI.setStatus('Raid completed!');
    }
  } catch (error) {
    console.error('Raid failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Raid failed: ${error.message}`);
    }
  }
}

/**
 * Get player's current energy level
 */
export async function getPlayerEnergy() {
  return 10; // Always return full energy for demo
}

/**
 * Scan for raidable missions
 */
export async function scanForRaids() {
  // Return mock missions
  return [
    { id: 1, type: 'Mining Run', mode: 'Unshielded', reward: 15 },
    { id: 2, type: 'Black Market', mode: 'Unshielded', reward: 25 },
    { id: 3, type: 'Artifact Hunt', mode: 'Unshielded', reward: 45 }
  ];
}

/**
 * Claim accumulated rewards
 */
export async function performClaim() {
  try {
    const claimAmount = Math.floor(Math.random() * 20) + 5;
    
    if (window.AstroUI) {
      const currentBalance = parseFloat(document.getElementById('balance-val')?.textContent || '0');
      window.AstroUI.setBalance(currentBalance + claimAmount);
      window.AstroUI.setStatus(`Claimed ${claimAmount} BR tokens!`);
    }
  } catch (error) {
    console.error('Claim failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Claim failed: ${error.message}`);
    }
  }
}

/**
 * Get list of missions available for raiding
 */
export async function getMissionsForRaid() {
  return [
    { id: 1, type: 'Mining Run', mode: 'Unshielded', reward: 15 },
    { id: 2, type: 'Black Market', mode: 'Unshielded', reward: 25 }
  ];
}

/**
 * Get pending rewards
 */
export async function getPendingRewards() {
  return [
    { source: 'Mining Run', amount: 10, id: 1 },
    { source: 'Black Market', amount: 25, id: 2 }
  ];
}

// Expose functions globally for compatibility
window.startMission = startMission;
window.performUpgrade = performUpgrade;
window.performRaid = performRaid;
window.performClaim = performClaim;