import React, { useEffect, useState, useRef } from 'react';
import HeroScreen from './components/HeroScreen';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import Modal from './components/Modal';
import { initCanvas } from './utils/canvasController';
import { setupHUD } from './utils/hud';
import CooldownNotification from './components/CooldownNotification';
import walletService from './services/walletService';
import apiService from './services/apiService';
import websocketService from './services/websocketService';
import healthMonitorService from './services/healthMonitor';
import ENV from './config/environment';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasShip, setHasShip] = useState(false);
  const [activeMission, setActiveMission] = useState(null);
  const canvasRef = useRef(null);
  const [cooldownNotification, setCooldownNotification] = useState(null);

  useEffect(() => {
    // Initialize canvas when component mounts
    const initializeCanvas = async () => {
      if (canvasRef.current) {
        await initCanvas(canvasRef.current);
        setupHUD();
      }
    };

    initializeCanvas();
  }, []);

  const connectWallet = async (provider) => {
    try {
      setIsLoading(true);
      
      if (ENV.DEBUG_MODE) {
        console.log('🚀 Starting ultra-simplified connection...');
      }
      
      // Step 1: Connect wallet
      const connectedWallet = await walletService.connect(provider);
      const publicKey = connectedWallet.publicKey;
      
      if (ENV.DEBUG_MODE) {
        console.log('✅ Wallet connected:', publicKey);
      }
      
      // Step 2: Simple authentication
      const { nonce } = await apiService.getNonce(publicKey);
      const encoder = new TextEncoder();
      const encoded = encoder.encode(nonce);
      const rawSignature = await walletService.signMessage(encoded);
      
      // Convert signature to base64
      let signatureB64;
      if (rawSignature.signature) {
        signatureB64 = btoa(String.fromCharCode.apply(null, rawSignature.signature));
      } else {
        signatureB64 = btoa(String.fromCharCode.apply(null, rawSignature));
      }
      
      const { token } = await apiService.login(publicKey, nonce, signatureB64);
      
      if (ENV.DEBUG_MODE) {
        console.log('✅ Authentication successful');
      }
      
      // Step 3: Set connected state
      setWalletAddress(publicKey);
      setIsWalletConnected(true);
      
      // Step 4: Initialize game state
      // Try to buy ship (will return existing ship if already owned)
      let shipOwned = false;
      try {
        // First check if they have a ship in their profile
        try {
          const profile = await apiService.getUserProfile();
          shipOwned = !!profile?.ship; // Check if user has a ship in their profile
        } catch (profileError) {
          console.warn('Failed to get user profile:', profileError);
        }
        
        // If no ship found in profile, try to get ship status directly
        if (!shipOwned) {
          try {
            const shipStatus = await apiService.request('/ship_status');
            shipOwned = shipStatus?.has_ship || false;
          } catch (shipError) {
            console.warn('Failed to get ship status:', shipError);
          }
        }
        
        // Update state and global variables
        window.hasShip = shipOwned;
        setHasShip(shipOwned);

        if (ENV.DEBUG_MODE) {
          console.log('🚢 Ship status:', shipOwned ? 'Owned' : 'Not owned');
        }
      } catch (error) {
        if (ENV.DEBUG_MODE) {
          console.log('🚢 Ship check failed:', error);
        }
        // Don't fail connection if ship check fails
        setHasShip(false);
      }
      
      // Step 5: Set up disconnect handler
      walletService.on('disconnect', () => {
        if (ENV.DEBUG_MODE) console.log('🔌 Wallet disconnected, reloading…');
        
        websocketService.disconnect();
        // Stop health monitoring when wallet disconnects
        healthMonitorService.stop();
        window.location.reload();
      });
      
      // Step 6: Connect to WebSocket for real-time features
      try {
        const userId = 1; // This should come from your user profile
        await websocketService.connect(userId, token);
        
        // Set up WebSocket event handlers
        websocketService.on('raid_incoming', (data) => {
          // Show notification of incoming raid
          if (window.AstroUI) {
            window.AstroUI.setStatus(`🚨 Incoming raid from ${data.attackerName}!`);
          }
          
          // Trigger defense battle if available
          if (window.startDefenseBattle) {
            setTimeout(() => {
              window.startDefenseBattle();
            }, 2000);
          }
        });
        
        websocketService.on('raid_completed', (data) => {
          // Handle raid completion notification
          if (data.defenderId === userId) {
            if (data.success) {
              if (window.AstroUI) {
                window.AstroUI.setStatus(`💔 Base raided! Lost ${data.stolenAmount} BR`);
              }
              
              // Refresh user profile to get updated balance after being raided
              try {
                apiService.getUserProfile().then(profile => {
                  if (profile?.ship && window.AstroUI) {
                    window.AstroUI.setBalance(profile.ship.balance || 0);
                  }
                });
              } catch (error) {
                console.warn('Failed to refresh profile after raid:', error);
              }
              
            } else {
              if (window.AstroUI) {
                window.AstroUI.setStatus(`🛡️ Raid repelled successfully!`);
              }
            }
          }
        });
        
        if (ENV.DEBUG_MODE) {
          console.log('🌐 WebSocket connected for real-time features');
        }
      } catch (wsError) {
        if (ENV.DEBUG_MODE) {
          console.warn('⚠️ WebSocket connection failed, continuing without real-time features:', wsError);
        }
        // Don't fail the entire connection if WebSocket fails
      }
      
      if (ENV.DEBUG_MODE) {
        console.log('🎮 Game ready!');
      }
      
      // Step 7: Start health monitoring
      try {
        healthMonitorService.start();
      } catch (error) {
        console.warn('Health monitor failed to start:', error);
      }
      
      // Set up health monitoring event handlers
      healthMonitorService.on('health_degraded', (health) => {
        if (ENV.DEBUG_MODE) {
          console.warn('🏥 API health degraded:', health);
        }
      });
      
      healthMonitorService.on('health_recovered', (health) => {
        if (window.AstroUI) {
          window.AstroUI.setStatus('✅ Connection restored');
        }
        if (ENV.DEBUG_MODE) {
          console.log('🏥 API health recovered:', health);
        }
      });
      
      healthMonitorService.on('recovery_attempted', (data) => {
        if (ENV.DEBUG_MODE) {
          console.log('🔧 Auto-recovery attempted:', data);
        }
      });
      
      setIsLoading(false);
      
      // If user doesn't have a ship, show the buy ship modal automatically
      if (!shipOwned) {
        setTimeout(() => showModal('buyship'), 500);
      } else {
        // Show the game canvas if they have a ship
        const gameCanvas = document.getElementById('game-canvas');
        if (gameCanvas) {
          gameCanvas.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('❌ Connection failed:', err);
      
      let errorMessage = 'Connection failed';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Connection was cancelled by user';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  const showModal = (content) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  // Expose global functions for compatibility
  useEffect(() => {
    window.showModal = showModal;
    window.closeModal = closeModal;
    window.updateHasShip = setHasShip;
    window.updateActiveMission = setActiveMission;
    window.showCooldownNotification = (message) => {
      setCooldownNotification(message);
    };
    
    // Set up a periodic profile refresh to keep data in sync
    const profileRefreshInterval = setInterval(() => {
      if (isWalletConnected && walletAddress) {
        apiService.getUserProfile().catch(err => {
          // Silently ignore errors during background refresh
          if (ENV.DEBUG_MODE) {
            console.warn('Background profile refresh failed:', err);
          }
        });
      }
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(profileRefreshInterval);
      window.showCooldownNotification = null;
    };
  }, []);

  return (
    <div className="App">
      {!isWalletConnected && (
        <HeroScreen onConnect={connectWallet} isLoading={isLoading} />
      )}

      <GameCanvas ref={canvasRef} />
      
      {isWalletConnected && hasShip && (
        <GameUI 
          walletAddress={walletAddress}
          activeMission={activeMission}
          onShowModal={showModal}
          onDisconnect={() => {
            setIsWalletConnected(false);
            setWalletAddress('');
          }}
        />
      )}
      
      {isWalletConnected && !hasShip && !modalContent && (
        // This is a fallback in case the automatic modal showing doesn't work
        <div style={{ display: 'none' }} />
      )}

      {modalContent && (
        <Modal content={modalContent} onClose={closeModal} />
      )}
      
      {cooldownNotification && (
        <CooldownNotification 
          message={cooldownNotification}
          onClose={() => setCooldownNotification(null)}
          duration={5000}
        />
      )}
    </div>
  );
}

export default App;