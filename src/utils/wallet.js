// src/utils/wallet.js

/**
 * Gets the Solana provider from window.solana
 */
export function getSolanaProvider() {
  if (!window.solana) {
    return null;
  }
  
  // If multiple providers, return the first one
  if (Array.isArray(window.solana.providers)) {
    return window.solana.providers[0];
  }
  
  return window.solana;
}

/**
 * Connect to wallet with error handling
 */
export async function connectWallet() {
  console.log('🚀 connectWallet fired');
  const provider = getSolanaProvider();
  
  if (!provider) {
    alert(
      'No Solana wallet detected.\n' +
      'Ensure you\'re on HTTPS (or http://localhost) and have Phantom, Solflare, Glow, etc. installed.'
    );
    return null;
  }

  try {
    const resp = await provider.connect();
    return {
      provider,
      publicKey: resp.publicKey.toString()
    };
  } catch (err) {
    console.error('❌ Wallet connection failed', err);
    alert('Connection failed: ' + (err.message || err));
    return null;
  }
}