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