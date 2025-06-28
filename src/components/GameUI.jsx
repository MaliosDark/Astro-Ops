import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import { getTokenBalance } from '../utils/solanaTransactions';
import ENV from '../config/environment.js';

const GameUI = ({ walletAddress, onShowModal }) => {
  const [balance, setBalance] = useState(0);
  const [kills, setKills] = useState(0);
  const [raidsWon, setRaidsWon] = useState(0);
  const [mode, setMode] = useState('—');
  const [status, setStatus] = useState('');
  const [energy, setEnergy] = useState(10);
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
        // Try to get user profile from server to load real data
        const profile = await apiService.getUserProfile();
        
        if (profile) {
          // Update UI with real data from server
          if (profile.ship) {
            setBalance(profile.ship.balance || 0);
          }
          
          if (profile.stats) {
            setKills(profile.stats.total_kills || 0);
            setRaidsWon(profile.stats.total_raids_won || 0);
            
            // Update global counters
            window.killCount = profile.stats.total_kills || 0;
            window.raidWins = profile.stats.total_raids_won || 0;
          }
          
          if (profile.energy) {
            setEnergy(profile.energy.current || 10);
          }
        }
        
        if (ENV.DEBUG_MODE) {
          console.log('💰 Loaded user profile:', profile);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Use defaults if loading fails
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
      onClaim: (fn) => { 
        const btn = document.getElementById('btn-claim');
        if (btn) btn.onclick = fn;
      },
      onHelp: (fn) => { 
        const btn = document.getElementById('btn-help');
        if (btn) btn.onclick = fn;
      },
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

  return (
    <div id="gb-ui" style={{ display: 'flex' }}>
      <div id="top-hud">
        <div className="panel info">Wallet: <span id="wallet-id">{walletAddress}</span></div>
        <div className="panel info">BR: <span id="balance-val">{balance.toFixed(1)}</span></div>
        <div className="panel info">Kills: <span id="kill-count">{kills}</span></div>
        <div className="panel info">Raids Won: <span id="raid-wins">{raidsWon}</span></div>
        <div className="panel info">Mode: <span id="mode-val">{mode}</span></div>
        <div className="panel info">Energy: <span id="energy-val">{energy}/10</span></div>
      </div>

      {status && (
        <div id="status-panel" style={{ visibility: 'visible' }}>
          Status: <span id="status-msg">{status}</span>
        </div>
      )}

      <div id="bottom-hud">
        <button 
          className="gb-btn" 
          id="btn-mission"
          data-tip="Send your ship on a mission"
          onClick={() => onShowModal('mission')}
          onMouseMove={(e) => handleMouseMove(e, 'Send your ship on a mission')}
          onMouseLeave={handleMouseLeave}
        >
          MISSION
        </button>
        <button 
          className="gb-btn" 
          id="btn-upgrade"
          data-tip="Upgrade your ship"
          onClick={() => onShowModal('upgrade')}
          onMouseMove={(e) => handleMouseMove(e, 'Upgrade your ship')}
          onMouseLeave={handleMouseLeave}
        >
          UPGRADE
        </button>
        <button 
          className="gb-btn" 
          id="btn-raid"
          data-tip="Raid another player"
          onClick={() => onShowModal('raid')}
          onMouseMove={(e) => handleMouseMove(e, 'Raid another player')}
          onMouseLeave={handleMouseLeave}
        >
          RAID ({energy})
        </button>
        <button 
          className="gb-btn" 
          id="btn-claim"
          data-tip="Claim accumulated AT"
          onClick={() => onShowModal('claim')}
          onMouseMove={(e) => handleMouseMove(e, 'Claim accumulated AT')}
          onMouseLeave={handleMouseLeave}
        >
          CLAIM
        </button>
        <button 
          className="gb-btn" 
          id="btn-help"
          data-tip="How to Play"
          onClick={() => onShowModal('howto')}
          onMouseMove={(e) => handleMouseMove(e, 'How to Play')}
          onMouseLeave={handleMouseLeave}
        >
          HELP
        </button>
      </div>

      <Tooltip tooltip={tooltip} />
    </div>
  );
};

export default GameUI;