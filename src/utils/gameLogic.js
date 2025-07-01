// src/utils/gameLogic.js
import { animateShipLaunch, animateRaidTo, animateShipReturn } from './shipAnimator';
import { createBurnTransaction, signAndSerializeTransaction, checkTokenBalance, getTokenBalance } from './solanaTransactions';
import walletService from '../services/walletService.js';
import sessionManager from '../services/sessionManager.js';
import apiService from '../services/apiService.js';
import websocketService from '../services/websocketService.js';
import ENV from '../config/environment.js';
import { createRaidTransition } from './raidAnimations.js';

// Usar TextEncoder nativo del navegador
const encoder = new TextEncoder();

/**
 * Re-authenticate wallet when JWT expires
 */
async function reAuthenticate() {
  try {
    const connectedWallet = walletService.getConnectedWallet();
    if (!connectedWallet) {
      throw new Error('No wallet connected for re-authentication');
    }

    if (ENV.DEBUG_MODE) {
      console.log('🔄 Re-authenticating wallet...');
    }

    const publicKey = connectedWallet.publicKey.toString();
    const token = await authenticateWallet(publicKey, connectedWallet.provider.signMessage);
    
    if (ENV.DEBUG_MODE) {
      console.log('✅ Re-authentication successful');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Re-authentication failed:', error);
    throw error;
  }
}

// Expose re-authentication function globally for API service
window.triggerReAuthentication = reAuthenticate;

/**
 * Función mejorada para convertir diferentes tipos de firma a base64
 */
function signatureToBase64(signature) {
  try {
    // Si ya es string, asumimos que es base64
    if (typeof signature === 'string') {
      // Verificar si es base64 válido
      try {
        atob(signature);
        return signature;
      } catch {
        // Si no es base64 válido, convertir desde hex u otro formato
        if (signature.match(/^[0-9a-fA-F]+$/)) {
          // Es hex, convertir a Uint8Array y luego a base64
          const bytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          return uint8ArrayToBase64(bytes);
        }
        throw new Error('Invalid signature format');
      }
    }
    
    // Si es Uint8Array o similar
    if (signature instanceof Uint8Array) {
      return uint8ArrayToBase64(signature);
    }
    
    // Si es ArrayBuffer
    if (signature instanceof ArrayBuffer) {
      return uint8ArrayToBase64(new Uint8Array(signature));
    }
    
    // Si es Array normal
    if (Array.isArray(signature)) {
      return uint8ArrayToBase64(new Uint8Array(signature));
    }
    
    // Si tiene propiedad signature (algunos wallets)
    if (signature.signature) {
      return signatureToBase64(signature.signature);
    }
    
    // Si tiene método toBytes o similar
    if (typeof signature.toBytes === 'function') {
      return uint8ArrayToBase64(signature.toBytes());
    }
    
    // Si tiene propiedad data (algunos wallets)
    if (signature.data) {
      return signatureToBase64(signature.data);
    }
    
    throw new Error('Unsupported signature format');
  } catch (error) {
    console.error('Error converting signature:', error);
    throw new Error(`Failed to convert signature: ${error.message}`);
  }
}

/**
 * Función para convertir Uint8Array a base64 sin Buffer
 */
function uint8ArrayToBase64(uint8Array) {
  if (!(uint8Array instanceof Uint8Array)) {
    console.warn('Converting non-Uint8Array to base64:', typeof uint8Array);
    uint8Array = new Uint8Array(uint8Array);
  }
  
  // Use more robust method for converting Uint8Array to binary string
  const result = btoa(String.fromCharCode.apply(null, uint8Array));
  
  if (ENV.DEBUG_MODE) {
    console.log('🔧 Converted signature to base64, length:', result.length);
  }
  
  return result;
}

/**
 * Authenticate with the server using wallet signature
 */
export async function authenticateWallet(publicKey, signMessage) {
  try {
    if (ENV.DEBUG_MODE) {
      console.log('🔐 Starting authentication for:', publicKey);
    }
    
    // 1. Get nonce from API service
    const { nonce } = await apiService.getNonce(publicKey);
    
    if (ENV.DEBUG_MODE) {
      console.log('✅ Got nonce:', nonce);
    }

    // 2. Sign the nonce
    const encoded = encoder.encode(nonce);
    
    if (ENV.DEBUG_MODE) {
      console.log('🔧 Encoded message length:', encoded.length);
    }
    
    const rawSignature = await signMessage(encoded);
    
    if (ENV.DEBUG_MODE) {
      console.log('🔧 Raw signature type:', typeof rawSignature);
      console.log('🔧 Raw signature:', rawSignature);
    }
    
    if (!rawSignature) {
      throw new Error('Wallet returned empty signature');
    }
    
    // 3. Convert signature to base64 using improved function
    const signatureB64 = signatureToBase64(rawSignature);
    
    if (ENV.DEBUG_MODE) {
      console.log('✅ Converted signature to base64, length:', signatureB64.length);
    }
    
    if (!signatureB64 || signatureB64.length === 0) {
      throw new Error('Failed to convert signature to base64');
    }

    // 4. Login with signature using API service
    if (ENV.DEBUG_MODE) {
      console.log('📤 Sending login request');
    }
    
    const { token } = await apiService.login(publicKey, nonce, signatureB64);
    
    if (ENV.DEBUG_MODE) {
      console.log('✅ Authentication successful');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    throw error;
  }
}

/**
 * Buy ship (one-time purchase) - REAL API CALL
 */
export async function buyShip() {
  try {
    if (ENV.DEBUG_MODE) {
      console.log('🚢 Attempting to buy ship for', ENV.SHIP_PRICE_SOL, 'SOL');
    }
    
    const result = await apiService.buyShip();
    
    if (ENV.DEBUG_MODE) {
      console.log('🚢 Buy ship result:', result);
    }
    
    // Mark that player now has a ship
    window.hasShip = true;

    // Update App state to show the ship in the game
    if (window.updateHasShip) {
      window.updateHasShip(true);
    }
    
    return result;
  } catch (error) {
    if (ENV.DEBUG_MODE) {
      console.error('🚢 Buy ship error:', error);
    }
    throw error;
  }
}

/**
 * Start a mission with animation and API call - REAL API CALL
 */
export async function startMission(type, mode = 'Unshielded') {
  try {
    // Get wallet provider for signing
    const wallet = walletService.getConnectedWallet();
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const userPublicKey = wallet.publicKey;

    if (window.AstroUI) {
      window.AstroUI.setStatus('Preparing mission...');
    }

    // Check if participation fee is required
    let signedBurnTx = '';
    // The participation fee is 250, so a burn transaction is always required.
    // The `if (ENV.PARTICIPATION_FEE > 0)` block is always true now.
    if (window.AstroUI) {
      window.AstroUI.setStatus('Creating burn transaction...');
    }

    // Check if user has enough tokens
    const hasEnoughTokens = await checkTokenBalance(userPublicKey, ENV.PARTICIPATION_FEE);
    if (!hasEnoughTokens) {
      throw new Error(`Insufficient tokens. You need ${ENV.PARTICIPATION_FEE} BR to start this mission.`);
    }

    // Create and sign burn transaction
    const burnTx = await createBurnTransaction(userPublicKey, ENV.PARTICIPATION_FEE);
    signedBurnTx = await signAndSerializeTransaction(burnTx, wallet.provider.signTransaction);

    if (window.AstroUI) {
      window.AstroUI.setStatus(`Launching ${type}…`);
    }

    await animateShipLaunch();

    if (window.AstroUI) {
      window.AstroUI.setStatus('In transit…');
    }

    await animateRaidTo(type);

    // REAL API CALL - This will save to database and now also burn tokens on-chain
    const result = await apiService.sendMission(type, mode, signedBurnTx); // Pass signedBurnTx
    const { success, reward, br_balance } = result;

    if (window.AstroUI) {
      window.AstroUI.setStatus(success ? `Mission success! +${parseInt(reward)} BR` : 'Mission failed - no rewards');
      window.AstroUI.setBalance(parseInt(br_balance));
    }

    // Update global stats
    if (success) {
      window.missionCount = (window.missionCount || 0) + 1;
    }

    if (window.AstroUI) {
      window.AstroUI.setStatus('Returning home…');
    }

    await animateShipReturn();
  } catch (error) {
    console.error('Mission failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Mission failed: ${error.message}`);
    }
    // Only animate return if ship was launched
    if (window.__shipInFlight) {
      await animateShipReturn();
    }
  }
}

/**
 * Perform ship upgrade - REAL API CALL
 */
export async function performUpgrade(level) {
  try {
    // REAL API CALL - This will save to database
    const upgradeResult = await apiService.upgradeShip(level);
    const newLevel = upgradeResult.level || level;
    const newBalance = parseInt(upgradeResult.br_balance);
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Upgraded to L${newLevel}`);
      window.AstroUI.setBalance(newBalance);
    }
  } catch (error) {
    console.error('Upgrade failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Upgrade failed: ${error.message}`);
    }
  }
}

