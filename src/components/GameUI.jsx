import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import { getTokenBalance } from '../utils/solanaTransactions';
import apiService from '../services/apiService';
import sessionManager from '../services/sessionManager';
import walletService from '../services/walletService';
import ENV from '../config/environment.js';

const GameUI = ({ walletAddress, onShowModal, onDisconnect }) => {
  const [balance, setBalance] = useState(0);
  const [kills, setKills] = useState(0);
  const [raidsWon, setRaidsWon] = useState(0);
  const [mode, setMode] = useState('—');
  const [status, setStatus] = useState('');
  const [energy, setEnergy] = useState(10);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  useEffect(() => {
    // Show the game UI - EXACTLY like original
    const gameCanvas = document.getElementById('game-canvas');
    const gbUI = document.getElementById('gb-ui');
    
    if (gameCanvas) gameCanvas.style.display = 'block';
    if (gbUI) gbUI.style.display = 'flex';

    // Load initial data from server
    const loadInitialData = async () => {
      try {
        // Load REAL user profile from server
        const profile = await apiService.getUserProfile();
        // Also fetch token balance
        const wallet = walletService.getConnectedWallet();
        if (wallet) {
          const balance = await getTokenBalance(wallet.publicKey);
          setTokenBalance(balance);
        }
        
        if (profile) {
          // Update UI with REAL data from database
          if (profile.ship) {
            setBalance(profile.ship.balance || 0);
          }
          
          if (profile.stats) {
            setKills(profile.stats.total_kills || 0);
            setRaidsWon(profile.stats.total_raids_won || 0);
            
            // Update global counters with REAL data
            window.killCount = profile.stats.total_kills || 0;
            window.raidWins = profile.stats.total_raids_won || 0;
          }
          
          if (profile.energy) {
            setEnergy(profile.energy.current || 10);
          }
        }
        
        if (ENV.DEBUG_MODE) {
          console.log('💰 Loaded REAL user profile from database:', profile);
        }
      } catch (error) {
        console.error('Failed to load REAL user profile:', error);
        // Use zeros if loading fails (real starting values)
        setBalance(0);
        setKills(0);
        setRaidsWon(0);
        setEnergy(10);
      }
    };
    
    if (walletAddress) {
      loadInitialData();
    }

    // Expose AstroUI API globally for compatibility - EXACTLY like original
    window.AstroUI = {
      setWallet: (id) => {
        // Already handled by props
      },
      setBalance: (at) => {
        setBalance(at);
      },
      setStatus: (msg) => {
        setStatus(msg);
        if (msg) {
          setTimeout(() => setStatus(''), 3000);
        }
      },
      setKills: (count) => {
        setKills(count);
      },
      setRaidsWon: (count) => {
        setRaidsWon(count);
      },
      setMode: (mode) => {
        const label = {
          unshielded: 'Unshielded',
          shielded: 'Shielded',
          decoy: 'Decoy'
        }[mode] || mode;
        setMode(label);
      },
      setEnergy: (energyValue) => {
        setEnergy(energyValue);
      },
      // Hook functions - EXACTLY like original
      onMission: (fn) => { 
        const btn = document.getElementById('btn-mission');
        if (btn) btn.onclick = fn;
      },
      onUpgrade: (fn) => { 
        const btn = document.getElementById('btn-upgrade');
        if (btn) btn.onclick = fn;
      },
      onRaid: (fn) => { 
        const btn = document.getElementById('btn-raid');
        if (btn) btn.onclick = fn;
      },      
      onHelp: (fn) => { 
        const btn = document.getElementById('btn-help');
        if (btn) btn.onclick = fn;
      },
      onWalletBalance: (fn) => {
        const btn = document.getElementById('btn-wallet');
        if (btn) btn.onclick = fn;
      },
      onClaim: (fn) => {
        // Claim button is now removed from UI, but keep for compatibility
      }
    };

    // Initialize global counters - EXACTLY like original
    window.killCount = 0;
    window.raidWins = 0;
  }, [walletAddress]);

  const handleMouseMove = (e, tip) => {
    if (tip) {
      setTooltip({
        visible: true,
        text: tip,
        x: e.clientX + 10,
        y: e.clientY + 10
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect your wallet?')) {
      try {
        await walletService.disconnect();
        if (onDisconnect) {
          onDisconnect();
        }
        // Clear any cached data
        sessionStorage.clear();
        localStorage.removeItem('bonkraiders_jwt');
        localStorage.removeItem('bonkraiders_session');
        // Reload the page to reset state
        window.location.reload();
      } catch (error) {
        console.error('Disconnect error:', error);
        // Force reload even if disconnect fails
        window.location.reload();
      }
    }
  };

  const handleShowWalletBalance = () => {
    onShowModal('walletBalance');
  };

  return (
    <div id="gb-ui" className="game-ui-container">
      <div id="top-hud" className="top-hud-container">
        <div className="info-panel-group">
          <div className="info-panel wallet-panel">
            <div className="panel-header">PILOT</div>
            <div className="panel-content">
              <span className="wallet-address" title={walletAddress}>
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                <span 
                  style={{ 
                    marginLeft: '8px', 
                    cursor: 'pointer', 
                    color: '#0cf',
                    fontSize: '10px'
                  }}
                  onClick={handleShowWalletBalance}
                  title="View wallet balance"
                >
                  🔍
                </span>
              </span>
              <button 
                className="disconnect-btn"
                onClick={handleDisconnect}
                title="Disconnect Wallet"
              >
                ⏻
              </button>
            </div>
          </div>
          
          <div className="info-panel balance-panel">
            <div className="panel-header">CREDITS</div>
            <div className="panel-content">
              <span className="balance-value">{balance.toFixed(1)}</span>
              <span className="balance-unit">BR</span>
            </div>
          </div>
        </div>
        
        <div className="stats-panel-group">
          <div className="info-panel stats-panel">
            <div className="panel-header">COMBAT</div>
            <div className="panel-content stats-grid">
              <div className="stat-item">
                <span className="stat-label">KILLS</span>
                <span className="stat-value">{kills}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">RAIDS</span>
                <span className="stat-value">{raidsWon}</span>
              </div>
            </div>
          </div>
          
          <div className="info-panel status-panel">
            <div className="panel-header">STATUS</div>
            <div className="panel-content status-grid">
              <div className="status-item">
                <span className="status-label">MODE</span>
                <span className="status-value">{mode}</span>
              </div>
              <div className="status-item">
                <span className="status-label">ENERGY</span>
                <span className="status-value">{energy}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {status && (
        <div id="status-panel" className="status-message-panel" style={{ visibility: 'visible' }}>
          <div className="status-content">
            <span className="status-icon">⚡</span>
            <span id="status-msg">{status}</span>
          </div>
        </div>
      )}

      <div id="bottom-hud" className="action-panel-container">
        <button 
          className="action-btn mission-btn" 
          id="btn-mission"
          data-tip="Send your ship on a mission"
          onClick={() => onShowModal('mission')}
          onMouseMove={(e) => handleMouseMove(e, 'Send your ship on a mission')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="btn-icon">🚀</div>
          <div className="btn-text">MISSION</div>
        </button>
        
        <button 
          className="action-btn upgrade-btn" 
          id="btn-upgrade"
          data-tip="Upgrade your ship"
          onClick={() => onShowModal('upgrade')}
          onMouseMove={(e) => handleMouseMove(e, 'Upgrade your ship')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="btn-icon">⚙️</div>
          <div className="btn-text">UPGRADE</div>
        </button>
        
        <button 
          className="action-btn raid-btn" 
          id="btn-raid"
          data-tip="Raid another player"
          onClick={() => onShowModal('raid')}
          onMouseMove={(e) => handleMouseMove(e, 'Raid another player')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="btn-icon">⚔️</div>
          <div className="btn-text">RAID</div>
          <div className="btn-badge">{energy}</div>
        </button>
                
        <button 
          className="action-btn wallet-btn" 
          id="btn-wallet"
          data-tip="View wallet balance"
          onClick={handleShowWalletBalance}
          onMouseMove={(e) => handleMouseMove(e, 'View wallet balance')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="btn-icon">💼</div>
          <div className="btn-text">WALLET</div>
        </button>
        
        <button 
          className="action-btn help-btn" 
          id="btn-help"
          data-tip="How to Play"
          onClick={() => onShowModal('howto')}
          onMouseMove={(e) => handleMouseMove(e, 'How to Play')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="btn-icon">❓</div>
          <div className="btn-text">HELP</div>
        </button>
      </div>

      <Tooltip tooltip={tooltip} />
    </div>
  );
};

export default GameUI;