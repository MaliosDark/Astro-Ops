import React from 'react';
import { performUpgrade } from '../../utils/gameLogic';

const UpgradeModal = ({ onClose }) => {
  const upgrades = [
    { level: 1, bonus: '1.0×', cooldown: '8 h', cost: '—', total: '0 AT' },
    { level: 2, bonus: '1.1×', cooldown: '7.5 h', cost: '50 AT', total: '50 AT' },
    { level: 3, bonus: '1.2×', cooldown: '7 h', cost: '100 AT', total: '150 AT' },
    { level: 4, bonus: '1.3×', cooldown: '6.5 h', cost: '150 AT', total: '300 AT' },
    { level: 5, bonus: '1.45×', cooldown: '6 h', cost: '225 AT', total: '525 AT' },
    { level: 6, bonus: '1.6×', cooldown: '5.5 h', cost: '300 AT', total: '825 AT' },
    { level: 7, bonus: '1.8×', cooldown: '5 h', cost: '400 AT', total: '1225 AT' }
  ];

  const handleUpgrade = (level) => {
    performUpgrade(level);
    onClose();
  };

  const getRowColor = (index) => {
    const colors = [
      '#110011', '#001100', '#110000', '#001111', '#110022', '#112200', '#112211'
    ];
    return colors[index] || '#110011';
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '4px',
      background: '#011',
      padding: '8px',
      border: '4px solid #f0f',
      boxShadow: '0 0 8px #f0f',
      width: '90%',
      maxWidth: '800px',
      boxSizing: 'border-box',
      fontFamily: "'Press Start 2P', monospace"
    }}>
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        border: '2px solid #0f0',
        background: '#300030',
        color: '#f0f',
        fontSize: '16px'
      }}>
        UPGRADES DOSSIER
      </div>

      <div style={{
        gridColumn: '1 / 3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        border: '2px solid #0f0',
        background: '#003300',
        color: '#2df',
        fontSize: '10px'
      }}>
        Current Ship Level: 1
      </div>

      <div style={{
        gridColumn: '3 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '6px 8px 6px 6px',
        border: '2px solid #0f0',
        background: '#002244'
      }}>
        <img src="https://bonkraiders.com/assets/ship.png" alt="Ship" style={{ width: '64px', height: '64px', imageRendering: 'pixelated' }} />
      </div>

      {/* Headers */}
      {['Level', 'Bonus', 'Cooldown', 'Cost', 'Total', 'Action'].map((header, index) => (
        <div key={header} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          border: '2px solid #0f0',
          background: index === 5 ? '#ff0' : `#${(4 + index).toString(16)}${(4 + index).toString(16)}00${(4 + index).toString(16)}${(4 + index).toString(16)}`,
          color: index === 5 ? '#000' : '#0f0',
          fontSize: '12px'
        }}>
          {header}
        </div>
      ))}

      {/* Upgrade rows */}
      {upgrades.map((upgrade, index) => (
        <React.Fragment key={upgrade.level}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            border: '2px solid #0f0',
            background: getRowColor(index),
            color: '#0f0',
            fontSize: '12px'
          }}>
            {upgrade.level}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            border: '2px solid #0f0',
            background: getRowColor(index),
            color: '#0f0',
            fontSize: '12px'
          }}>
            {upgrade.bonus}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            border: '2px solid #0f0',
            background: getRowColor(index),
            color: '#0f0',
            fontSize: '12px'
          }}>
            {upgrade.cooldown}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            border: '2px solid #0f0',
            background: getRowColor(index),
            color: '#0f0',
            fontSize: '12px'
          }}>
            {upgrade.cost}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            border: '2px solid #0f0',
            background: getRowColor(index),
            color: '#0f0',
            fontSize: '12px'
          }}>
            {upgrade.total}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            border: '2px solid #0f0',
            background: getRowColor(index),
            fontSize: '12px'
          }}>
            <button
              onClick={() => handleUpgrade(upgrade.level)}
              style={{
                background: 'none',
                color: '#f0f',
                border: '2px solid #f0f',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: "'Press Start 2P', monospace",
                transition: 'background 0.1s, color 0.1s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f';
                e.target.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#f0f';
              }}
            >
              UPGRADE
            </button>
          </div>
        </React.Fragment>
      ))}

      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        border: '2px solid #0f0',
        background: '#223344',
        color: '#0f0',
        fontSize: '10px'
      }}>
        Select a level to apply the upgrade
      </div>
    </div>
  );
};

export default UpgradeModal;