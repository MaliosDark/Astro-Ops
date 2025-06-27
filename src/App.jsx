import React, { useEffect, useState, useRef } from 'react';
import HeroScreen from './components/HeroScreen';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import Modal from './components/Modal';
import { initCanvas } from './utils/canvasController';
import { setupHUD } from './utils/hud';
import walletService from './services/walletService.js';
import { authenticateWallet } from './utils/gameLogic';
import ENV from './config/environment.js';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);

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
      
      // Connect using wallet service
      const connectedWallet = await walletService.connect(provider);
      const publicKey = connectedWallet.publicKey;
      
      // Authenticate with the server
      await authenticateWallet(publicKey, walletService.signMessage.bind(walletService));
      
      setWalletAddress(publicKey);
      setIsWalletConnected(true);
      
      // Set up disconnect handler via wallet service
      walletService.on('disconnect', () => {
        if (ENV.DEBUG_MODE) {
          console.log('🔌 Wallet disconnected, reloading…');
        }
        // Clear stored JWT on disconnect
        apiService.clearToken();
        window.location.reload();
      });
      
      // Check if user needs to buy a ship
      setTimeout(() => {
        if (!window.hasShip) {
          showModal('buyship');
        }
      }, 1000);
      
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