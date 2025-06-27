import React, { useEffect, useState, useRef } from 'react';
import HeroScreen from './components/HeroScreen';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import Modal from './components/Modal';
import { initCanvas } from './utils/canvasController';
import { setupHUD } from './utils/hud';
import walletService from './services/walletService.js';
import userCacheService from './services/userCacheService.js';
import apiService from './services/apiService.js';
import { authenticateWallet } from './utils/gameLogic';
import ENV from './config/environment.js';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  
  const checkExistingSession = async () => {
    try {
      // Check if we have a stored JWT
      const storedToken = sessionStorage.getItem('bonkraiders_jwt');
      if (!storedToken) return;
      
      // Check if token is still valid
      if (apiService.isTokenExpired(storedToken)) {
        sessionStorage.removeItem('bonkraiders_jwt');
        return;
      }
      
      // Set the token and try to get user profile
      apiService.setToken(storedToken);
      
      // Try to silently reconnect wallet first
      const reconnectedWallet = await walletService.tryAutoConnect();
      if (!reconnectedWallet) {
        if (ENV.DEBUG_MODE) {
          console.log('❌ Could not silently reconnect wallet, clearing session');
        }
        // Clear session if wallet can't be reconnected
        sessionStorage.removeItem('bonkraiders_jwt');
        apiService.clearToken();
        return;
      }
      
      const profile = await apiService.getUserProfile();
      
      if (profile && profile.public_key) {
        setWalletAddress(reconnectedWallet.publicKey);
        setIsWalletConnected(true);
        
        // Set up disconnect handler for the reconnected wallet
        walletService.on('disconnect', () => {
          if (ENV.DEBUG_MODE) {
            console.log('🔌 Wallet disconnected, reloading…');
          }
          // Clear stored JWT on disconnect
          userCacheService.clearAllUserData(reconnectedWallet.publicKey);
          apiService.clearToken();
          window.location.reload();
        });
        
        // Check if user has a ship
        if (profile.ship) {
          window.hasShip = true;
        }
        
        // Update UI with cached data
        if (window.AstroUI) {
          if (profile.ship) {
            window.AstroUI.setBalance(profile.ship.balance || 0);
          }
          if (profile.energy) {
            window.AstroUI.setEnergy(profile.energy.current || 10);
          }
          if (profile.stats) {
            window.AstroUI.setKills(profile.stats.total_kills || 0);
            window.AstroUI.setRaidsWon(profile.stats.total_raids_won || 0);
          }
        }
        
        if (ENV.DEBUG_MODE) {
          console.log('✅ Restored session for user:', profile.public_key);
        }
      }
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.log('❌ Failed to restore session:', error);
      }
      // Clear invalid session
      sessionStorage.removeItem('bonkraiders_jwt');
      apiService.clearToken();
    }
  };

  useEffect(() => {
    // Initialize canvas when component mounts
    const initializeCanvas = async () => {
      if (canvasRef.current) {
        await initCanvas(canvasRef.current);
        setupHUD();
      }
    };

    initializeCanvas();
    
    // Clean old cache on app start
    userCacheService.cleanOldCache();
    
    // Check for existing session
    checkExistingSession();
  }, []);

  const connectWallet = async (provider) => {
    try {
      setIsLoading(true);
      
      // Connect using wallet service
      const connectedWallet = await walletService.connect(provider);
      const publicKey = connectedWallet.publicKey;
      
      // Authenticate with the server
      await authenticateWallet(publicKey, walletService.signMessage.bind(walletService));
      
      // Load user profile and cache data
      try {
        const profile = await apiService.getUserProfile();
        
        // Only set connected state after successful profile load
        setWalletAddress(publicKey);
        setIsWalletConnected(true);
        
        if (profile.ship) {
          window.hasShip = true;
          if (window.AstroUI) {
            window.AstroUI.setBalance(profile.ship.balance || 0);
          }
        }
        
        if (profile.energy && window.AstroUI) {
          window.AstroUI.setEnergy(profile.energy.current || 10);
        }
        
        if (profile.stats && window.AstroUI) {
          window.AstroUI.setKills(profile.stats.total_kills || 0);
          window.AstroUI.setRaidsWon(profile.stats.total_raids_won || 0);
        }
        
        if (ENV.DEBUG_MODE) {
          console.log('✅ Loaded user profile:', profile);
        }
      } catch (profileError) {
        console.error('❌ Failed to load user profile:', profileError);
        // Clear any potentially invalid tokens
        apiService.clearToken();
        sessionStorage.removeItem('bonkraiders_jwt');
        alert('Failed to load user profile. Please try reconnecting your wallet.');
        setIsLoading(false);
        return; // Exit early, don't set connected state
      }
      
      // Set up disconnect handler via wallet service
      walletService.on('disconnect', () => {
        if (ENV.DEBUG_MODE) {
          console.log('🔌 Wallet disconnected, reloading…');
        }
        // Clear stored JWT on disconnect
        userCacheService.clearAllUserData(publicKey);
        apiService.clearToken();
        window.location.reload();
      });
      
      // Check if user needs to buy a ship
      if (!window.hasShip) {
        setTimeout(() => {
          if (!window.hasShip) {
            showModal('buyship');
          }
        }, 1000);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Wallet connection failed', err);
      alert('Connection failed: ' + (err.message || err));
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
  }, []);

  return (
    <div className="App">
      {!isWalletConnected && (
        <HeroScreen onConnect={connectWallet} isLoading={isLoading} />
      )}
      
      <GameCanvas ref={canvasRef} />
      
      {isWalletConnected && (
        <GameUI 
          walletAddress={walletAddress}
          onShowModal={showModal}
        />
      )}

      {modalContent && (
        <Modal content={modalContent} onClose={closeModal} />
      )}
    </div>
  );
}

export default App;