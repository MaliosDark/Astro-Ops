// src/utils/gameLogic.js
// Game logic utilities and helper functions

import ENV from '../config/environment.js';

/**
 * Calculate mission reward based on type and mode
 */
export function calculateMissionReward(type, mode) {
  const baseRewards = {
    'exploration': 100,
    'combat': 150,
    'mining': 120
  };
  
  const modeMultipliers = {
    'easy': 1.0,
    'medium': 1.5,
    'hard': 2.0
  };
  
  const baseReward = baseRewards[type] || 100;
  const multiplier = modeMultipliers[mode] || 1.0;
  
  return Math.floor(baseReward * multiplier);
}

/**
 * Check if mission is complete based on start time and duration
 */
export function isMissionComplete(startTime, durationSeconds) {
  const now = Math.floor(Date.now() / 1000);
  return now >= (startTime + durationSeconds);
}

/**
 * Get remaining time for mission in seconds
 */
export function getMissionTimeRemaining(startTime, durationSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const endTime = startTime + durationSeconds;
  return Math.max(0, endTime - now);
}

/**
 * Format time remaining as human readable string
 */
export function formatTimeRemaining(seconds) {
  if (seconds <= 0) return 'Complete';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Create mission data object
 */
export function createMissionData(type, mode, reward) {
  const missionData = {
    mission_type: type,
    mode,
    ts_start: Math.floor(Date.now() / 1000),
    reward: reward,
    cooldown_seconds: 8 * 3600 // 8 hours in seconds
  };
  
  return missionData;
}

/**
 * Validate mission parameters
 */
export function validateMissionParams(type, mode) {
  const validTypes = ['exploration', 'combat', 'mining'];
  const validModes = ['easy', 'medium', 'hard'];
  
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid mission type: ${type}`);
  }
  
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mission mode: ${mode}`);
  }
  
  return true;
}

/**
 * Calculate energy cost for mission
 */
export function calculateEnergyCost(type, mode) {
  const baseCosts = {
    'exploration': 1,
    'combat': 2,
    'mining': 1
  };
  
  const modeCosts = {
    'easy': 0,
    'medium': 1,
    'hard': 2
  };
  
  return (baseCosts[type] || 1) + (modeCosts[mode] || 0);
}

/**
 * Check if player has enough energy for mission
 */
export function hasEnoughEnergy(currentEnergy, type, mode) {
  const requiredEnergy = calculateEnergyCost(type, mode);
  return currentEnergy >= requiredEnergy;
}