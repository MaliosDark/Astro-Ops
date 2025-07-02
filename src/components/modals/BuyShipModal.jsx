import React, { useState } from 'react';
import { getTokenBalance } from '../../utils/solanaTransactions';
import { buyShip } from '../../utils/gameLogic';
import sessionManager from '../../services/sessionManager';
import apiService from '../../services/apiService';
import walletService from '../../services/walletService';
import ENV from '../../config/environment.js';

const BuyShipModal = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('sol');
  const shipPriceBR = 0; // Free ship for testing
  const [showTestOptions] = useState(true); // Always show test options

  // Check token balance on load
  React.useEffect(() => {
    const checkBalance = async () => {
      try {
        setIsCheckingBalance(true);
        const wallet = walletService.getConnectedWallet();
        if (wallet) {
          const balance = await getTokenBalance(wallet.publicKey);
          setTokenBalance(balance);
        }
      } catch (error) {
        console.error('Failed to check token balance:', error);
      } finally {
        setIsCheckingBalance(false);
      }
    };
    
    checkBalance();
  }, []);

  const handleBuyShip = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Close modal immediately to show animations if needed
      onClose();
      
      // Call the game logic function to buy a ship with the selected payment method
      const result = await buyShip(paymentMethod);
      
      // Mark that player now has a ship
      window.hasShip = true;
      
      // Update App state to show the ship
      if (window.updateHasShip) {
        window.updateHasShip(true);
      }
    } catch (error) {
      console.error('Ship purchase failed:', error);
      setError(error.message || 'Failed to purchase ship');
    } finally {
      setIsLoading(false);
      
      // Show success message in HUD
      if (window.AstroUI) {
        window.AstroUI.setStatus('Ship purchased successfully!');
      }
    }
  };

  const handleTestShip = async () => {
    try {
      setIsLoading(true);
      
      // Close modal immediately to show animations if needed
      onClose();
      
      // Call the API to add a free test ship
      await apiService.buyShip('test');
      
      // Mark that player now has a ship
      window.hasShip = true;
      
      // Update App state to show the ship
      if (window.updateHasShip) {
        window.updateHasShip(true);
      }
    
      if (window.AstroUI) {
        window.AstroUI.setBalance(10000); // Give plenty of balance for testing
        window.AstroUI.setStatus('Free ship added! You can now play all game features!');
      }
    } catch (error) {
      console.error('Test ship failed:', error);
      setError(error.message || 'Failed to add test ship');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if user has enough BR tokens to buy ship
  const hasEnoughTokens = tokenBalance >= shipPriceBR;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,0,20,0.9), rgba(40,0,40,0.8))',
      border: '4px solid #f0a',
      borderRadius: '8px',
      padding: '20px',
      width: '80%',
      maxWidth: '500px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(4px)',
      fontFamily: "'Press Start 2P', monospace", 
      boxShadow: '0 8px 32px rgba(255, 0, 170, 0.3)',
      color: '#0f0',
      textAlign: 'center'
    }}>
      <h1 style={{
        margin: '0 0 16px',
        fontSize: '20px',
        color: '#ff0'
      }}
      >
        GET YOUR SHIP
      </h1>
      
      <img 
        src="https://bonkraiders.com/assets/ship.png" 
        alt="Ship" 
        style={{
          display: 'block', 
          filter: 'drop-shadow(0 0 10px rgba(255, 0, 170, 0.5))',
          margin: '0 auto 16px',
          width: '64px',
          height: '64px',
          imageRendering: 'pixelated'
        }}
      />

      {!success && <p style={{
        fontSize: '14px',
        lineHeight: '1.5',
        margin: '0 0 12px',
        color: '#fff'
      }}>
        Get a free ship to start playing Bonk Raiders!
      </p>
      }
      <div style={{
        background: 'rgba(0,40,0,0.3)',
        border: '2px solid #0f0',
        borderRadius: '6px',
        padding: '12px',
        margin: '0 0 20px',
        fontSize: '12px'
      }}>        
        <div style={{ marginBottom: '8px', marginTop: '16px' }}>
          <strong>Your Free Ship Includes:</strong>
        </div>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '10px',
          textAlign: 'left'
        }}> 
          <li>• Access to all missions</li>
          <li>• Ability to raid other players</li>
          <li>• Ship upgrade system</li>
          <li>• 10,000 BR tokens to start with</li>
          <li>• All game features unlocked</li>
        </ul>
      </div>

      {success && (
        <div style={{
          background: 'rgba(0,60,0,0.5)',
          border: '2px solid #0f0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          color: '#0f0'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
          Ship purchased successfully! You're ready to start playing!
        </div>
      )}
      {error && (
        <div style={{
          color: '#f00',
          fontSize: '12px',
          margin: '0 0 16px',
          padding: '8px',
          background: 'rgba(40,0,0,0.5)',
          border: '1px solid #f00',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: success ? 'none' : 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleTestShip}
          disabled={isLoading}
          style={{
            background: isLoading ? 'rgba(0,60,0,0.3)' : 'rgba(0,100,0,0.7)',
            border: '2px solid #0f0',
            borderRadius: '8px',
            padding: '16px 24px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '14px',
            color: isLoading ? '#666' : '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer', 
            transition: 'all 0.3s ease',
            minWidth: '280px',
            boxShadow: '0 4px 8px rgba(0,255,0,0.3)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.target.style.background = 'rgba(0,120,0,0.9)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0,255,0,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.target.style.background = 'rgba(0,100,0,0.7)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,255,0,0.3)';
            }
          }}
        >
          {isLoading ? '⏳ PREPARING SHIP...' : '🚀 GET FREE SHIP & START PLAYING'}
        </button>
      </div>

      <p style={{
        fontSize: '10px',
        margin: '16px 0 0',
        color: '#888',
        lineHeight: '1.4' 
      }}>
        Free test ship • Includes 10,000 BR tokens
        <br />
        <span style={{ color: '#0f0' }}>All game features unlocked for testing</span>
        <br />
        <span style={{ color: '#0cf' }}>TEST NETWORK: {ENV.SOLANA_NETWORK}</span>
      </p>
    </div>
  );
};

export default BuyShipModal;