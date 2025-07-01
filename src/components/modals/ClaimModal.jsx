import React, { useEffect, useState } from 'react';
import apiService from '../../services/apiService';
import { getPendingRewards } from '../../utils/gameLogic';
import walletService from '../../services/walletService';

const ClaimModal = ({ onClose }) => {
  const [pendingRewards, setPendingRewards] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    fetchPendingRewards();
  }, []);

  const fetchPendingRewards = async () => {
    try {
      setIsLoading(true);
      const pending = await getPendingRewards();
      setPendingRewards(pending || []);
      
      const totalAmount = pending?.reduce((sum, item) => sum + item.amount, 0) || 0;
      setTotal(parseInt(totalAmount));
    } catch (error) {
      console.error('Failed to fetch pending rewards:', error);
      // Mock data for development
      const mockPending = [
        { source: 'Mining Run', amount: 450, id: 1, timestamp: Date.now() - 3600000 },
        { source: 'Black Market', amount: 1200, id: 2, timestamp: Date.now() - 7200000 },
        { source: 'Artifact Hunt', amount: 2800, id: 3, timestamp: Date.now() - 1800000 }
      ];
      setPendingRewards(mockPending);
      setTotal(4450);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      const wallet = walletService.getConnectedWallet();
      if (!wallet) {
        throw new Error('No wallet connected');
      }
      
      // Get the total amount to claim
      if (total <= 0) {
        throw new Error('No rewards to claim');
      }
      
      // Call the withdraw API with the total amount to claim everything at once
      const result = await apiService.withdrawTokens(total, 'claim');
      
      // Add to transaction history
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Claimed ${total} BR tokens to your wallet!`);
        window.AstroUI.setBalance(0);
      }
      
      // Show success message before closing
      setIsClaiming(false);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Claim failed:', error);
      setIsClaiming(false);
    }
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const date = new Date(timestamp);
    const diff = now - date.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'Mining Run': return '⛏️';
      case 'Black Market': return '🏴‍☠️';
      case 'Artifact Hunt': return '🏺';
      default: return '💰';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'Mining Run': return '#0f0';
      case 'Black Market': return '#f80';
      case 'Artifact Hunt': return '#f0f';
      default: return '#0cf';
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,40,0,0.95), rgba(40,80,0,0.9))',
      border: '4px solid #0f0',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '700px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(12px)',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0f0',
      boxShadow: '0 8px 32px rgba(0, 255, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          margin: '0 0 8px',
          fontSize: '24px',
          background: 'linear-gradient(45deg, #0f0, #ff0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
        }}>
          💰 REWARD VAULT
        </h1>
        <p style={{
          margin: '0',
          fontSize: '12px',
          color: '#888',
          lineHeight: '1.4'
        }}>
          Claimed tokens will be transferred directly to your connected wallet.
        </p>
      </div>

      {/* Ship Icon */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <img 
          src="https://bonkraiders.com/assets/ship.png" 
          alt="Ship" 
          style={{
            width: '64px',
            height: '64px',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 10px rgba(0, 255, 0, 0.5))'
          }}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          fontSize: '12px',
          color: '#888'
        }}>
            Ready to be claimed directly to your wallet
          Transaction will be visible in your transaction history.
        </div>
      )}

      {/* Pending Rewards List */}
      {!isLoading && (
        <>
          <div style={{
            background: 'rgba(0,60,0,0.6)',
            border: '2px solid #0f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: '14px',
              color: '#ff0',
              textAlign: 'center'
            }}>
              📋 PENDING REWARDS ({pendingRewards.length})
            </h2>

            {pendingRewards.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#888',
                fontSize: '12px'
              }}>
                <div style={{ marginBottom: '12px', fontSize: '32px' }}>🚫</div>
                No pending rewards found
                <div style={{ fontSize: '10px', marginTop: '8px' }}>
                  Complete missions to earn more BR tokens
                </div>
              </div>
            ) : (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #0f0',
                borderRadius: '8px',
                background: 'rgba(0,40,0,0.3)'
              }}>
                {pendingRewards.map((item, index) => (
                  <div 
                    key={item.id || index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: index < pendingRewards.length - 1 ? '1px solid rgba(0, 255, 0, 0.2)' : 'none',
                      background: index % 2 === 0 ? 'rgba(0,60,0,0.2)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0,80,0,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = index % 2 === 0 ? 'rgba(0,60,0,0.2)' : 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {getSourceIcon(item.source)}
                      </span>
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: getSourceColor(item.source),
                          marginBottom: '2px'
                        }}>
                          {item.source}
                        </div>
                        {item.timestamp && (
                          <div style={{
                            fontSize: '9px',
                            color: '#666'
                          }}>
                            {formatTimeAgo(item.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '14px',
                      color: '#ff0',
                      fontWeight: 'bold', 
                      textShadow: '0 0 8px rgba(255, 255, 0, 0.5)',
                      whiteSpace: 'nowrap'
                    }}>
                      +{parseInt(item.amount).toLocaleString()} BR
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div style={{
            background: 'rgba(0,80,0,0.6)',
            border: '2px solid #ff0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#888',
              marginBottom: '8px'
            }}>
              TOTAL CLAIMABLE REWARDS
            </div>
            <div style={{
              fontSize: '24px', 
              color: '#ff0',
              fontWeight: 'bold',
              textShadow: '0 0 12px rgba(255, 255, 0, 0.8)',
              marginBottom: '8px',
              whiteSpace: 'nowrap'
            }}>
              {parseInt(total).toLocaleString()} BR
            </div>
            <div style={{
              fontSize: '10px',
              color: '#0cf'
            }}>
              Ready to be claimed directly to your wallet
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={isClaiming || total === 0}
            style={{
              width: '100%',
              padding: '16px',
              background: isClaiming || total === 0 ? 
                'linear-gradient(135deg, rgba(40,40,40,0.5), rgba(20,20,20,0.5))' :
                'linear-gradient(135deg, #0f0, #0c0)',
              color: isClaiming || total === 0 ? '#666' : '#000',
              border: '2px solid #0f0',
              borderRadius: '12px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '16px',
              cursor: isClaiming || total === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isClaiming || total === 0 ? 'none' : '0 4px 16px rgba(0, 255, 0, 0.4)',
              textShadow: isClaiming || total === 0 ? 'none' : '0 0 8px rgba(0, 0, 0, 0.8)'
            }}
            onMouseEnter={(e) => {
              if (!isClaiming && total > 0) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isClaiming && total > 0) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 255, 0, 0.4)';
              }
            }}
          >
            {isClaiming ? '⏳ PROCESSING CLAIM...' : 
             total === 0 ? '🚫 NO REWARDS TO CLAIM' :
             `💰 CLAIM ${total.toLocaleString()} BR TOKENS`}
          </button>

          {/* Additional Info */}
          <div style={{
            marginTop: '16px',
            fontSize: '10px',
            color: '#666',
            textAlign: 'center', 
            lineHeight: '1.4',
            padding: '0 10px'
          }}>
            Claimed tokens will be transferred directly to your connected wallet.
            <br />
            Transaction will be visible in your transaction history.
          </div>
        </>
      )}
    </div>
  );
};

export default ClaimModal;