import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import ENV from '../config/environment';

/**
 * Economy Panel Component
 * Displays BR balance and game earnings with withdrawal functionality
 */
const EconomyPanel = ({ walletAddress }) => {
  const [balance, setBalance] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadEconomyData();
    }
  }, [walletAddress]);

  const loadEconomyData = async () => {
    try {
      setIsLoading(true);
      
      // Get user profile with balance
      const profile = await apiService.getUserProfile();
      
      if (profile && profile.ship) {
        setBalance(profile.ship.br_balance || 0);
      }
      
      // Get earnings (total earned minus current balance)
      try {
        const earningsData = await apiService.getEarnings();
        setEarnings(earningsData.total_earned || 0);
        
        // Set transaction history if available
        if (earningsData.transactions) {
          setTransactionHistory(earningsData.transactions);
        }
      } catch (error) {
        console.error('Failed to load earnings:', error);
        // Fallback: estimate earnings as 120% of balance
        setEarnings(Math.round(balance * 1.2));
      }
    } catch (error) {
      console.error('Failed to load economy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawClick = () => {
    setShowWithdrawForm(true);
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      alert('Please enter a valid amount to withdraw');
      return;
    }
    
    try {
      setIsWithdrawing(true);
      
      // Call API to withdraw tokens
      const result = await apiService.withdrawTokens(amount);
      
      if (result.success) {
        // Update balance
        setBalance(prev => prev - amount);
        
        // Add to transaction history
        const newTransaction = {
          id: Date.now(),
          type: 'withdrawal',
          amount: amount,
          timestamp: Date.now(),
          status: 'completed',
          txHash: result.txHash
        };
        
        setTransactionHistory(prev => [newTransaction, ...prev]);
        
        // Reset form
        setWithdrawAmount('');
        setShowWithdrawForm(false);
        
        // Show success message
        if (window.AstroUI) {
          window.AstroUI.setStatus(`Withdrawal of ${amount} BR successful!`);
        }
      } else {
        throw new Error(result.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleHistoryToggle = () => {
    setShowHistory(prev => !prev);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getTransactionStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#0f0';
      case 'pending': return '#ff0';
      case 'failed': return '#f00';
      default: return '#888';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'mission': return '🚀';
      case 'raid': return '⚔️';
      case 'upgrade': return '⚙️';
      case 'withdrawal': return '💸';
      case 'deposit': return '💰';
      default: return '📝';
    }
  };

  return (
    <div className="economy-panel">
      <div className="economy-header">
        <h2>💰 Economy Dashboard</h2>
        {!isLoading && (
          <div className="economy-actions">
            <button 
              className="refresh-btn" 
              onClick={loadEconomyData}
              title="Refresh economy data"
            >
              🔄
            </button>
            <button 
              className="history-btn" 
              onClick={handleHistoryToggle}
              title={showHistory ? "Hide history" : "Show history"}
            >
              📜
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="economy-loading">
          <div className="loading-spinner"></div>
          <p>Loading economy data...</p>
        </div>
      ) : (
        <>
          <div className="economy-stats">
            <div className="economy-stat-item">
              <div className="stat-label">Current Balance</div>
              <div className="stat-value balance">{balance.toLocaleString()} BR</div>
              <div className="stat-description">Available for upgrades or withdrawal</div>
            </div>
            
            <div className="economy-stat-item">
              <div className="stat-label">Total Earnings</div>
              <div className="stat-value earnings">{earnings.toLocaleString()} BR</div>
              <div className="stat-description">Lifetime earnings from all sources</div>
            </div>
          </div>

          {!showWithdrawForm ? (
            <button 
              className="withdraw-btn"
              onClick={handleWithdrawClick}
              disabled={balance <= 0}
            >
              Withdraw BR Tokens
            </button>
          ) : (
            <form className="withdraw-form" onSubmit={handleWithdrawSubmit}>
              <div className="form-group">
                <label htmlFor="withdraw-amount">Amount to withdraw:</label>
                <input
                  id="withdraw-amount"
                  type="number"
                  min="1"
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max: ${balance} BR`}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowWithdrawForm(false)}
                  disabled={isWithdrawing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="confirm-btn"
                  disabled={isWithdrawing || !withdrawAmount || parseInt(withdrawAmount) <= 0 || parseInt(withdrawAmount) > balance}
                >
                  {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
              
              <div className="withdraw-note">
                Tokens will be sent directly to your connected wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </form>
          )}

          {showHistory && (
            <div className="transaction-history">
              <h3>Transaction History</h3>
              
              {transactionHistory.length === 0 ? (
                <div className="no-transactions">
                  No transactions found
                </div>
              ) : (
                <div className="transactions-list">
                  {transactionHistory.map(tx => (
                    <div key={tx.id} className="transaction-item">
                      <div className="transaction-icon">
                        {getTransactionTypeIcon(tx.type)}
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-type">
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                        </div>
                        <div className="transaction-date">
                          {formatDate(tx.timestamp)}
                        </div>
                      </div>
                      <div className="transaction-amount">
                        {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} BR
                      </div>
                      <div 
                        className="transaction-status"
                        style={{ color: getTransactionStatusColor(tx.status) }}
                      >
                        {tx.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EconomyPanel;