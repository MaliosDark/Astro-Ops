import React from 'react';

const UserStatusIndicator = ({ user, isCompact = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#0f0';
      case 'in_mission': return '#ff0';
      case 'offline': return '#666';
      default: return '#888';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '🟢';
      case 'in_mission': return '🚀';
      case 'offline': return '⚫';
      default: return '❓';
    }
  };

  const getExperienceLevel = (stats) => {
    const totalExp = (stats.total_missions || 0) + 
                    (stats.total_raids_won || 0) * 2 + 
                    (stats.total_kills || 0) * 0.5;
    
    if (totalExp >= 100) return { level: 'VETERAN', color: '#ff0000', icon: '🎖️' };
    if (totalExp >= 50) return { level: 'EXPERIENCED', color: '#ff8800', icon: '⭐' };
    if (totalExp >= 20) return { level: 'SKILLED', color: '#ffff00', icon: '🔸' };
    if (totalExp >= 5) return { level: 'NOVICE', color: '#00ff00', icon: '🔹' };
    return { level: 'ROOKIE', color: '#888888', icon: '👤' };
  };

  const experience = getExperienceLevel(user.stats || {});

  if (isCompact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '10px'
      }}>
        <span>{getStatusIcon(user.status)}</span>
        <span style={{ color: '#0cf' }}>
          {user.public_key?.slice(0, 6)}...
        </span>
        <span style={{ color: experience.color }}>
          {experience.icon}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0,40,80,0.4)',
      border: '1px solid #0cf',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '11px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{getStatusIcon(user.status)}</span>
          <span style={{ color: '#0cf', fontWeight: 'bold' }}>
            {user.public_key?.slice(0, 8)}...
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: experience.color
        }}>
          <span>{experience.icon}</span>
          <span>{experience.level}</span>
        </div>
      </div>

      {/* Status */}
      <div style={{
        marginBottom: '8px',
        color: getStatusColor(user.status)
      }}>
        Status: {user.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      </div>

      {/* Stats */}
      {user.stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          fontSize: '9px',
          color: '#888'
        }}>
          <div>
            <div>Missions</div>
            <div style={{ color: '#0f0' }}>{user.stats.total_missions || 0}</div>
          </div>
          <div>
            <div>Raids</div>
            <div style={{ color: '#f80' }}>{user.stats.total_raids_won || 0}</div>
          </div>
          <div>
            <div>Kills</div>
            <div style={{ color: '#f00' }}>{user.stats.total_kills || 0}</div>
          </div>
        </div>
      )}

      {/* Current Mission */}
      {user.current_mission && (
        <div style={{
          marginTop: '8px',
          padding: '6px',
          background: 'rgba(255,255,0,0.1)',
          borderRadius: '4px',
          fontSize: '9px',
          color: '#ff0'
        }}>
          🚀 {user.current_mission.type} ({user.current_mission.mode})
        </div>
      )}

      {/* Last Seen */}
      {user.last_seen && (
        <div style={{
          marginTop: '6px',
          fontSize: '8px',
          color: '#666'
        }}>
          Last seen: {new Date(user.last_seen).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default UserStatusIndicator;