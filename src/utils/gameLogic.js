// src/utils/gameLogic.js
import { 
  animateShipLaunch, 
  animateRaidTo, 
  animateShipReturn 
} from './shipAnimator';
import { 
  createBurnTransaction, 
  signAndSerializeTransaction, 
  checkTokenBalance,
  getTokenBalance,
  PARTICIPATION_FEE 
} from './solanaTransactions';

// JWT will be set after authentication
window._jwt = null;

/**
 * Authenticate with the server using wallet signature
 */
export async function authenticateWallet(publicKey, signMessage) {
  try {
    // 1. Get nonce
    const nonceResponse = await fetch('https://api.bonkraiders.com/api.php?action=auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey })
    });
    
    if (!nonceResponse.ok) {
      throw new Error('Failed to get nonce');
    }
    
    const { nonce } = await nonceResponse.json();

    // 2. Sign the nonce
    const encoded = new TextEncoder().encode(nonce);
    const signature = await signMessage(encoded);
    const signatureB64 = Buffer.from(signature).toString('base64');

    // 3. Login with signature
    const loginResponse = await fetch('https://api.bonkraiders.com/api.php?action=auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey,
        nonce,
        signature: signatureB64
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Authentication failed');
    }

    const { token } = await loginResponse.json();
    window._jwt = token;
    
    return token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Buy ship (one-time purchase)
 */
export async function buyShip() {
  try {
    const response = await fetch('https://api.bonkraiders.com/api.php?action=buy_ship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window._jwt}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to buy ship');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Buy ship error:', error);
    throw error;
  }
}

/**
 * Start a mission with animation and API call
 */
export async function startMission(type, mode = 'Unshielded') {
  try {
    // Get wallet provider for signing
    const provider = window.solana;
    if (!provider || !provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    const userPublicKey = provider.publicKey.toString();

    // Check if user has enough tokens
    const hasEnoughTokens = await checkTokenBalance(userPublicKey, PARTICIPATION_FEE);
    if (!hasEnoughTokens) {
      const balance = await getTokenBalance(userPublicKey);
      throw new Error(`Insufficient tokens. Need ${PARTICIPATION_FEE}, have ${balance}`);
    }

    if (window.AstroUI) {
      window.AstroUI.setStatus('Creating burn transaction...');
    }

    // Create burn transaction
    const burnTransaction = await createBurnTransaction(userPublicKey, PARTICIPATION_FEE);
    
    // Sign the transaction
    const signedBurnTx = await signAndSerializeTransaction(burnTransaction, provider.signTransaction);

    if (window.AstroUI) {
      window.AstroUI.setStatus(`Launching ${type}…`);
    }
    
    await animateShipLaunch();
    
    if (window.AstroUI) {
      window.AstroUI.setStatus('In transit…');
    }
    
    await animateRaidTo(type);

    const response = await fetch('https://api.bonkraiders.com/api.php?action=send_mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window._jwt}`
      },
      body: JSON.stringify({ 
        type, 
        mode,
        signedBurnTx: signedBurnTx
      })
    });

    if (response.ok) {
      const { success, reward, br_balance } = await response.json();
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(success ? `+${reward} BR` : 'Mission failed');
        window.AstroUI.setBalance(br_balance);
      }
    } else {
      const error = await response.json();
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Mission failed: ${error.error}`);
      }
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
 * Perform ship upgrade
 */
export async function performUpgrade(level) {
  try {
    const response = await fetch('https://api.bonkraiders.com/api.php?action=upgrade_ship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window._jwt}`
      },
      body: JSON.stringify({ level })
    });

    if (response.ok) {
      const { level: newLevel, br_balance } = await response.json();
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Upgraded to L${newLevel}`);
        window.AstroUI.setBalance(br_balance);
      }
    } else {
      const error = await response.json();
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Upgrade failed: ${error.error}`);
      }
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
    const response = await fetch('https://api.bonkraiders.com/api.php?action=raid_mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window._jwt}`
      },
      body: JSON.stringify({ mission_id: missionId })
    });

    if (response.ok) {
      const { stolen, br_balance } = await response.json();
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`+${stolen} BR stolen!`);
        window.AstroUI.setBalance(br_balance);
      }
    } else {
      const error = await response.json();
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Raid failed: ${error.error}`);
      }
    }
  } catch (error) {
    console.error('Raid failed:', error);
    if (window.AstroUI) {
      window.AstroUI.setStatus(`Raid failed: ${error.message}`);
    }
  }
}

/**
 * Claim accumulated rewards
 */
export async function performClaim() {
  try {
    const response = await fetch('https://api.bonkraiders.com/api.php?action=claim_rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window._jwt}`
      }
    });

    if (response.ok) {
      const { claimable_AT } = await response.json();
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Balance: ${claimable_AT} AT`);
        window.AstroUI.setBalance(claimable_AT);
      }
    } else {
      const error = await response.json();
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Claim failed: ${error.error}`);
      }
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
  try {
    const response = await fetch('https://api.bonkraiders.com/api.php?action=list_missions', {
      headers: {
        'Authorization': `Bearer ${window._jwt}`
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to get missions');
      return [];
    }
  } catch (error) {
    console.error('Get missions error:', error);
    return [];
  }
}

/**
 * Get pending rewards
 */
export async function getPendingRewards() {
  try {
    const response = await fetch('https://api.bonkraiders.com/api.php?action=pending_missions', {
      headers: {
        'Authorization': `Bearer ${window._jwt}`
      }
    });

    if (response.ok) {
      const { pending } = await response.json();
      return pending || [];
    } else {
      console.error('Failed to get pending rewards');
      return [];
    }
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
window.authenticateWallet = authenticateWallet;
window.buyShip = buyShip;