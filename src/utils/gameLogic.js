// src/utils/gameLogic.js
import { animateShipLaunch, animateRaidTo, animateShipReturn } from './shipAnimator';
import { createBurnTransaction, signAndSerializeTransaction, checkTokenBalance, getTokenBalance } from './solanaTransactions';
import walletService from '../services/walletService.js';
import sessionManager from '../services/sessionManager.js';
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
    
    // Ensure we have the signMessage function from the wallet service
    const signMessageFn = walletService.signMessage.bind(walletService);
    if (!signMessageFn) {
      throw new Error('Wallet service signMessage function not available');
    }
    
    const result = await sessionManager.authenticateUser(publicKey, signMessageFn);
    
    if (ENV.DEBUG_MODE) {
      console.log('✅ Re-authentication successful');
    }
    
    return result.token;
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
  return await sessionManager.authenticateUser(publicKey, signMessage);
}

/**
 * Buy ship (one-time purchase)
 */
export async function buyShip() {
  const result = await sessionManager.buyShip();
  
  // Mark that player now has a ship
  if (result.ship_id) {
    window.hasShip = true;
  }
  
  return result;
}

/**
 * Start a mission with animation and API call - EXACTLY like original
 */
export async function startMission(type, mode = 'Unshielded') {
  try {
    // Get wallet provider for signing
    const connectedWallet = walletService.getConnectedWallet();
    if (!connectedWallet) {
      throw new Error('Wallet not connected');
    }

    const userPublicKey = connectedWallet.publicKey;

    // Check if user has enough tokens
    const hasEnoughTokens = await checkTokenBalance(userPublicKey, ENV.PARTICIPATION_FEE);
    if (!hasEnoughTokens) {
      const balance = await getTokenBalance(userPublicKey);
      throw new Error(`Insufficient tokens. Need ${ENV.PARTICIPATION_FEE}, have ${balance}`);
    }

    if (window.AstroUI) {
      window.AstroUI.setStatus('Creating burn transaction...');
    }

    // Create burn transaction
    const burnTransaction = await createBurnTransaction(userPublicKey, ENV.PARTICIPATION_FEE);
    
    // Sign the transaction
    const signedBurnTx = await signAndSerializeTransaction(burnTransaction, connectedWallet.provider.signTransaction);

    if (window.AstroUI) {
      window.AstroUI.setStatus(`Launching ${type}…`);
    }
    
    await animateShipLaunch();
    
    if (window.AstroUI) {
      window.AstroUI.setStatus('In transit…');
    }
    
    await animateRaidTo(type);

    const { success, reward, br_balance } = await sessionManager.sendMission(type, mode, signedBurnTx);
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(success ? `Mission success! +${reward} BR` : 'Mission failed - no rewards');
      window.AstroUI.setBalance(br_balance);
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
 * Perform ship upgrade - EXACTLY like original
 */
export async function performUpgrade(level) {
  try {
    const { level: newLevel, br_balance } = await sessionManager.upgradeShip(level);
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Upgraded to L${newLevel}`);
      window.AstroUI.setBalance(br_balance);
    }
  } catch (error) {
    console.error('Upgrade failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Upgrade failed: ${error.message}`);
    }
  }
}

/**
 * Perform raid on another player's mission - EXACTLY like original
 */
export async function performRaid(missionId) {
  try {
    // Crear transición de raid con animaciones completas
    await createRaidTransition(async () => {
      // Lógica del raid dentro de la transición
      const { stolen, br_balance } = await sessionManager.raidMission(missionId);
      
      // Simular que el jugador objetivo inicia una batalla defensiva
      // (esto sería manejado por el servidor en un juego real)
      if (Math.random() < 0.3 && window.startDefenseBattle) {
        // 30% de probabilidad de que se active una batalla defensiva
        setTimeout(() => {
          window.startDefenseBattle();
        }, 2000);
      }
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Raid successful! Stolen ${stolen} BR`);
        window.AstroUI.setBalance(br_balance);
      }
      
      return { stolen, br_balance };
    });
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
  try {
    const { energy } = await sessionManager.getPlayerEnergy();
    return energy;
  } catch (error) {
    console.error('Get energy error:', error);
    return 10; // Default energy
  }
}

/**
 * Scan for raidable missions (costs 1 energy)
 */
export async function scanForRaids() {
  try {
    const { missions, remainingEnergy } = await sessionManager.scanForRaids();
    
    if (window.AstroUI) {
      window.AstroUI.setEnergy(remainingEnergy);
    }
    
    return missions;
  } catch (error) {
    console.error('Scan for raids error:', error);
    return [];
  }
}

/**
 * Original performRaid function for compatibility
 */
export async function performRaidOriginal(missionId) {
  try {
    const { stolen, br_balance } = await sessionManager.raidMission(missionId);
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Raid successful! Stolen ${stolen} BR`);
      window.AstroUI.setBalance(br_balance);
    }
  } catch (error) {
    console.error('Raid failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Raid failed: ${error.message}`);
    }
  }
}

/**
 * Claim accumulated rewards - EXACTLY like original
 */
export async function performClaim() {
  try {
    const { claimable_AT } = await sessionManager.claimRewards();
    
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Claimed ${claimable_AT} BR tokens`);
      window.AstroUI.setBalance(claimable_AT);
    }
  } catch (error) {
    console.error('Claim failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Claim failed: ${error.message}`);
    }
  }
}

/**
 * Get list of missions available for raiding - EXACTLY like original
 */
export async function getMissionsForRaid() {
  try {
    return await sessionManager.getMissions();
  } catch (error) {
    console.error('Get missions error:', error);
    return [];
  }
}

/**
 * Get pending rewards - EXACTLY like original
 */
export async function getPendingRewards() {
  try {
    const { pending } = await sessionManager.getPendingRewards();
    return pending || [];
  } catch (error) {
    console.error('Get pending rewards error:', error);
    return [];
  }
}

// Expose functions globally for compatibility - EXACTLY like original
window.startMission = startMission;
window.performUpgrade = performUpgrade;
window.performRaid = performRaid;
window.performClaim = performClaim;