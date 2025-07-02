import React, { useState } from 'react';
import { getTokenBalance } from '../../utils/solanaTransactions';
import sessionManager from '../../services/sessionManager';
import apiService from '../../services/apiService';
import ENV from '../../config/environment.js';

const BuyShipModal = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('sol');
  const shipPriceBR = 1500; // Fixed BR token price for ship

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
      
      // Call the API to buy a ship with the selected payment method
      const result = await apiService.buyShip(paymentMethod);
      
      // Mark that player now has a ship
      window.hasShip = true;
      
      // Update App state to show the ship
      if (window.updateHasShip) {
        window.updateHasShip(true);
      }
      
      // Show success message
      setSuccess(true);
      
      if (window.AstroUI) {
        window.AstroUI.setStatus('Ship purchased successfully!');
      }
      
      // Close after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 2000);
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

    // Update App state to show the ship
    if (window.updateHasShip) {
      window.updateHasShip(true);
    }
    
    if (window.AstroUI) {
      window.AstroUI.setBalance(1000); // Give some starting balance for testing
      window.AstroUI.setStatus('Test ship added!');
    }
    onClose();
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
        color: '#f0a'
      }}
      >
        BUY YOUR SHIP
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
        margin: '0 0 16px',
        color: '#0cf'
      }}>
        You need a ship to start playing Bonk Raiders!
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
        {ENV.SOLANA_NETWORK === 'mainnet-beta' ? (
          <div style={{ marginBottom: '8px', color: '#ff0' }}>
            <strong>Ship Price:</strong> {ENV.SHIP_PRICE_SOL} SOL (~15 USDC)
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '12px', color: '#ff0' }}>
              <strong>TEST ENVIRONMENT - Choose Payment Method:</strong>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '16px',
              gap: '10px'
            }}>
              <div 
                onClick={() => setPaymentMethod('sol')}
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  border: `2px solid ${paymentMethod === 'sol' ? '#0f0' : '#666'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: paymentMethod === 'sol' ? 'rgba(0,40,0,0.3)' : 'rgba(0,0,0,0.3)'
                }}>
                <div style={{ color: paymentMethod === 'sol' ? '#0f0' : '#ccc' }}>{ENV.SHIP_PRICE_SOL} SOL</div>
              </div>
              <div 
                onClick={() => setPaymentMethod('br')}
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  border: `2px solid ${paymentMethod === 'br' ? '#ff0' : '#666'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: paymentMethod === 'br' ? 'rgba(60,60,0,0.3)' : 'rgba(0,0,0,0.3)'
                }}>
                <div style={{ color: paymentMethod === 'br' ? '#ff0' : '#ccc' }}>{shipPriceBR} BR</div>
                {paymentMethod === 'br' && (
                  <div style={{ fontSize: '9px', marginTop: '4px', color: hasEnoughTokens ? '#0f0' : '#f00' }}>
                    {isCheckingBalance ? 'Checking balance...' : 
                     hasEnoughTokens ? `You have ${tokenBalance} BR` : `Insufficient balance (${tokenBalance} BR)`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '8px', marginTop: '16px' }}>
          <strong>Ship Includes:</strong>
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
          {isLoading ? 'BUYING...' : paymentMethod === 'sol' ? `BUY WITH ${ENV.SHIP_PRICE_SOL} SOL` : `BUY WITH ${shipPriceBR} BR`}
        </button>

        {ENV.IS_DEVELOPMENT && (
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