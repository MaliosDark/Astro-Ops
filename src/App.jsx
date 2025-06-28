import React, { useEffect, useState, useRef } from 'react';
import HeroScreen from './components/HeroScreen';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import Modal from './components/Modal';
import { initCanvas } from './utils/canvasController';
import { setupHUD } from './utils/hud';
import walletService from './services/walletService.js';
import apiService from './services/apiService.js';
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
      try {
        const shipResult = await apiService.buyShip();
        window.hasShip = true;
        
        if (ENV.DEBUG_MODE) {
          console.log('🚢 Ship status:', shipResult);
        }
      } catch (error) {
        if (ENV.DEBUG_MODE) {
          console.log('🚢 Ship purchase/check failed:', error);
        }
        // Don't fail connection if ship check fails
        window.hasShip = false;
      }
      
      // Step 5: Set up disconnect handler
      walletService.on('disconnect', () => {
        if (ENV.DEBUG_MODE) {
          console.log('🔌 Wallet disconnected, reloading…');
        }
        window.location.reload();
      });
      
      if (ENV.DEBUG_MODE) {
        console.log('🎮 Game ready!');
      }
      
      setIsLoading(false);
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
          onDisconnect={() => {
            setIsWalletConnected(false);
            setWalletAddress('');
          }}
        />
      )}

      {modalContent && (
        <Modal content={modalContent} onClose={closeModal} />
      )}
    </div>
  );
}

export default App;