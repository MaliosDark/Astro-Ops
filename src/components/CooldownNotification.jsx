import React, { useState, useEffect } from 'react';

/**
 * Component to display a cooldown violation notification
 * Shows remaining time until cooldown expires
 */
const CooldownNotification = ({ message, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(Math.floor(duration / 1000));
  
  // Extract cooldown time from message if available
  const cooldownTimeMatch = message?.match(/(\d+):(\d+):(\d+)/);
  const hasCooldownTime = !!cooldownTimeMatch;
  
  useEffect(() => {
    // Auto-close after duration
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Allow time for fade-out animation
    }, duration);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [duration, onClose]);
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, rgba(60,0,0,0.95), rgba(80,0,0,0.9))',
      border: '3px solid #f00',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '90%',
      width: '400px',
      boxShadow: '0 0 20px rgba(255,0,0,0.5)',
      zIndex: 10000,
      fontFamily: "'Press Start 2P', monospace",
      color: '#fff',
      textAlign: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '16px', color: '#f00' }}>⚠️</div>
      
      <h2 style={{ 
        fontSize: '16px', 
        margin: '0 0 16px', 
        color: '#f00',
        textShadow: '0 0 8px rgba(255,0,0,0.5)'
      }}>
        COOLDOWN ACTIVE
      </h2>
      
      <p style={{ fontSize: '12px', marginBottom: '16px', lineHeight: '1.5' }}>
        {hasCooldownTime ? (
          <>Your ship is still on cooldown from the previous mission.</>
        ) : (
          <>Your ship is still on cooldown from the previous mission.</>
        )}
      </p>
      
      {hasCooldownTime && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid #f00',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '18px',
          color: '#f00',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          {cooldownTimeMatch[0]}
        </div>
      )}
      
      <div style={{
        fontSize: '10px',
        color: '#aaa',
        marginTop: '16px'
      }}>
        This message will close in {timeLeft} seconds
      </div>
      
      <button 
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'rgba(60,0,0,0.8)',
          border: '2px solid #f00',
          borderRadius: '6px',
          padding: '8px 16px',
          marginTop: '16px',
          color: '#fff',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(80,0,0,0.9)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(60,0,0,0.8)';
        }}
      >
        CLOSE
      </button>
    </div>
  );
};

export default CooldownNotification;