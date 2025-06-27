// src/utils/wallet.js

/**
 * Gets all available Solana wallet providers
 */
export function getAllSolanaProviders() {
  const providers = [];
  
  // Check for Phantom specifically
  if (window.phantom?.solana) {
    const walletInfo = getWalletInfo(window.phantom.solana);
    if (walletInfo) {
      providers.push(walletInfo);
    }
  }
  
  // Check for Solflare
  if (window.solflare) {
    const walletInfo = getWalletInfo(window.solflare);
    if (walletInfo) {
      providers.push(walletInfo);
    }
  }
  
  // Check for Glow
  if (window.glow) {
    const walletInfo = getWalletInfo(window.glow);
    if (walletInfo) {
      providers.push(walletInfo);
    }
  }
  
  // Check for Backpack
  if (window.backpack) {
    const walletInfo = getWalletInfo(window.backpack);
    if (walletInfo) {
      providers.push(walletInfo);
    }
  }
  
  // Check for Coin98
  if (window.coin98?.sol) {
    const walletInfo = getWalletInfo(window.coin98.sol);
    if (walletInfo) {
      providers.push(walletInfo);
    }
  }
  
  // Check window.solana (fallback for other wallets)
  if (window.solana && !providers.some(p => p.provider === window.solana)) {
    if (Array.isArray(window.solana.providers)) {
      window.solana.providers.forEach(provider => {
        const walletInfo = getWalletInfo(provider);
        if (walletInfo && !providers.some(p => p.provider === provider)) {
          providers.push(walletInfo);
        }
      });
    } else {
      const walletInfo = getWalletInfo(window.solana);
      if (walletInfo && !providers.some(p => p.provider === window.solana)) {
        providers.push(walletInfo);
      }
    }
  }
  
  return providers;
}

/**
 * Wait for wallets to load and get providers
 */
export function waitForWallets(timeout = 3000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let lastProviderCount = 0;
    
    const checkInterval = setInterval(() => {
      const providers = getAllSolanaProviders();
      const elapsed = Date.now() - startTime;
      
      // If we found providers or timeout reached
      if (providers.length > 0 || elapsed >= timeout) {
        clearInterval(checkInterval);
        resolve(providers);
        return;
      }
      
      // If provider count changed, reset timer a bit to allow more wallets to load
      if (providers.length > lastProviderCount) {
        lastProviderCount = providers.length;
      }
    }, 100);
    
    // Also listen for wallet events
    const handleWalletEvent = () => {
      const providers = getAllSolanaProviders();
      if (providers.length > 0) {
        clearInterval(checkInterval);
        resolve(providers);
      }
    };
    
    window.addEventListener('solana#initialized', handleWalletEvent);
    window.addEventListener('phantom#initialized', handleWalletEvent);
    
    // Cleanup listeners after timeout
    setTimeout(() => {
      window.removeEventListener('solana#initialized', handleWalletEvent);
      window.removeEventListener('phantom#initialized', handleWalletEvent);
    }, timeout);
  });
}

/**
 * Gets all available Solana wallet providers (legacy function)
 */
export function getAllSolanaProvidersLegacy() {
  const providers = [];
  
  if (!window.solana) {
    return providers;
  }

  // Check if multiple providers exist
  if (Array.isArray(window.solana.providers)) {
    // Multiple wallets detected
    window.solana.providers.forEach(provider => {
      const walletInfo = getWalletInfo(provider);
      if (walletInfo) {
        providers.push(walletInfo);
      }
    });
  } else {
    // Single wallet detected
    const walletInfo = getWalletInfo(window.solana);
    if (walletInfo) {
      providers.push(walletInfo);
    }
  }

  return providers;
}

/**
 * Gets wallet information from a provider
 */
function getWalletInfo(provider) {
  if (!provider) return null;

  let name = 'Unknown Wallet';
  let icon = null;

  // Detect wallet type
  if (provider.isPhantom || provider._phantom || window.phantom?.solana === provider) {
    name = 'Phantom';
    icon = 'https://phantom.app/img/phantom-logo.png';
  } else if (provider.isSolflare) {
    name = 'Solflare';
    icon = 'https://solflare.com/img/logo.svg';
  } else if (provider.isGlow) {
    name = 'Glow';
    icon = 'https://glow.app/img/logo.svg';
  } else if (provider.isTorus) {
    name = 'Torus';
    icon = 'https://tor.us/images/torus-logo-blue.svg';
  } else if (provider.isBackpack) {
    name = 'Backpack';
    icon = 'https://backpack.app/logo192.png';
  } else if (provider.isCoin98) {
    name = 'Coin98';
    icon = 'https://coin98.com/images/coin98-logo.png';
  } else if (provider.isMathWallet) {
    name = 'MathWallet';
    icon = 'https://mathwallet.org/images/logo.png';
  } else if (provider.isSollet) {
    name = 'Sollet';
    icon = 'https://www.sollet.io/logo192.png';
  } else if (provider.isExodus) {
    name = 'Exodus';
    icon = 'https://www.exodus.com/img/logo/exodus-logo.svg';
  } else if (provider.isSlope) {
    name = 'Slope';
    icon = 'https://slope.finance/img/logo.svg';
  }

  return {
    name,
    provider,
    icon
  };
}

/**
 * Gets the primary Solana provider (for backwards compatibility)
 */
export function getSolanaProvider() {
  const providers = getAllSolanaProviders();
  return providers.length > 0 ? providers[0].provider : null;
}

/**
 * Detects if specific wallet is installed
 */
export function isWalletInstalled(walletName) {
  const providers = getAllSolanaProviders();
  return providers.some(p => p.name.toLowerCase() === walletName.toLowerCase());
}

/**
 * Gets a specific wallet provider by name
 */
export function getWalletProvider(walletName) {
  const providers = getAllSolanaProviders();
  const wallet = providers.find(p => p.name.toLowerCase() === walletName.toLowerCase());
  return wallet ? wallet.provider : null;
}

/**
 * Connect to wallet with error handling
 */
export async function connectWallet(provider) {
  if (!provider) {
    throw new Error('No wallet provider specified');
  }

  try {
    const resp = await provider.connect();
    return {
      provider,
      publicKey: resp.publicKey.toString()
    };
  } catch (err) {
    console.error('❌ Wallet connection failed', err);
    throw new Error('Connection failed: ' + (err.message || err));
  }
}