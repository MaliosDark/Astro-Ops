import React, { useEffect, useState } from 'react';
import { performClaim } from '../../utils/gameLogic';
import { getPendingRewards } from '../../utils/gameLogic';

const ClaimModal = ({ onClose }) => {
  const [pendingRewards, setPendingRewards] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPendingRewards();
  }, []);

  const fetchPendingRewards = async () => {
    try {
      const pending = await getPendingRewards();
      setPendingRewards(pending || []);
      
      const totalAmount = pending?.reduce((sum, item) => sum + item.amount, 0) || 0;
      setTotal(totalAmount);
    } catch (error) {
      console.error('Failed to fetch pending rewards:', error);
      // Mock data for development
      const mockPending = [
        { source: 'Mining Run', amount: 10, id: 1 },
        { source: 'Black Market', amount: 30, id: 2 }
      ];
      setPendingRewards(mockPending);
      setTotal(40);
    }
  };

  const handleClaim = async () => {
    try {
      await performClaim();
      onClose();
    } catch (error) {
      console.error('Claim failed:', error);
    }
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
      color: '#0f0'
    }}>
      <h1 style={{
        margin: '0 0 12px',
        fontSize: '20px',
        textAlign: 'center',
        color: '#f0a'
      }}>
        CLAIM AT REWARDS
      </h1>
      
      <img 
        src="/assets/ship.png" 
        alt="Ship" 
        style={{
          display: 'block',
          margin: '0 auto 12px',
          width: '48px',
          height: '48px',
          imageRendering: 'pixelated'
        }}
      />

      <p style={{
        fontSize: '14px',
        lineHeight: '1.5',
        margin: '0 0 12px'
      }}>
        Your pending rewards:
      </p>
      
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '12px',
        fontSize: '12px'
      }}>
        <thead>
          <tr>
            <th style={{
              border: '2px solid #f0a',
              padding: '4px 6px',
              textAlign: 'left',
              background: 'rgba(60,0,60,0.8)',
              color: '#f0a'
            }}>
              Source
            </th>
            <th style={{
              border: '2px solid #f0a',
              padding: '4px 6px',
              textAlign: 'left',
              background: 'rgba(60,0,60,0.8)',
              color: '#f0a'
            }}>
              Pending AT
            </th>
          </tr>
        </thead>
        <tbody>
          {pendingRewards.map((item, index) => (
            <tr key={item.id || index} style={{
              background: index % 2 === 0 ? 'rgba(40,0,40,0.5)' : 'rgba(60,0,60,0.3)'
            }}>
              <td style={{
                border: '2px solid #f0a',
                padding: '4px 6px',
                textAlign: 'left'
              }}>
                {item.source}
              </td>
              <td style={{
                border: '2px solid #f0a',
                padding: '4px 6px',
                textAlign: 'left'
              }}>
                {item.amount} BR
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{
        textAlign: 'right',
        fontSize: '14px',
        margin: '0 0 12px',
        color: '#ff0'
      }}>
        Total: <span>{total}</span> AT
      </div>

      <button
        onClick={handleClaim}
        style={{
          display: 'block',
          margin: '0 auto',
          background: 'rgba(0,20,0,0.7)',
          border: '2px solid #0f0',
          borderRadius: '4px',
          padding: '8px 16px',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '14px',
          color: '#0f0',
          cursor: 'pointer',
          transition: 'background .1s, color .1s'
        }}
        onMouseDown={(e) => {
          e.target.style.background = 'rgba(0,20,0,1)';
          e.target.style.color = '#000';
        }}
        onMouseUp={(e) => {
          e.target.style.background = 'rgba(0,20,0,0.7)';
          e.target.style.color = '#0f0';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(0,20,0,0.7)';
          e.target.style.color = '#0f0';
        }}
      >
        CLAIM YOUR AT
      </button>
      
      <div style={{
        marginTop: '12px',
        height: '16px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#2df',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}>
        {/* Status messages can be added here */}
      </div>
    </div>
  );
};

export default ClaimModal;