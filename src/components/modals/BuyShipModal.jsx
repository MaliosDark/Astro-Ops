import React, { useState } from 'react';
import { buyShip } from '../../utils/gameLogic';
import ENV from '../../config/environment.js';

const BuyShipModal = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuyShip = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await buyShip();
      
      // Mark that player now has a ship
      window.hasShip = true;
      
      if (window.AstroUI) {
        window.AstroUI.setStatus('Ship purchased successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Ship purchase failed:', error);
      setError(error.message || 'Failed to purchase ship');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestShip = () => {
    // DEV ONLY: Add test ship without payment
    window.hasShip = true;
    if (window.AstroUI) {
      window.AstroUI.setStatus('Test ship added!');
    }
    onClose();
  };

  return (
    <div style={{
      background: 'rgba(20,0,20,0.8)',
      border: '4px solid #f0a',
      borderRadius: '8px',
      padding: '20px',
      width: '80%',
      maxWidth: '500px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(4px)',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0f0',
      textAlign: 'center'
    }}>
      <h1 style={{
        margin: '0 0 16px',
        fontSize: '20px',
        color: '#f0a'
      }}>
        BUY YOUR SHIP
      </h1>
      
      <img 
        src="https://bonkraiders.com/assets/ship.png" 
        alt="Ship" 
        style={{
          display: 'block',
          margin: '0 auto 16px',
          width: '64px',
          height: '64px',
          imageRendering: 'pixelated'
        }}
      />

      <p style={{
        fontSize: '14px',
        lineHeight: '1.5',
        margin: '0 0 16px',
        color: '#0cf'
      }}>
        You need a ship to start playing Bonk Raiders!
      </p>

      <div style={{
        background: 'rgba(0,40,0,0.3)',
        border: '2px solid #0f0',
        borderRadius: '6px',
        padding: '12px',
        margin: '0 0 16px',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Ship Price:</strong> {ENV.SHIP_PRICE_SOL} SOL (~15 USDC)
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Includes:</strong>
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
          <li>• BR token rewards</li>
        </ul>
      </div>

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
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleBuyShip}
          disabled={isLoading}
          style={{
            background: isLoading ? 'rgba(0,20,0,0.3)' : 'rgba(0,20,0,0.7)',
            border: '2px solid #0f0',
            borderRadius: '4px',
            padding: '12px 16px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            color: isLoading ? '#666' : '#0f0',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background .1s, color .1s',
            minWidth: '120px'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.target.style.background = 'rgba(0,20,0,1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.target.style.background = 'rgba(0,20,0,0.7)';
            }
          }}
        >
          {isLoading ? 'BUYING...' : 'BUY SHIP'}
        </button>

        {ENV.DEBUG_MODE && (
          <button
            onClick={handleTestShip}
            style={{
              background: 'rgba(40,0,40,0.7)',
              border: '2px solid #f0a',
              borderRadius: '4px',
              padding: '12px 16px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '12px',
              color: '#f0a',
              cursor: 'pointer',
              transition: 'background .1s, color .1s',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(40,0,40,1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(40,0,40,0.7)';
            }}
          >
            TEST SHIP
          </button>
        )}
      </div>

      <p style={{
        fontSize: '10px',
        margin: '16px 0 0',
        color: '#888',
        lineHeight: '1.4'
      }}>
        One-time purchase • Secure Solana transaction
        {ENV.DEBUG_MODE && <br />}
        {ENV.DEBUG_MODE && <span style={{ color: '#f0a' }}>DEV MODE: Test ship available</span>}
      </p>
    </div>
  );
};

export default BuyShipModal;