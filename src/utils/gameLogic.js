import { animateShipLaunch, animateRaidTo, animateShipReturn } from './shipAnimator';
import { 
  createBurnTransaction, 
  signAndSerializeTransaction, 
  checkTokenBalance, 
  getTokenBalance,
  createSolTransferTransaction,
  createTokenTransferTransactionToCommunity, // Import the new function
  checkSolBalance,
  getSolBalance
} from './solanaTransactions';
import walletService from '../services/walletService.js';
import sessionManager from '../services/sessionManager.js';
import apiService from '../services/apiService.js';
import websocketService from '../services/websocketService.js';
import ENV from '../config/environment.js';
import { createRaidTransition } from './raidAnimations.js';

// Use native browser TextEncoder
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
 * Improved function to convert various signature types to base64
 */
function signatureToBase64(signature) {
  try {
    // If already string, assume it's base64
    if (typeof signature === 'string') {
      // Verify if it's valid base64
      try {
        atob(signature);
        return signature;
      } catch {
        // If not valid base64, try converting from hex or other format
        if (signature.match(/^[0-9a-fA-F]+$/)) {
          // It's hex, convert to Uint8Array then to base64
          const bytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          return uint8ArrayToBase64(bytes);
        }
        throw new Error('Invalid signature format');
      }
    }
    
    // If Uint8Array or similar
    if (signature instanceof Uint8Array) {
      return uint8ArrayToBase64(signature);
    }
    
    // If ArrayBuffer
    if (signature instanceof ArrayBuffer) {
      return uint8ArrayToBase64(new Uint8Array(signature));
    }
    
    // If regular Array
    if (Array.isArray(signature)) {
      return uint8ArrayToBase64(new Uint8Array(signature));
    }
    
    // If it has a signature property (some wallets)
    if (signature.signature) {
      return signatureToBase64(signature.signature);
    }
    
    // If it has a toBytes method or similar
    if (typeof signature.toBytes === 'function') {
      return uint8ArrayToBase64(signature.toBytes());
    }
    
    // If it has a data property (some wallets)
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
 * Function to convert Uint8Array to base64 without Buffer
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
export async function buyShip(paymentMethod = 'sol') {
  try {
    if (ENV.DEBUG_MODE) {
      console.log(`🚢 Attempting to buy ship with ${paymentMethod}`);
    }
    
    let purchaseTxHash = null;

    if (paymentMethod === 'br') {
      // 1. Create and sign the token transfer transaction
      const connectedWallet = walletService.getConnectedWallet();
      if (!connectedWallet) {
        throw new Error('Wallet not connected');
      }
      const transferTransaction = await createTokenTransferTransactionToCommunity(connectedWallet.publicKey.toString(), ENV.SHIP_PRICE_BR);
      const signedTransferTx = await signAndSerializeTransaction(transferTransaction, connectedWallet.provider.signTransaction);

      // 2. Send this signed transaction to the Node.js Solana API's /purchase_ship endpoint
      if (window.AstroUI) {
        window.AstroUI.setStatus('Processing on-chain payment...');
      }
      const solanaTxResult = await apiService.processShipPurchaseTransaction(signedTransferTx);
      purchaseTxHash = solanaTxResult.signature; // Get the real transaction hash

    } else if (paymentMethod === 'sol') {
      // If SOL payment method is implemented with on-chain transaction
      // This part is currently not fully implemented in the provided code,
      // but would follow a similar pattern to BR payment.
      // For now, we'll assume 'signedTransaction' is the hash if it's passed.
      // If you have a signed SOL transaction, you would process it here
      // For example:
      // const solanaTxResult = await apiService.processSolPurchaseTransaction(signedSolTx);
      // purchaseTxHash = solanaTxResult.signature;
      purchaseTxHash = null; // Or the actual SOL transaction hash if implemented
    } else if (paymentMethod === 'test') {
      // For 'test' payment, no real on-chain transaction, so no hash
      purchaseTxHash = null;
    }

    // 3. Call the main game logic API's /buy_ship endpoint
    const result = await apiService.buyShipGameLogic(paymentMethod, purchaseTxHash);
    
    if (ENV.DEBUG_MODE) {
      console.log('🚢 Buy ship result:', result);
    }
    
    // Mark that player now has a ship
    window.hasShip = true;

    // Update App state to show the ship
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
    // Check if user has a ship
    if (!window.hasShip) {
      throw new Error('You need to get a ship first');
    }
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Preparing ${type} mission...`);
    }

    // Get connected wallet for burn transaction
    const connectedWallet = walletService.getConnectedWallet();
    if (!connectedWallet) {
      throw new Error('Wallet not connected');
    }

    // Create burn transaction
    const burnTransaction = await createBurnTransaction(connectedWallet.publicKey.toString(), ENV.PARTICIPATION_FEE);
    
    // Sign and serialize the transaction
    const signedBurnTx = await signAndSerializeTransaction(burnTransaction, connectedWallet.provider.signTransaction);

    if (window.AstroUI) {
      window.AstroUI.setStatus(`Launching ${type}…`);
    }

    await animateShipLaunch();

    if (window.AstroUI) {
      window.AstroUI.setStatus('In transit…');
    }

    await animateRaidTo(type);

    // REAL API CALL - This will save to database and now also burn tokens on-chain
    const result = await apiService.sendMission(type, mode, signedBurnTx);
    const { success, reward, br_balance } = result;
    
    // Always update the balance immediately with the server's value
    if (window.AstroUI && br_balance !== undefined) {
      window.AstroUI.setBalance(parseInt(br_balance));
    }

    // Store mission data in localStorage for timer
    if (success) {
      const cooldownSeconds = ENV.DEBUG_MODE ? 600 : 8 * 3600; // 10 minutes in debug mode, 8 hours otherwise
      
      const missionData = { 
        mission_type: type,
        mode: mode,
        ts_start: Math.floor(Date.now() / 1000),
        reward: reward,
        cooldown_seconds: cooldownSeconds,
        br_balance: result.br_balance // Store the updated balance
      };
      
      localStorage.setItem('bonkraiders_active_mission', JSON.stringify(missionData));
      
      // Update mission timer in UI
      if (window.updateActiveMission) {
        window.updateActiveMission(missionData);
        
        // Also update the balance immediately
        if (window.AstroUI && result.br_balance !== undefined) {
          window.AstroUI.setBalance(parseInt(result.br_balance));
        }
      }
    }

    if (window.AstroUI) {
      window.AstroUI.setStatus(success ? `Mission success! +${parseInt(reward).toLocaleString()} BR` : 'Mission failed - no rewards');
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
    
    // Handle user-friendly error messages
    let userMessage = error.message;
    
    // Specific handling for "Not enough BR" error
    if (error.message?.includes('Not enough BR')) {
      userMessage = 'Not enough BR tokens for this mission. Earn more by completing other missions or claiming rewards.';
    }
    // Special handling for cooldown violation
    else if (error.message?.includes('cooldown violation')) {
      // Calculate remaining cooldown time if possible
      let cooldownMessage = 'Mission cooldown active - please wait';
      
      // Try to get the active mission from localStorage
      try {
        const storedMission = localStorage.getItem('bonkraiders_active_mission');
        if (storedMission) {
          const missionData = JSON.parse(storedMission);
          const now = Math.floor(Date.now() / 1000);
          const missionStart = missionData.ts_start;
          const cooldownSeconds = missionData.cooldown_seconds || 8 * 3600; // 8 hours default
          const endTime = missionStart + cooldownSeconds;
          const timeLeft = endTime - now;
          
          if (timeLeft > 0) {
            // Format time left as HH:MM:SS
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;
            const formattedTime = [
              hours.toString().padStart(2, '0'),
              minutes.toString().padStart(2, '0'),
              seconds.toString().padStart(2, '0')
            ].join(':');
            
            cooldownMessage = `Cooldown active: ${formattedTime} remaining`;
          }
        }
      } catch (e) {
        console.error('Error parsing stored mission:', e);
      }
      
      // Show cooldown notification
      if (window.showCooldownNotification) {
        window.showCooldownNotification(cooldownMessage);
      }
      
      userMessage = cooldownMessage;
    }
    
    else if (error.message?.includes('Transaction cancelled by user')) {
      userMessage = 'Mission cancelled - transaction not approved';
    } else if (error.message?.includes('Insufficient tokens')) {
      userMessage = error.message; // Keep the specific token message
    } else if (error.message?.includes('Insufficient SOL')) {
      userMessage = 'Insufficient SOL for transaction fees';
    } else if (error.message?.includes('Network')) {
      userMessage = 'Network error - please try again';
    } else if (error.message?.includes('Authentication') || error.message?.includes('token')) {
      userMessage = 'Session expired - please refresh the page';
    }
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(userMessage);
    }
    
    // Only animate return if ship was launched
    if (window.__shipInFlight) {
      await animateShipReturn();
    }
    
    // Re-throw error for modal handling if needed
    throw error;
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
    const newBalance = parseInt(upgradeResult.br_balance || 0);
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Upgraded to L${newLevel}`);
      window.AstroUI.setBalance(newBalance);
    }
    
    // Refresh user profile to get updated data
    try {
      await apiService.getUserProfile();
    } catch (profileError) {
      console.warn('Failed to refresh profile after upgrade:', profileError);
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
    
    // Create raid transition with full animations AND battle
    await createRaidTransition(async () => {
      // REAL API CALL to Node.js server
      let result;
      try {
        result = await apiService.raidMission(missionId);
        const { stolen, br_balance } = result;
        
        // Start battle during the raid
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
      } catch (error) {
        // Handle raid failure but still show battle
        if (window.startRaidBattle) {
          await window.startRaidBattle();
        }
        
        // Re-throw the error to be caught by the outer try/catch
        throw error;
      }
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
      } else if (error.message?.includes('Reward already claimed')) {
        errorMessage = 'Reward already claimed by owner';
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
    const totalAmount = pending?.reduce((sum, item) => sum + parseInt(item.amount || 0), 0) || 0;
    
    if (ENV.DEBUG_MODE) {
      console.log('🎮 Claiming rewards, total amount:', totalAmount);
    }

    if (totalAmount <= 0) {
      throw new Error('No rewards to claim');
    }

    // Now we just withdraw the total amount directly
    const result = await apiService.withdrawTokens(totalAmount, 'claim'); // Explicitly set tx_type to 'claim'
    
    // Refresh user profile to get updated balance
    try {
      const profile = await apiService.getUserProfile();
      if (profile?.ship && window.AstroUI) {
        window.AstroUI.setBalance(profile.ship.balance || 0);
      }
    } catch (error) {}
    
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
  }
  catch (error) {
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
