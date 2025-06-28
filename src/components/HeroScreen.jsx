import React, { useEffect, useState } from 'react';
import walletService from '../services/walletService.js';
import DocumentationModal from './DocumentationModal';
import DocumentationModal from './DocumentationModal';

const HeroScreen = ({ onConnect, isLoading }) => {
  const [walletProviders, setWalletProviders] = useState([]);
  const [noWallet, setNoWallet] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

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
    
    console.log('🔍 Scanning for wallets...');
    console.log('window.solana:', !!window.solana);
    console.log('window.phantom:', !!window.phantom);
    console.log('window.solflare:', !!window.solflare);
    console.log('window.glow:', !!window.glow);
    console.log('window.backpack:', !!window.backpack);
    console.log('window.coin98:', !!window.coin98);
    
    // Wait for wallets to initialize
    const providers = await walletService.waitForWallets(2000);
    
    console.log('🔍 Found providers:', providers.map(p => p.name));
    
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
    window.open('https://phantom.app/download', '_blank');
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

      {/* Documentation Button */}
      <button
        className="documentation-btn"
        onClick={() => setShowDocs(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, rgba(0,60,120,0.8), rgba(0,40,80,0.9))',
          border: '2px solid #0cf',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          color: '#0cf',
          cursor: 'pointer',
          fontSize: '20px',
          fontFamily: "'Press Start 2P', monospace",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 16px rgba(0, 255, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.5)';
          e.target.style.background = 'linear-gradient(135deg, rgba(0,80,160,0.9), rgba(0,60,120,1))';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 16px rgba(0, 255, 255, 0.3)';
          e.target.style.background = 'linear-gradient(135deg, rgba(0,60,120,0.8), rgba(0,40,80,0.9))';
        }}
        title="View Documentation"
      >
        📚
      </button>

      {/* Documentation Modal */}
      {showDocs && (
        <DocumentationModal onClose={() => setShowDocs(false)} />
      )}

      {/* Documentation Button */}
      <button
        className="documentation-btn"
        onClick={() => setShowDocs(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, rgba(0,60,120,0.8), rgba(0,40,80,0.9))',
          border: '2px solid #0cf',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          color: '#0cf',
          cursor: 'pointer',
          fontSize: '20px',
          fontFamily: "'Press Start 2P', monospace",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 16px rgba(0, 255, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.5)';
          e.target.style.background = 'linear-gradient(135deg, rgba(0,80,160,0.9), rgba(0,60,120,1))';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 16px rgba(0, 255, 255, 0.3)';
          e.target.style.background = 'linear-gradient(135deg, rgba(0,60,120,0.8), rgba(0,40,80,0.9))';
        }}
        title="View Documentation"
      >
        📚
      </button>

      {/* Documentation Modal */}
      {showDocs && (
        <DocumentationModal onClose={() => setShowDocs(false)} />
      )}
    </div>
  );
};

export default HeroScreen;