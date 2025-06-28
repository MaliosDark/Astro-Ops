import React, { useState, useEffect } from 'react';

const RaidNotification = ({ notification, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          setTimeout(onClose, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'raid_incoming':
        return {
          background: 'linear-gradient(135deg, rgba(255,0,0,0.9), rgba(200,0,0,0.8))',
          border: '3px solid #ff0000',
          boxShadow: '0 0 20px rgba(255,0,0,0.6)'
        };
      case 'raid_success':
        return {
          background: 'linear-gradient(135deg, rgba(0,255,0,0.9), rgba(0,200,0,0.8))',
          border: '3px solid #00ff00',
          boxShadow: '0 0 20px rgba(0,255,0,0.6)'
        };
      case 'raid_failed':
        return {
          background: 'linear-gradient(135deg, rgba(255,136,0,0.9), rgba(200,100,0,0.8))',
          border: '3px solid #ff8800',
          boxShadow: '0 0 20px rgba(255,136,0,0.6)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, rgba(0,255,255,0.9), rgba(0,200,255,0.8))',
          border: '3px solid #00ffff',
          boxShadow: '0 0 20px rgba(0,255,255,0.6)'
        };
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'raid_incoming': return '🚨';
      case 'raid_success': return '💰';
      case 'raid_failed': return '🛡️';
      default: return '📡';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        ...getNotificationStyle(),
        borderRadius: '12px',
        padding: '16px 20px',
        fontFamily: "'Press Start 2P', monospace",
        color: '#fff',
        minWidth: '300px',
        maxWidth: '400px',
        backdropFilter: 'blur(10px)',
        animation: 'slideInRight 0.5s ease-out',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.5s ease-in-out'
      }}
    >
      {/* Close button */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          color: '#fff',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '24px' }}>{getIcon()}</span>
        <div>
          <h3 style={{
            margin: '0 0 4px',
            fontSize: '12px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            {notification.title || 'Notification'}
          </h3>
          <p style={{
            margin: '0',
            fontSize: '10px',
            opacity: 0.9,
            lineHeight: '1.3'
          }}>
            {notification.message || 'You have a new notification'}
          </p>
        </div>
      </div>

      {/* Additional info */}
      {notification.details && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '6px',
          padding: '8px',
          marginTop: '8px',
          fontSize: '9px'
        }}>
          {notification.details}
        </div>
      )}

      {/* Timer */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        right: '8px',
        fontSize: '8px',
        opacity: 0.7
      }}>
        {timeLeft}s
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '3px',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: '#fff',
          width: `${(timeLeft / 10) * 100}%`,
          transition: 'width 1s linear'
        }} />
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default RaidNotification;