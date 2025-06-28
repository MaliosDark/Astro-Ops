import React, { useEffect, useState, useRef } from 'react';
import HeroScreen from './components/HeroScreen';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import Modal from './components/Modal';
import { initCanvas } from './utils/canvasController';
import { setupHUD } from './utils/hud';
import walletService from './services/walletService.js';
import sessionManager from './services/sessionManager.js';
import ENV from './config/environment.js';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  
  const checkExistingSession = async () => {
    try {
      // Try to initialize session manager
      const hasValidSession = await sessionManager.initialize();
      if (!hasValidSession) return;
      
      // Try to silently reconnect wallet first
      const reconnectedWallet = await walletService.tryAutoConnect();
      if (!reconnectedWallet) {
        if (ENV.DEBUG_MODE) {
          console.log('❌ Could not silently reconnect wallet, clearing session');
        }
        sessionManager.clearSession();
        return;
      }
      
      const profile = sessionManager.getUserProfile();
      
      if (profile && profile.public_key) {
        setWalletAddress(reconnectedWallet.publicKey);
        setIsWalletConnected(true);
        
        // Set up disconnect handler for the reconnected wallet
        walletService.on('disconnect', () => {
          if (ENV.DEBUG_MODE) {
            console.log('🔌 Wallet disconnected, reloading…');
          }
          sessionManager.clearSession();
          window.location.reload();
        });
        
        // Always assume user has a ship for now (since buy_ship endpoint works)
        window.hasShip = true;
        
        // Update UI with cached data
        if (window.AstroUI) {
          if (profile.ship) {
            window.AstroUI.setBalance(profile.ship.balance || 0);
          } else {
            window.AstroUI.setBalance(100); // Default balance
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
      sessionManager.clearSession();
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
    
    // Check for existing session
    checkExistingSession();
  }, []);

  const connectWallet = async (provider) => {
    try {
      setIsLoading(true);
      
      // Connect using wallet service
      const connectedWallet = await walletService.connect(provider);
      const publicKey = connectedWallet.publicKey;
      
      // Authenticate with the server using session manager
      const authResult = await sessionManager.authenticateUser(publicKey, walletService.signMessage.bind(walletService));
      
      const profile = authResult.profile;
      
      // Set connected state after successful authentication
      setWalletAddress(publicKey);
      setIsWalletConnected(true);
      
      // Always mark that player has a ship (since buy_ship endpoint works)
      window.hasShip = true;
      if (window.AstroUI) {
        window.AstroUI.setBalance(profile.ship?.balance || 100);
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
      
      // Set up disconnect handler via wallet service
      walletService.on('disconnect', () => {
        if (ENV.DEBUG_MODE) {
          console.log('🔌 Wallet disconnected, reloading…');
        }
        sessionManager.clearSession();
        window.location.reload();
      });
      
      // Skip ship purchase modal since we assume user has ship
      
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Wallet connection failed', err);
      
      // More user-friendly error messages
      let errorMessage = 'Connection failed';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Connection was cancelled by user';
      } else if (err.message?.includes('Network')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (err.message?.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please try again.';
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