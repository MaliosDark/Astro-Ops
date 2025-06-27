// src/utils/gameLogic.js
import { animateShipLaunch, animateRaidTo, animateShipReturn } from './shipAnimator';
import { createBurnTransaction, signAndSerializeTransaction, checkTokenBalance, getTokenBalance } from './solanaTransactions';
import walletService from '../services/walletService.js';
import apiService from '../services/apiService.js';
import ENV from '../config/environment.js';

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
 * Buy ship (one-time purchase)
 */
export async function buyShip() {
  try {
    const result = await apiService.buyShip();
    // Mark that player now has a ship
    window.hasShip = true;
    return result;
  } catch (error) {
    console.error('Buy ship error:', error);
    throw error;
  }
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

    const { success, reward, br_balance } = await apiService.sendMission(type, mode, signedBurnTx);
    
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
    const { level: newLevel, br_balance } = await apiService.upgradeShip(level);
    
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
    const { stolen, br_balance } = await apiService.raidMission(missionId);
    
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
    const { claimable_AT } = await apiService.claimRewards();
    
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
    return await apiService.getMissions();
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
    const { pending } = await apiService.getPendingRewards();
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