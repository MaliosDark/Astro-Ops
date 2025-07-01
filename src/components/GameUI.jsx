import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import { getTokenBalance } from '../utils/solanaTransactions';
import apiService from '../services/apiService';
import sessionManager from '../services/sessionManager';
import walletService from '../services/walletService';
import ENV from '../config/environment';


const GameUI = ({ walletAddress, onShowModal, onDisconnect }) => {
  const [balance, setBalance] = useState(0);
  const [kills, setKills] = useState(0);
  const [raidsWon, setRaidsWon] = useState(0);
  const [mode, setMode] = useState('—');
  const [status, setStatus] = useState('');
  const [energy, setEnergy] = useState(10);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [activeMission, setActiveMission] = useState(null);
  const [missionTimeLeft, setMissionTimeLeft] = useState(null);
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
            // Always use the server's balance value for consistency
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
          
          // Check for active mission from server
          if (profile.active_mission) {
            setActiveMission(profile.active_mission);
            
            // Update localStorage to match server data
            localStorage.setItem('bonkraiders_active_mission', JSON.stringify(profile.active_mission));
            
            // Update global state
            if (window.updateActiveMission) {
              window.updateActiveMission(profile.active_mission);
            }
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
      
      // Set up periodic refresh to keep balance in sync with server
      const refreshInterval = setInterval(() => {
        loadInitialData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(refreshInterval);
    }
    
    // Set up global function to update active mission
    window.updateActiveMission = (missionData) => {
      setActiveMission(missionData);
    };
    
    return () => {
      window.updateActiveMission = null;
    };

    // Expose AstroUI API globally for compatibility - EXACTLY like original
    window.AstroUI = {
      ...window.AstroUI,
      setWallet: (id) => {
        // Already handled by props
      },
      setBalance: (at) => {
        // Always update the UI with the latest balance
        const newBalance = typeof at === 'number' ? at : parseFloat(at) || 0;
        setBalance(newBalance);
      },
      setStatus: (msg) => {
        setStatus(msg);
        if (msg) {
          setTimeout(() => setStatus(''), 3000);
        }
      },
      // Update kill count in both UI and global state
      setKills: (count) => {
        setKills(count);
      },
      setRaidsWon: (count) => {
        setRaidsWon(count);
        window.raidWins = count;
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

  // Mission timer effect
  useEffect(() => {
    if (!activeMission) {
      setMissionTimeLeft(null);
      return;
    }
    
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const missionStart = activeMission.ts_start;
      const cooldownSeconds = 8 * 3600; // 8 hours in seconds

      // If mission has a custom cooldown, use that instead
      const missionCooldown = activeMission.cooldown_seconds || cooldownSeconds;
      
      const endTime = missionStart + missionCooldown;
      const timeLeft = endTime - now;
      
      if (timeLeft <= 0) {
        // Mission has completed
        setMissionTimeLeft(null);
        setActiveMission(null);
        
        // Refresh user profile to get updated balance
        loadInitialData();

        // Remove mission data from localStorage
        localStorage.removeItem('bonkraiders_active_mission');

        if (window.AstroUI) {
          window.AstroUI.setStatus('Mission completed!');
        }
        
        return null;
      }
      
      return timeLeft;
    };
    
    // Initial calculation
    setMissionTimeLeft(calculateTimeLeft());
    
    // Set up interval to update timer
    const timerInterval = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setMissionTimeLeft(timeLeft);
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [activeMission]);
  
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
          // Ensure UI balance matches server balance
          setBalance(profile.ship.balance || 0);
        }
        
        if (profile.stats) {
          setKills(profile.stats.total_kills || 0);
          setRaidsWon(profile.stats.total_raids_won || 0);
          
          // Update global counters with REAL data from database
          window.killCount = profile.stats.total_kills || 0;
          window.raidWins = profile.stats.total_raids_won || 0;
        }
        
        if (profile.energy) {
          setEnergy(profile.energy.current || 10);
        }
        
        // Check for active mission from server
        if (profile.active_mission) {
          setActiveMission(profile.active_mission);
        } else {
          // Check if there's a mission in localStorage
          const storedMission = localStorage.getItem('bonkraiders_active_mission');
          if (storedMission) {
            try {
              const missionData = JSON.parse(storedMission);
              const now = Math.floor(Date.now() / 1000);
              const missionStart = missionData.ts_start;
              const cooldownSeconds = 8 * 3600; // 8 hours in seconds
              
              // If mission has a custom cooldown, use that instead
              const missionCooldown = missionData.cooldown_seconds || cooldownSeconds;
              
              // Check if mission is still active
              if (now < missionStart + missionCooldown) {
                setActiveMission(missionData);
              } else {
                // Mission has expired, remove from localStorage
                localStorage.removeItem('bonkraiders_active_mission');
              }
            } catch (e) {
              // Invalid stored mission data
              localStorage.removeItem('bonkraiders_active_mission'); 
            }
          }
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

  // Format time left in HH:MM:SS
  const formatTimeLeft = (seconds) => {
    if (!seconds) return '--:--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'), 
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
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
        localStorage.removeItem('bonkraiders_active_mission');
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

  const handleGetTestTokens = () => {
    onShowModal('getTestTokens');
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
              <span className="balance-value">{parseInt(balance).toLocaleString()}</span>
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
              {activeMission ? ( 
                <div className="status-item mission-timer">
                  <span className="status-label">MISSION</span>
                  <span className="status-value mission-type">
                    {activeMission.mission_type}
                  </span>
                  <span className="status-timer">
                    {formatTimeLeft(missionTimeLeft)}
                  </span>
                </div> 
              ) : (
                <>
                  <div className="status-item">
                    <span className="status-label">MODE</span>
                    <span className="status-value">{mode}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">ENERGY</span> 
                    <span className="status-value">{energy}/10</span>
                  </div>
                </>
              )}
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
          disabled={!!activeMission}
          style={{ opacity: activeMission ? 0.5 : 1, cursor: activeMission ? 'not-allowed' : 'pointer' }}
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
        
        {/* Test Tokens Button (only in devnet) */}
        {ENV.SOLANA_NETWORK !== 'mainnet-beta' && (
          <button 
            className="action-btn test-tokens-btn" 
            id="btn-test-tokens"
            data-tip="Get test tokens"
            onClick={handleGetTestTokens}
            onMouseMove={(e) => handleMouseMove(e, 'Get free test tokens')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="btn-icon">🪙</div>
            <div className="btn-text">TEST TOKENS</div>
          </button>
        )}
        
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