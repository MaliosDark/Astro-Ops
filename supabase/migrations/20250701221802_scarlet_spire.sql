/*
  # Update mission cooldowns to 10 minutes for testing
  
  This migration documents the changes needed to update mission cooldowns from 8 hours to 10 minutes.
  No schema changes are required, only configuration changes in the server code.
  
  Server Changes:
  - Update MISSION_COOLDOWNS constant to use 10 minutes (600 seconds) instead of 8 hours
  - This allows for faster testing and development
  
  To revert back to production values:
  - Change MISSION_COOLDOWNS back to 8 hours (28800 seconds)
  - Update the client-side cooldown values in gameLogic.js
*/

-- No schema changes needed
-- This is a documentation migration only