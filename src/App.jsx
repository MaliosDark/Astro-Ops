import React, { useEffect, useState, useRef } from 'react';
import HeroScreen from './components/HeroScreen';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import Modal from './components/Modal';
import { initCanvas } from './utils/canvasController';
import { setupHUD } from './utils/hud';
import { getSolanaProvider } from './utils/wallet';
import { authenticateWallet, buyShip } from './utils/gameLogic';

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
      const resp = await provider.connect();
      const publicKey = resp.publicKey.toString();
      
      // Authenticate with the server
      await authenticateWallet(publicKey, provider.signMessage.bind(provider));
      
      // Try to buy ship (will be ignored if already purchased)
      try {
        await buyShip();
        if (window.AstroUI) {
          window.AstroUI.setStatus('Ship acquired!');
        }
      } catch (error) {
        console.log('Ship purchase skipped or failed:', error.message);
      }
      
      setWalletAddress(publicKey);
      setIsWalletConnected(true);
      
      // Set up disconnect handler
      provider.on('disconnect', () => {
        console.log('🔌 Wallet disconnected, reloading…');
        window.location.reload();
      });
      
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