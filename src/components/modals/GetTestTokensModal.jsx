import React, { useState } from 'react';
import apiService from '../../services/apiService';
import walletService from '../../services/walletService';
import ENV from '../../config/environment';

const GetTestTokensModal = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [amount] = useState(10000); // Fixed amount of 10,000 tokens

  const handleGetTokens = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const wallet = walletService.getConnectedWallet();
      if (!wallet) {
        throw new Error('No wallet connected');
      }
      
      // Call the API to get test tokens
      const result = await apiService.getTestTokens(amount);
      
      if (result.success) {
        setSuccess(true);
        
        if (window.AstroUI) {
          window.AstroUI.setStatus(`Received ${amount.toLocaleString()} test BR tokens!`);
        }
        
        // Close after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to get test tokens');
      }
    } catch (error) {
      console.error('Failed to get test tokens:', error);
      setError(error.message || 'Failed to get test tokens');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,40,80,0.95), rgba(0,20,60,0.9))',
      border: '4px solid #0cf',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '500px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(4px)',
      fontFamily: "'Press Start 2P', monospace", 
      boxShadow: '0 8px 32px rgba(0, 204, 255, 0.3)',
      color: '#0cf',
      textAlign: 'center'
    }}>
      <h1 style={{
        margin: '0 0 16px',
        fontSize: '20px',
        color: '#0cf'
      }}
      >
        GET TEST TOKENS
      </h1>
      
      <img 
        src="https://bonkraiders.com/assets/object.png" 
        alt="Tokens" 
        style={{
          display: 'block', 
          filter: 'drop-shadow(0 0 10px rgba(0, 204, 255, 0.5))',
          margin: '0 auto 16px',
          width: '64px',
          height: '64px',
          imageRendering: 'pixelated'
        }}
      />

      {!success && <p style={{
        fontSize: '14px',
        lineHeight: '1.5',
        margin: '0 0 16px',
        color: '#fff'
      }}>
        Get {amount.toLocaleString()} free BR tokens to test the game!
      </p>
      }
      
      <div style={{
        background: 'rgba(0,20,40,0.3)',
        border: '2px solid #0cf',
        borderRadius: '6px',
        padding: '12px',
        margin: '0 0 16px',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '8px', color: '#ff0' }}>
          <strong>Test Token Details:</strong>
        </div>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '10px',
          textAlign: 'left'
        }}> 
          <li style={{ marginBottom: '8px' }}>• {amount.toLocaleString()} BR tokens will be sent to your wallet</li>
          <li style={{ marginBottom: '8px' }}>• Use these tokens to test missions and upgrades</li>
          <li style={{ marginBottom: '8px' }}>• These tokens are only valid on {ENV.SOLANA_NETWORK}</li>
          <li>• No real value - for testing purposes only</li>
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
          {amount.toLocaleString()} BR tokens have been sent to your wallet! You're ready to start playing!
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
          onClick={handleGetTokens}
          disabled={isLoading}
          style={{ 
            background: isLoading ? 'rgba(0,20,40,0.3)' : 'rgba(0,40,80,0.7)',
            border: '2px solid #0cf',
            borderRadius: '4px',
            padding: '12px 16px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            color: isLoading ? '#666' : '#0cf',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background .1s, color .1s',
            minWidth: '120px' 
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.target.style.background = 'rgba(0,60,100,0.8)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.target.style.background = 'rgba(0,40,80,0.7)';
            }
          }}
        >
          {isLoading ? 'PROCESSING...' : 'GET TEST TOKENS'}
        </button>
      </div>

      <p style={{
        fontSize: '10px',
        margin: '16px 0 0',
        color: '#888',
        lineHeight: '1.4' 
      }}>
        For testing purposes only • Not real value
        {ENV.DEBUG_MODE && <br />}
        {ENV.DEBUG_MODE && <span style={{ color: '#0cf' }}>DEV MODE: {ENV.SOLANA_NETWORK}</span>}
      </p>
    </div>
  );
};

export default GetTestTokensModal;