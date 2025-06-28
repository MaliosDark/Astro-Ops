import React, { useState } from 'react';
import { startMission } from '../../utils/gameLogic';

const MissionModal = ({ onClose }) => {
  const [selectedMission, setSelectedMission] = useState('MiningRun');
  const [selectedMode, setSelectedMode] = useState('Unshielded');

  const missions = [
    {
      id: 'MiningRun',
      name: 'Mining Run',
      description: 'Extract valuable resources from asteroid fields',
      successRate: 90,
      baseReward: 10,
      icon: '⛏️',
      difficulty: 'Easy',
      duration: '2-3 hours'
    },
    {
      id: 'BlackMarket',
      name: 'Black Market',
      description: 'Trade in forbidden goods and contraband',
      successRate: 70,
      baseReward: 30,
      icon: '🏴‍☠️',
      difficulty: 'Medium',
      duration: '3-4 hours'
    },
    {
      id: 'ArtifactHunt',
      name: 'Artifact Hunt',
      description: 'Search for ancient alien artifacts',
      successRate: 50,
      baseReward: 60,
      icon: '🏺',
      difficulty: 'Hard',
      duration: '4-6 hours'
    }
  ];

  const modes = [
    {
      id: 'Unshielded',
      name: 'Unshielded',
      description: 'Full rewards but vulnerable to raids',
      modifier: '100%',
      icon: '🔓',
      risk: 'High Risk'
    },
    {
      id: 'Shielded',
      name: 'Shielded',
      description: 'Protected from raids but reduced rewards',
      modifier: '80%',
      icon: '🛡️',
      risk: 'Low Risk'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (window.AstroUI) {
      window.AstroUI.setMode(selectedMode);
    }
    
    startMission(selectedMission, selectedMode);
    onClose();
  };

  const selectedMissionData = missions.find(m => m.id === selectedMission);
  const selectedModeData = modes.find(m => m.id === selectedMode);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,80,0.9))',
      border: '4px solid #0cf',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '900px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(12px)',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0cf',
      boxShadow: '0 8px 32px rgba(0, 255, 255, 0.3)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          margin: '0 0 8px',
          fontSize: '24px',
          background: 'linear-gradient(45deg, #0cf, #ff0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
        }}>
          🚀 MISSION CONTROL
        </h1>
        <p style={{
          margin: '0',
          fontSize: '12px',
          color: '#888',
          lineHeight: '1.4'
        }}>
          Select your mission type and deployment mode
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Mission Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '16px',
            margin: '0 0 16px',
            color: '#ff0',
            textAlign: 'center'
          }}>
            📋 MISSION TYPES
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {missions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => setSelectedMission(mission.id)}
                style={{
                  background: selectedMission === mission.id ?
                    'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,200,255,0.1))' :
                    'rgba(0,40,80,0.3)',
                  border: selectedMission === mission.id ? '2px solid #0ff' : '2px solid #0cf',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (selectedMission !== mission.id) {
                    e.target.style.background = 'rgba(0,60,120,0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedMission !== mission.id) {
                    e.target.style.background = 'rgba(0,40,80,0.3)';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Selection indicator */}
                {selectedMission === mission.id && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    color: '#0ff',
                    fontSize: '16px'
                  }}>
                    ✓
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>{mission.icon}</span>
                  <div>
                    <h3 style={{
                      margin: '0 0 4px',
                      fontSize: '14px',
                      color: '#0ff'
                    }}>
                      {mission.name}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '10px',
                      color: '#888'
                    }}>
                      <span>{mission.difficulty}</span>
                      <span>{mission.duration}</span>
                    </div>
                  </div>
                </div>
                
                <p style={{
                  margin: '0 0 12px',
                  fontSize: '10px',
                  color: '#ccc',
                  lineHeight: '1.4'
                }}>
                  {mission.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}>
                  <div>
                    <span style={{ color: '#0f0' }}>Success: {mission.successRate}%</span>
                  </div>
                  <div>
                    <span style={{ color: '#ff0' }}>Reward: {mission.baseReward} BR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '16px',
            margin: '0 0 16px',
            color: '#ff0',
            textAlign: 'center'
          }}>
            ⚙️ DEPLOYMENT MODE
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {modes.map((mode) => (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                style={{
                  background: selectedMode === mode.id ?
                    'linear-gradient(135deg, rgba(255,255,0,0.2), rgba(255,200,0,0.1))' :
                    'rgba(0,40,80,0.3)',
                  border: selectedMode === mode.id ? '2px solid #ff0' : '2px solid #0cf',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedMode !== mode.id) {
                    e.target.style.background = 'rgba(0,60,120,0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedMode !== mode.id) {
                    e.target.style.background = 'rgba(0,40,80,0.3)';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Selection indicator */}
                {selectedMode === mode.id && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    color: '#ff0',
                    fontSize: '16px'
                  }}>
                    ✓
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>{mode.icon}</span>
                  <div>
                    <h3 style={{
                      margin: '0 0 4px',
                      fontSize: '14px',
                      color: '#ff0'
                    }}>
                      {mode.name}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      color: mode.id === 'Unshielded' ? '#f80' : '#0f0'
                    }}>
                      {mode.risk}
                    </span>
                  </div>
                </div>
                
                <p style={{
                  margin: '0 0 12px',
                  fontSize: '10px',
                  color: '#ccc',
                  lineHeight: '1.4'
                }}>
                  {mode.description}
                </p>
                
                <div style={{
                  fontSize: '12px',
                  color: '#ff0',
                  textAlign: 'center'
                }}>
                  Reward Modifier: {mode.modifier}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Summary */}
        {selectedMissionData && selectedModeData && (
          <div style={{
            background: 'rgba(0,60,80,0.6)',
            border: '2px solid #0cf',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              margin: '0 0 12px',
              fontSize: '14px',
              color: '#0ff',
              textAlign: 'center'
            }}>
              📊 MISSION SUMMARY
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              fontSize: '11px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', marginBottom: '4px' }}>Mission</div>
                <div style={{ color: '#0ff' }}>{selectedMissionData.name}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', marginBottom: '4px' }}>Mode</div>
                <div style={{ color: '#ff0' }}>{selectedModeData.name}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', marginBottom: '4px' }}>Success Rate</div>
                <div style={{ color: '#0f0' }}>{selectedMissionData.successRate}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', marginBottom: '4px' }}>Expected Reward</div>
                <div style={{ color: '#ff0' }}>
                  {Math.floor(selectedMissionData.baseReward * (selectedModeData.modifier === '100%' ? 1 : 0.8))} BR
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Launch Button */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #0cf, #0af)',
            color: '#000',
            border: '2px solid #0ff',
            borderRadius: '12px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0, 255, 255, 0.4)',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.8)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(0, 255, 255, 0.4)';
          }}
        >
          🚀 LAUNCH MISSION
        </button>
      </form>
    </div>
  );
};

export default MissionModal;