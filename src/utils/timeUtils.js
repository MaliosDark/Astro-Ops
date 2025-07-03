// src/utils/timeUtils.js

/**
 * Format seconds into HH:MM:SS format
 * @param {number} seconds - Number of seconds to format
 * @returns {string} - Formatted time string
 */
export function formatTimeLeft(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--:--';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'), 
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

/**
 * Format seconds into a human-readable format
 * @param {number} seconds - Number of seconds to format
 * @returns {string} - Human-readable time string
 */
export function formatTimeHuman(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return 'unknown time';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate time remaining for a mission
 * @param {Object} mission - Mission data object
 * @returns {number|null} - Seconds remaining or null if mission is complete
 */
export function calculateMissionTimeRemaining(mission) {
  if (!mission || !mission.ts_start) return null;
  
  const now = Math.floor(Date.now() / 1000);
  const missionStart = mission.ts_start;
  const cooldownSeconds = mission.cooldown_seconds || 8 * 3600; // 8 hours default
  
  const endTime = missionStart + cooldownSeconds;
  const timeLeft = Math.max(0, endTime - now);
  
  return timeLeft > 0 ? timeLeft : null;
}

