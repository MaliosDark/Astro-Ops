import React, { useEffect, useState } from 'react';
import { getAllSolanaProviders, waitForWallets } from '../utils/wallet';

const HeroScreen = ({ onConnect, isLoading }) => {
  const [walletProviders, setWalletProviders] = useState([]);
  const [noWallet, setNoWallet] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    scanForWallets();
    
    // Listen for wallet installation
    const handleWalletChange = () => {
      setTimeout(scanForWallets, 100);
    };
    
    window.addEventListener('solana#initialized', handleWalletChange);
    window.addEventListener('phantom#initialized', handleWalletChange);
    
    // Also listen for window load
    if (document.readyState === 'loading') {
      window.addEventListener('load', handleWalletChange);
    }
    
    return () => {
      window.removeEventListener('solana#initialized', handleWalletChange);
      window.removeEventListener('phantom#initialized', handleWalletChange);
      window.removeEventListener('load', handleWalletChange);
    };
  }, []);

  const scanForWallets = async () => {
    setIsScanning(true);
    
    // Wait for wallets to initialize
    const providers = await waitForWallets(2000);
    
    if (providers.length === 0) {
      setNoWallet(true);
      setWalletProviders([]);
    } else {
      setNoWallet(false);
      setWalletProviders(providers);
    }
    
    setIsScanning(false);
  };

  const handleConnect = (provider) => {
    onConnect(provider);
  };

  const handleInstallWallet = () => {
    // Open Phantom installation page
    window.open('https://phantom.app/', '_blank');
  };

  return (
    <div id="hero">
      <h1>BONK RAIDERS</h1>
      <p>Explore. Raid. Earn.</p>

      {isLoading && (
        <p style={{ color: '#fc0', fontSize: '12px', margin: '10px 0' }}>
          Connecting and setting up...
        </p>
      )}
      
      {isScanning && !isLoading && (
        <p style={{ color: '#0cf', fontSize: '12px', margin: '10px 0' }}>
          Scanning for wallets...
        </p>
      )}

      <div id="wallet-selector" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        {!isScanning && walletProviders.map(({ name, provider, icon }, index) => (
          <button
            key={index}
            className="gb-btn"
            disabled={isLoading}
            onClick={() => handleConnect(provider)}
            style={{
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '200px',
              justifyContent: 'center'
            }}
          >
            {icon && (
              <img 
                src={icon} 
                alt={`${name} icon`} 
                style={{ width: '20px', height: '20px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {isLoading ? 'Connecting...' : `Connect ${name}`}
          </button>
        ))}
      </div>

      {!isScanning && noWallet && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: '#fc0', fontSize: '12px', marginBottom: '10px' }}>
            No Solana wallet detected
          </p>
          <button 
            className="gb-btn" 
            onClick={handleInstallWallet}
            style={{ marginBottom: '10px' }}
          >
            Install Phantom Wallet
          </button>
          <p style={{ color: '#888', fontSize: '10px' }}>
            Supported wallets: Phantom, Solflare, Glow, Backpack, Coin98
          </p>
          <button 
            className="gb-btn" 
            onClick={scanForWallets}
            style={{ marginTop: '10px', fontSize: '10px', padding: '6px 12px' }}
          >
            Rescan for Wallets
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroScreen;