import React, { useEffect, useState } from 'react';
import { getSolanaProvider } from '../utils/wallet';

const HeroScreen = ({ onConnect, isLoading }) => {
  const [walletProviders, setWalletProviders] = useState([]);
  const [noWallet, setNoWallet] = useState(false);

  useEffect(() => {
    renderWalletOptions();
  }, []);

  const renderWalletOptions = () => {
    // No window.solana at all?
    if (!window.solana) {
      setNoWallet(true);
      return;
    }

    setNoWallet(false);

    // phantom+solflare+… might live in window.solana.providers array
    const providers = Array.isArray(window.solana.providers)
      ? window.solana.providers
      : [window.solana];

    const walletList = providers.map(provider => {
      let name = 'Unknown Wallet';
      if (provider.isPhantom) name = 'Phantom';
      if (provider.isSolflare) name = 'Solflare';
      if (provider.isGlow) name = 'Glow';
      if (provider.isTorus) name = 'Torus';

      return { name, provider };
    });

    setWalletProviders(walletList);
  };

  const handleConnect = (provider) => {
    onConnect(provider);
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

      <div id="wallet-selector">
        {walletProviders.map(({ name, provider }, index) => (
          <button
            key={index}
            className="gb-btn"
            disabled={isLoading}
            onClick={() => handleConnect(provider)}
            style={{
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Connecting...' : `Connect ${name}`}
          </button>
        ))}
      </div>

      {noWallet && (
        <button className="gb-btn" style={{ display: 'block' }}>
          No Wallet Found
        </button>
      )}
    </div>
  );
};

export default HeroScreen;