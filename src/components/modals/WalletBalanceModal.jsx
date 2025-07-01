import React, { useEffect, useState } from 'react';
import { getTokenBalance } from '../../utils/solanaTransactions';
import walletService from '../../services/walletService';
import apiService from '../../services/apiService';
import ENV from '../../config/environment';

const WalletBalanceModal = ({ onClose }) => {
  const [tokenBalance, setTokenBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimableBalance, setClaimableBalance] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchBalances();
    fetchTransactionHistory();
  }, []);

  const fetchBalances = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get connected wallet
      const wallet = walletService.getConnectedWallet();
      if (!wallet) {
        throw new Error('No wallet connected');
      }
      
      // Get both on-chain and in-game balances from the new API endpoint
      const { onchain_balance, ingame_balance } = await apiService.getWalletBalance();
      setTokenBalance(onchain_balance || 0);
      setClaimableBalance(ingame_balance || 0); 
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setError(error.message || 'Failed to fetch wallet balance');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      // Use the new API endpoint for transaction history
      const result = await apiService.getTransactionHistory();
      setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    }
  };

  const handleClaim = async () => {
    if (claimableBalance <= 0 || isClaiming) return;
    
    try {
      setIsClaiming(true);
      
      // Call the withdraw API with the total claimable amount
      const result = await apiService.withdrawTokens(claimableBalance, 'claim');

      if (result && result.success) {
        // Update UI: claimable balance becomes 0, on-chain balance increases
        setClaimableBalance(0);
        setTokenBalance((prev) => (prev || 0) + claimableBalance);
        
        // Update global UI if available
        if (window.AstroUI) {
          window.AstroUI.setStatus(`Claimed ${claimableBalance} BR tokens to your wallet!`);
          window.AstroUI.setBalance(0); 
        }
        
        // Add to transaction history
        setTransactions(prev => [
          {
            id: Date.now(),
            tx_type: 'claim',
            amount: claimableBalance,
            created_at: new Date().toISOString(),
            status: 'completed',
            tx_hash: result.tx_hash
          },
          ...prev
        ]);
        
        // Show success message
        setWithdrawSuccess(true);
        setTimeout(() => {
          setWithdrawSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Claim failed:', error);
      setError(error.message || 'Failed to claim tokens');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleWithdraw = async () => {
    if (isWithdrawing || !withdrawAmount) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > claimableBalance) {
      setWithdrawError('Invalid withdrawal amount');
      return;
    }
    
    try {
      setIsWithdrawing(true);
      setWithdrawError('');
      
      // Call the new withdraw API
      const result = await apiService.withdrawTokens(parseInt(amount));
      
      if (result.success) {
        // Update balances: claimable balance decreases, on-chain balance increases
        setClaimableBalance(result.br_balance || 0); // br_balance is the new in-game balance
        setTokenBalance((prev) => (prev || 0) + amount);
        
        // Show success message
        setWithdrawSuccess(true);
        
        // Add to transaction history
        setTransactions(prev => [
          {
            id: Date.now(),
            tx_type: 'withdraw',
            amount: amount,
            created_at: new Date().toISOString(),
            status: 'completed',
            tx_hash: result.mint_tx_hash
          },
          ...prev
        ]);
        
        // Reset form
        setWithdrawAmount('');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setWithdrawSuccess(false);
        }, 3000);
      } else {
        throw new Error(result.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setWithdrawError(error.message || 'Failed to withdraw tokens');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp); // Assuming timestamp is already in milliseconds or ISO string
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'mission_reward': return '🚀';
      case 'raid_reward': return '⚔️';
      case 'claim': return '💰';
      case 'withdraw': return '📤';
      case 'upgrade_cost': return '⚙️';
      case 'burn': return '🔥';
      default: return '📝';
    }
  };

  const getTransactionColor = (type, amount) => {
    if (amount < 0) return '#f00'; // Costs are negative
    switch (type) {
      case 'mission_reward': return '#0f0';
      case 'raid_reward': return '#f80';
      case 'claim': return '#ff0';
      case 'withdraw': return '#0cf';
      default: return '#fff';
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,80,0.9))',
      border: '4px solid #0cf',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '800px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(12px)',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0cf',
      boxShadow: '0 8px 32px rgba(0, 255, 255, 0.3)',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          margin: '0 0 8px',
          fontSize: '24px', 
          background: 'linear-gradient(45deg, #0cf, #0ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
        }}>
          💰 WALLET BALANCE
        </h1>
        <p style={{
          margin: '0',
          fontSize: '12px',
          color: '#888',
          lineHeight: '1.4'
        }}>
          Manage your BR tokens and transactions
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          fontSize: '12px',
          color: '#888'
        }}>
          <div style={{ marginBottom: '16px', fontSize: '24px' }}>⏳</div>
          Loading wallet data...
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div style={{
          background: 'rgba(255,0,0,0.2)',
          border: '2px solid #f00',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'center',
          color: '#f00',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '16px' }}>❌</div>
          {error}
          <button
            onClick={fetchBalances}
            style={{
              background: 'rgba(255,0,0,0.3)',
              border: '1px solid #f00',
              borderRadius: '4px',
              padding: '8px 16px',
              marginTop: '12px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Balance Display */}
      {!isLoading && !error && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* On-chain Balance */}
            <div style={{
              background: 'rgba(0,60,120,0.6)',
              border: '2px solid #0cf',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#888',
                marginBottom: '8px' 
              }}>
                ON-CHAIN BALANCE
              </div>
              <div style={{
                fontSize: '24px',
                color: '#0cf',
                fontWeight: 'bold',
                textShadow: '0 0 12px rgba(0, 255, 255, 0.8)',
                marginBottom: '8px'
              }}>
                {tokenBalance !== null ? tokenBalance.toLocaleString() : '---'} BR
              </div>
              <div style={{
                fontSize: '10px',
                color: '#888'
              }}>
                Tokens in your connected wallet
              </div>
            </div>

            {/* In-game Balance */}
            <div style={{
              background: 'rgba(0,80,0,0.6)',
              border: '2px solid #0f0',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#888',
                marginBottom: '8px' 
              }}>
                IN-GAME BALANCE
              </div>
              <div style={{
                fontSize: '24px',
                color: '#0f0',
                fontWeight: 'bold',
                textShadow: '0 0 12px rgba(0, 255, 0, 0.8)',
                marginBottom: '8px'
              }}>
                {claimableBalance.toLocaleString()} BR
              </div>
              <div style={{
                fontSize: '10px',
                color: '#888'
              }}>
                Tokens earned in-game, ready to claim
              </div>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={claimableBalance <= 0 || isClaiming}
            style={{
              width: '100%',
              padding: '16px',
              background: claimableBalance <= 0 || isClaiming ? 
                'linear-gradient(135deg, rgba(40,40,40,0.5), rgba(20,20,20,0.5))' :
                'linear-gradient(135deg, #0f0, #0c0)',
              color: claimableBalance <= 0 || isClaiming ? '#666' : '#000',
              border: '2px solid #0f0',
              borderRadius: '12px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '16px',
              cursor: claimableBalance <= 0 || isClaiming ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: claimableBalance <= 0 || isClaiming ? 'none' : '0 4px 16px rgba(0, 255, 0, 0.4)',
              textShadow: claimableBalance <= 0 || isClaiming ? 'none' : '0 0 8px rgba(0, 0, 0, 0.8)',
              marginBottom: '24px'
            }}
            onMouseEnter={(e) => {
              if (claimableBalance > 0 && !isClaiming) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (claimableBalance > 0 && !isClaiming) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 255, 0, 0.4)'; 
              }
            }}
          >
            {isClaiming ? '⏳ PROCESSING CLAIM...' : 
             claimableBalance <= 0 ? '🚫 NO TOKENS TO CLAIM' :
               `💰 CLAIM ALL ${claimableBalance.toLocaleString()} BR TOKENS`}
          </button>

          {/* Withdraw Section */}
          <div style={{
            background: 'rgba(0,40,80,0.6)',
            border: '2px solid #0cf',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: '14px',
              color: '#0cf',
              textAlign: 'center'
            }}>
              📤 WITHDRAW TOKENS
            </h2>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount to withdraw"
                min="1"
                max={claimableBalance}
                style={{
                  flex: '1',
                  background: 'rgba(0,20,40,0.8)',
                  border: '2px solid #0cf',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#0cf',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '12px'
                }}
              />
              
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > claimableBalance}
                style={{
                  background: isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > claimableBalance ? 
                    'rgba(0,20,40,0.5)' :
                    'rgba(0,60,120,0.8)',
                  border: '2px solid #0cf',
                  borderRadius: '8px',
                  padding: '12px',
                  color: isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > claimableBalance ? 
                    '#666' : 
                    '#0cf',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '12px',
                  cursor: isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > claimableBalance ? 
                    'not-allowed' : 
                    'pointer'
                }}
              >
                {isWithdrawing ? 'PROCESSING...' : 'WITHDRAW'}
              </button>
            </div>
            
            {withdrawError && (
              <div style={{
                color: '#f00',
                fontSize: '10px',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {withdrawError}
              </div>
            )}
            
            {withdrawSuccess && (
              <div style={{
                color: '#0f0',
                fontSize: '10px',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                Withdrawal successful!
              </div>
            )}
            
            <div style={{
              fontSize: '10px',
              color: '#888',
              textAlign: 'center'
            }}>
              Withdraw your in-game tokens to your connected wallet
            </div>
          </div>

          {/* Transaction History */}
          <div style={{
            background: 'rgba(0,20,40,0.6)',
            border: '2px solid #0cf',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: '14px',
              color: '#0cf',
              textAlign: 'center'
            }}>
              📜 TRANSACTION HISTORY
            </h2>
            
            {transactions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#888',
                fontSize: '12px'
              }}>
                No transactions found
              </div>
            ) : (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #0cf',
                borderRadius: '8px',
                background: 'rgba(0,20,40,0.3)'
              }}>
                {transactions.map((tx, index) => (
                  <div 
                    key={tx.id || index} // Use tx.id if available, otherwise index
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: index < transactions.length - 1 ? '1px solid rgba(0, 204, 255, 0.2)' : 'none',
                      background: tx.status === 'completed' ? 'rgba(0,40,80,0.2)' : 'rgba(60,60,0,0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {getTransactionIcon(tx.tx_type || tx.type)}
                      </span>
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: '#0cf',
                          marginBottom: '4px',
                          textTransform: 'capitalize'
                        }}>
                          {(tx.tx_type || tx.type || '').replace('_', ' ')}
                        </div>
                        <div style={{
                          fontSize: '9px',
                          color: '#666'
                        }}>
                          {formatDate(tx.created_at || tx.timestamp)}
                        </div>
                        {tx.tx_hash && (
                          <div style={{
                            fontSize: '8px',
                            color: '#0cf',
                            marginTop: '4px',
                            wordBreak: 'break-all'
                          }}>
                            {tx.tx_hash && (
                              <>
                                TX: <a 
                                  href={`https://solscan.io/tx/${tx.tx_hash}?cluster=${ENV.SOLANA_NETWORK}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#0cf', textDecoration: 'underline' }}
                                >
                                  {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-6)}
                                </a>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '14px',
                      color: getTransactionColor(tx.tx_type || tx.type, tx.amount),
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}> 
                      {tx.amount > 0 ? '+' : ''}{parseInt(tx.amount).toLocaleString()} BR
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wallet Info */}
          <div style={{
            background: 'rgba(0,20,40,0.4)',
            border: '1px solid #0cf',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '10px',
            color: '#888',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px' }}>
              Connected Wallet: <span style={{ color: '#0cf' }}>
                {walletService.getConnectedWallet()?.publicKey.slice(0, 8)}...{walletService.getConnectedWallet()?.publicKey.slice(-8)}
              </span>
            </div>
            <div>
              Network: <span style={{ color: '#0cf' }}>{ENV.SOLANA_NETWORK}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletBalanceModal;
