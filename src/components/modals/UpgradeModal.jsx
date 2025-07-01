import React, { useState } from 'react';
import { performUpgrade } from '../../utils/gameLogic';

const UpgradeModal = ({ onClose }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);


  const upgrades = [
    { level: 1, bonus: '1.0×', cooldown: '8 h', cost: 0, total: 0, description: 'Basic ship configuration', unlocked: true },
    { level: 2, bonus: '1.1×', cooldown: '7.5 h', cost: 50, total: 50, description: 'Enhanced engine efficiency', unlocked: true },
    { level: 3, bonus: '1.2×', cooldown: '7 h', cost: 100, total: 150, description: 'Advanced navigation systems', unlocked: true },
    { level: 4, bonus: '1.3×', cooldown: '6.5 h', cost: 150, total: 300, description: 'Reinforced hull plating', unlocked: true },
    { level: 5, bonus: '1.45×', cooldown: '6 h', cost: 225, total: 525, description: 'Quantum drive integration', unlocked: true },
    { level: 6, bonus: '1.6×', cooldown: '5.5 h', cost: 300, total: 825, description: 'Neural interface upgrade', unlocked: true },
    { level: 7, bonus: '1.8×', cooldown: '5 h', cost: 400, total: 1225, description: 'Experimental technology', unlocked: true }
  ];

  const handleUpgrade = async (level) => {
    setIsUpgrading(true);
    
    try {
      // Close modal immediately to show animations if needed
      onClose();
      
      // Perform the upgrade
      await performUpgrade(level);
    } catch (error) {
      console.error('Upgrade failed:', error);
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Upgrade failed: ${error.message}`);
      }
    } finally {
      setIsUpgrading(false);
    }
    try {
      // Close modal immediately to show animations if needed
      onClose();
      
      // Perform the upgrade
      await performUpgrade(level);
    } catch (error) {
      console.error('Upgrade failed:', error);
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Upgrade failed: ${error.message}`);
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const getBenefitColor = (level) => {
    if (level <= 2) return '#0f0';
    if (level <= 4) return '#ff0';
    if (level <= 6) return '#f80';
    return '#f0f';
  };

  const getDifficultyLabel = (level) => {
    if (level <= 2) return 'Basic';
    if (level <= 4) return 'Advanced';
    if (level <= 6) return 'Expert';
    return 'Legendary';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,0,40,0.95), rgba(40,0,80,0.9))',
      border: '4px solid #f0f',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '1000px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(12px)',
      fontFamily: "'Press Start 2P', monospace",
      color: '#f0f',
      boxShadow: '0 8px 32px rgba(255, 0, 255, 0.3)',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          margin: '0 0 8px',
          fontSize: '24px',
          background: 'linear-gradient(45deg, #f0f, #ff0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(255, 0, 255, 0.5)'
        }}>
          ⚙️ SHIP UPGRADES
        </h1>
        <p style={{
          margin: '0',
          fontSize: '12px',
          color: '#888',
          lineHeight: '1.4'
        }}>
          Enhance your ship's capabilities and performance
        </p>
      </div>

      {/* Current Ship Status */}
      <div style={{
        background: 'rgba(60,0,120,0.6)',
        border: '2px solid #f0f',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '12px'
        }}>
          <img 
            src="https://bonkraiders.com/assets/ship.png" 
            alt="Ship" 
            style={{ 
              width: '48px', 
              height: '48px', 
              imageRendering: 'pixelated' 
            }} 
          />
          <div>
            <h2 style={{
              margin: '0 0 4px',
              fontSize: '16px',
              color: '#ff0'
            }}>
              CURRENT CONFIGURATION
            </h2>
            <div style={{
              fontSize: '12px',
              color: '#888'
            }}>
              Level 1 • Basic Performance
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          fontSize: '10px'
        }}>
          <div>
            <div style={{ color: '#888', marginBottom: '4px' }}>Reward Bonus</div>
            <div style={{ color: '#0f0' }}>×1.0 (Base)</div>
          </div>
          <div>
            <div style={{ color: '#888', marginBottom: '4px' }}>Mission Cooldown</div>
            <div style={{ color: '#0cf' }}>8 hours</div>
          </div>
          <div>
            <div style={{ color: '#888', marginBottom: '4px' }}>Total Investment</div>
            <div style={{ color: '#ff0' }}>0 BR</div>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {upgrades.slice(1).map((upgrade) => (
          <div
            key={upgrade.level}
            onClick={() => setSelectedLevel(upgrade.level)}
            style={{
              background: selectedLevel === upgrade.level ?
                'linear-gradient(135deg, rgba(255,0,255,0.3), rgba(255,100,255,0.2))' :
                'rgba(40,0,80,0.4)',
              border: selectedLevel === upgrade.level ? '2px solid #ff0' : '2px solid #f0f',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (selectedLevel !== upgrade.level) {
                e.target.style.background = 'rgba(60,0,120,0.5)';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedLevel !== upgrade.level) {
                e.target.style.background = 'rgba(40,0,80,0.4)';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {/* Level Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: getBenefitColor(upgrade.level),
              color: '#000',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              LV.{upgrade.level}
            </div>

            {/* Selection indicator */}
            {selectedLevel === upgrade.level && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                color: '#ff0',
                fontSize: '16px'
              }}>
                ✓
              </div>
            )}

            <div style={{ marginBottom: '12px', paddingTop: '8px' }}>
              <h3 style={{
                margin: '0 0 4px',
                fontSize: '14px',
                color: getBenefitColor(upgrade.level)
              }}>
                LEVEL {upgrade.level} UPGRADE
              </h3>
              <div style={{
                fontSize: '10px',
                color: '#888',
                marginBottom: '8px'
              }}>
                {getDifficultyLabel(upgrade.level)} • {upgrade.description}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
              fontSize: '11px'
            }}>
              <div>
                <div style={{ color: '#888', marginBottom: '4px' }}>Reward Bonus</div>
                <div style={{ color: getBenefitColor(upgrade.level) }}>{upgrade.bonus}</div>
              </div>
              <div>
                <div style={{ color: '#888', marginBottom: '4px' }}>Cooldown</div>
                <div style={{ color: '#0cf' }}>{upgrade.cooldown}</div>
              </div>
              <div>
                <div style={{ color: '#888', marginBottom: '4px' }}>Upgrade Cost</div>
                <div style={{ color: '#ff0' }}>{upgrade.cost} BR</div>
              </div>
              <div>
                <div style={{ color: '#888', marginBottom: '4px' }}>Total Cost</div>
                <div style={{ color: '#f80' }}>{upgrade.total} BR</div>
              </div>
            </div>

            {/* Benefits Preview */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '9px',
              color: '#ccc'
            }}>
              <div style={{ marginBottom: '4px', color: '#0f0' }}>
                ✓ {Math.round((parseFloat(upgrade.bonus.replace('×', '')) - 1) * 100)}% more rewards
              </div>
              <div style={{ color: '#0cf' }}>
                ✓ {8 - parseFloat(upgrade.cooldown.replace(' h', ''))} hours faster missions
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade Summary */}
      {selectedLevel && (
        <div style={{
          background: 'rgba(60,0,120,0.6)',
          border: '2px solid #ff0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: '0 0 12px',
            fontSize: '14px',
            color: '#ff0',
            textAlign: 'center'
          }}>
            📊 UPGRADE PREVIEW
          </h3>
          
          {(() => {
            const upgrade = upgrades.find(u => u.level === selectedLevel);
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                fontSize: '11px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', marginBottom: '4px' }}>New Performance</div>
                  <div style={{ color: getBenefitColor(selectedLevel) }}>{upgrade.bonus} rewards</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', marginBottom: '4px' }}>Mission Time</div>
                  <div style={{ color: '#0cf' }}>{upgrade.cooldown}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', marginBottom: '4px' }}>Investment</div>
                  <div style={{ color: '#ff0' }}>{upgrade.cost} BR</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', marginBottom: '4px' }}>ROI Estimate</div>
                  <div style={{ color: '#0f0' }}>~{Math.round(upgrade.cost / (upgrade.level * 5))} missions</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Upgrade Button */}
      {selectedLevel && (
        <button
          onClick={() => handleUpgrade(selectedLevel)}
          disabled={isUpgrading}
          disabled={isUpgrading}
          style={{
            width: '100%',
            padding: '16px',
            background: isUpgrading ? 
              'linear-gradient(135deg, rgba(150,0,150,0.5), rgba(120,0,120,0.5))' : 
              'linear-gradient(135deg, #f0f, #c0c)',
            color: isUpgrading ? '#aaa' : '#fff',
            border: '2px solid #ff0',
            borderRadius: '12px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '16px',
            cursor: isUpgrading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isUpgrading ? 'none' : '0 4px 16px rgba(255, 0, 255, 0.4)',
            textShadow: isUpgrading ? 'none' : '0 0 8px rgba(0, 0, 0, 0.8)'
          }}
          onMouseEnter={(e) => {
            if (!isUpgrading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 0, 255, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isUpgrading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(255, 0, 255, 0.4)';
            }
          }}
        >
          {isUpgrading ? '⏳ INSTALLING UPGRADE...' : `⚙️ INSTALL LEVEL ${selectedLevel} UPGRADE`}
        </button>
      )}

      {!selectedLevel && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#888',
          fontSize: '12px'
        }}>
          Select an upgrade level to proceed with installation
        </div>
      )}
    </div>
  );
};

export default UpgradeModal;