/**
 * Perform raid on another player's mission - REAL API CALL WITH BATTLE
 */
export async function performRaid(missionId) {
  try {
    if (ENV.DEBUG_MODE) {
      console.log('🏴‍☠️ Starting raid on mission:', missionId);
    }
    
    // Notify other players via WebSocket
    websocketService.send('raid_initiated', {
      targetMissionId: missionId,
      timestamp: Date.now()
    });
    
    // Crear transición de raid con animaciones completas Y batalla
    await createRaidTransition(async () => {
      // REAL API CALL to Node.js server
      const result = await apiService.raidMission(missionId);
      const { stolen, br_balance } = result;
      
      // Iniciar batalla durante el raid
      if (window.startRaidBattle) {
        await window.startRaidBattle();
      }
      
      // Update global stats
      if (stolen > 0) {
        // Stats are now updated on server side automatically
        // Refresh profile to get updated stats
        try {
          const profile = await apiService.getUserProfile();
          if (profile?.stats && window.AstroUI) {
            window.AstroUI.setRaidsWon(profile.stats.total_raids_won);
          }
        } catch (error) {
          // Ignore profile refresh errors
        }
      }
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Raid successful! Stolen ${parseInt(stolen)} BR`);
        window.AstroUI.setBalance(parseInt(br_balance));
      }
      
      // Notify completion via WebSocket
      websocketService.send('raid_completed', {
        missionId,
        stolen,
        success: stolen > 0,
        timestamp: Date.now()
      }); 
      
      return { stolen, br_balance };
    });
  } catch (error) {
    if (ENV.DEBUG_MODE) {
      console.error('❌ Raid failed:', error);
    }
    
    // Show user-friendly error message
    if (window.AstroUI) {
      let errorMessage = 'Raid failed';
      
      if (error.message?.includes('Mission not found')) {
        errorMessage = 'Target mission no longer available';
      } else if (error.message?.includes('Already raided')) {
        errorMessage = 'Mission already raided by another player';
      } else if (error.message?.includes('Shielded')) {
        errorMessage = 'Target was shielded - raid failed';
      } else if (error.message?.includes('energy')) {
        errorMessage = 'Not enough energy for raid';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      window.AstroUI.setStatus(errorMessage);
    }
  }
}

/**
 * Get player's current energy level - REAL API CALL
 */
export async function getPlayerEnergy() {
  try {
    const { energy } = await apiService.getPlayerEnergy();
    return energy;
  } catch (error) {
    console.error('Get energy error:', error);
    return 10; // Default energy
  }
}

/**
 * Scan for raidable missions (costs 1 energy) - REAL API CALL
 */
export async function scanForRaids() {
  try {
    if (ENV.DEBUG_MODE) {
      console.log('🔍 Scanning for raids...');
    }
    
    const { missions, users, remainingEnergy } = await apiService.scanForRaids();
    
    if (window.AstroUI) {
      window.AstroUI.setEnergy(remainingEnergy);
    }
    
    // Return both missions and user data
    const result = { missions, users, remainingEnergy };
    
    // If we have users data, return it in the expected format
    if (users && Array.isArray(users)) {
      result.users = users;
    }
    
    return result.missions || missions; // Maintain backward compatibility
  } catch (error) {
    if (ENV.DEBUG_MODE) {
      console.error('Scan for raids error:', error);
    }
    
    // Don't show technical errors to users
    if (window.AstroUI) {
      if (error.message?.includes('Authentication') || error.message?.includes('token')) {
        window.AstroUI.setStatus('Session expired. Please refresh the page.');
      } else {
        window.AstroUI.setStatus('Scan failed. Please try again.');
      }
    }
    
    return [];
  }
}

/**
 * Claim accumulated rewards - REAL API CALL
 */
export async function performClaim() {
  // This function is now deprecated in favor of direct withdrawal
  // We'll keep it for backward compatibility but redirect to withdrawTokens
  try {
    // Get pending rewards first to know how much we're claiming
    const { pending } = await apiService.getPendingRewards();
    const totalAmount = pending?.reduce((sum, item) => sum + parseInt(item.amount), 0) || 0;
    
    if (ENV.DEBUG_MODE) {
      console.log('🎮 Claiming rewards, total amount:', totalAmount);
    }

    if (totalAmount <= 0) {
      throw new Error('No rewards to claim');
    }

    // Now we just withdraw the total amount directly
    const result = await apiService.withdrawTokens(totalAmount, 'claim'); // Explicitly set tx_type to 'claim'
    
    if (ENV.DEBUG_MODE) {
      console.log('🎮 Claim result:', result);
    }
    
    // Return the result for backward compatibility
    return { claimable_AT: totalAmount, ...result };
    
    return result;
  } catch (error) {
    console.error('Claim failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Claim failed: ${error.message || 'Unknown error'}`);
    }
    throw error;
  }
}

/**
 * Get list of missions available for raiding - REAL API CALL
 */
export async function getMissionsForRaid() {
  try {
    return await apiService.getMissions();
  } catch (error) {
    console.error('Get missions error:', error);
    return [];
  }
}

/**
 * Get pending rewards - REAL API CALL
 */
export async function getPendingRewards() {
  try {
    const { pending } = await apiService.getPendingRewards();
    return pending || [];
  } catch (error) {
    console.error('Get pending rewards error:', error);
    return [];
  }
}

// Expose functions globally for compatibility
window.startMission = startMission;
window.performUpgrade = performUpgrade;
window.performRaid = performRaid;
window.performClaim = performClaim;
window.buyShip = buyShip;

// Add a function to update the App state
window.updateHasShip = null;
