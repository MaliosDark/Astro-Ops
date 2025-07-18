import React, { useEffect, useState } from 'react';
import { performRaid, scanForRaids, getPlayerEnergy } from '../../utils/gameLogic';
import UserStatusIndicator from '../UserStatusIndicator';
import RaidNotification from '../RaidNotification';
import websocketService from '../../services/websocketService';
import { formatTimeLeft, calculateMissionTimeRemaining } from '../../utils/timeUtils'; // Import formatTimeLeft and calculateMissionTimeRemaining
import ENV from '../../config/environment';

const RaidModal = ({ onClose }) => {
  const [missions, setMissions] = useState([]);
  const [energy, setEnergy] = useState(10);
  const [isScanning, setIsScanning] = useState(false);
  const [isRaiding, setIsRaiding] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [realTimeUsers, setRealTimeUsers] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Set up WebSocket listeners for real-time updates
    const handleUserUpdate = (data) => {
      setRealTimeUsers(prev => {
        const updated = [...prev];
        const index = updated.findIndex(u => u.id === data.userId);
        if (index >= 0) {
          updated[index] = { ...updated[index], ...data };
        }
        return updated;
      });
    };

    const handleRaidNotification = (data) => {
      const notification = {
        id: Date.now(),
        type: data.type,
        title: data.title,
        message: data.message,
        details: data.details
      };
      setNotifications(prev => [...prev, notification]);
    };

    websocketService.on('user_status_update', handleUserUpdate);
    websocketService.on('raid_incoming', handleRaidNotification);
    websocketService.on('raid_completed', handleRaidNotification);

    return () => {
      websocketService.off('user_status_update', handleUserUpdate);
      websocketService.off('raid_incoming', handleRaidNotification);
      websocketService.off('raid_completed', handleRaidNotification);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // Load current player energy
      const currentEnergy = await getPlayerEnergy();
      setEnergy(currentEnergy);
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('Failed to load initial data:', error);
      }
      setEnergy(10); // Default energy
    }
  };

  const handleScanForRaids = async () => {
    if (energy < 1) {
      if (window.AstroUI) {
        window.AstroUI.setStatus('Not enough energy to scan! Energy refills 1 point per hour.');
      }
      return;
    }

    try {
      setIsScanning(true);
      const scannedMissions = await scanForRaids();
      
      // Also get real-time user data
      if (scannedMissions && scannedMissions.users) {
        setRealTimeUsers(scannedMissions.users);
      }
      
      if (scannedMissions && scannedMissions.length > 0) {
        setMissions(scannedMissions);
        setEnergy(prev => prev - 1);
        
        if (window.AstroUI) {
          window.AstroUI.setStatus(`Detected ${scannedMissions.length} vulnerable targets`);
          window.AstroUI.setEnergy(energy - 1);
        }
      } else {
        setMissions([]);
        setEnergy(prev => prev - 1);
        
        if (window.AstroUI) {
          window.AstroUI.setStatus('No vulnerable targets detected. Try again later.');
          window.AstroUI.setEnergy(energy - 1);
        }
      }
      
    } catch (error) {
      console.error('Failed to scan for raids:', error);
      
      if (window.AstroUI) {
        if (error.message?.includes('energy')) {
          window.AstroUI.setStatus('Insufficient energy for deep scan!');
        } else {
          window.AstroUI.setStatus('Scan interference detected. Retry recommended.');
        }
      }
      
      setMissions([]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectTarget = (mission) => {
    setSelectedTarget(mission);
  };

  const handleConfirmRaid = async () => {
    if (!selectedTarget || isRaiding) return;
    
    try {
      setIsRaiding(true);
      
      if (ENV.DEBUG_MODE) {
        console.log('🎯 Initiating raid on target:', selectedTarget.id);
      }
      
      // Close the modal immediately when raid starts
      onClose();
      
      // Execute raid with full animation sequence
      await performRaid(selectedTarget.id);
      
      // Remove the raided mission from the list
      setMissions(prev => prev.filter(m => m.id !== selectedTarget.id));
      setSelectedTarget(null);
      
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Raid execution failed:', error);
      }
      
      // Clear selection but don't close modal - let user try again
      setSelectedTarget(null);
    } finally {
      setIsRaiding(false);
    }
  };

  const handleTestTravel = () => {
    window.testTravel();
  };

  const getMissionTypeIcon = (type) => {
    switch (type) {
      case 'MiningRun': return '⛏️';
      case 'BlackMarket': return '🏴‍☠️';
      case 'ArtifactHunt': return '🏺';
      default: return '📦';
    }
  };

  const getMissionDifficulty = (reward) => {
    if (reward >= 15000) return { level: 'EXTREME', color: '#ff0000', icon: '💀' };
    if (reward >= 8000) return { level: 'HIGH', color: '#ff8800', icon: '⚠️' };
    if (reward >= 4000) return { level: 'MEDIUM', color: '#ffff00', icon: '⚡' };
    return { level: 'LOW', color: '#00ff00', icon: '✅' };
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getPlayerExperience = (mission) => {
    const totalMissions = mission.total_missions || 0;
    const totalRaids = mission.total_raids_won || 0;
    const totalKills = mission.total_kills || 0;
    
    const totalExp = totalMissions + (totalRaids * 2) + (totalKills * 0.5);
    
    if (totalExp >= 100) return { level: 'VETERAN', color: '#ff0000', icon: '🎖️' };
    if (totalExp >= 50) return { level: 'EXPERIENCED', color: '#ff8800', icon: '⭐' };
    if (totalExp >= 20) return { level: 'SKILLED', color: '#ffff00', icon: '🔸' };
    if (totalExp >= 5) return { level: 'NOVICE', color: '#00ff00', icon: '🔹' };
    return { level: 'ROOKIE', color: '#888888', icon: '👤' };
  };

  return (
    <>
      {/* Notifications */}
      {notifications.map(notification => (
        <RaidNotification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      <div style={{
        background: 'linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,60,0.9))',
        border: '4px solid #0ff',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        boxSizing: 'border-box',
        fontFamily: "'Press Start 2P', monospace",
        color: '#0ff',
        boxShadow: '0 8px 32px rgba(0, 255, 255, 0.3)',
        backdropFilter: 'blur(10px)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 16px',
            fontSize: '24px',
            background: 'linear-gradient(45deg, #0ff, #ff0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
          }}>
            🎯 RAID OPERATIONS
          </h1>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(0,60,80,0.6)',
            border: '2px solid #0cf',
            borderRadius: '8px',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span>Energy: <strong style={{ color: '#ff0' }}>{energy}/10</strong></span>
            </div>
            <div style={{ fontSize: '10px', color: '#888' }}>
              Refills 1/hour • Required for scanning
            </div>
          </div>
          
          <button
            onClick={handleScanForRaids}
            disabled={energy < 1 || isScanning}
            style={{
              width: '100%',
              padding: '12px',
              background: energy < 1 || isScanning ? 
                'linear-gradient(135deg, rgba(40,40,40,0.5), rgba(20,20,20,0.5))' : 
                'linear-gradient(135deg, #0cf, #0af)',
              color: energy < 1 || isScanning ? '#666' : '#000',
              border: '2px solid #0cf',
              borderRadius: '8px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '14px',
              cursor: energy < 1 || isScanning ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              transition: 'all 0.3s ease',
              boxShadow: energy < 1 || isScanning ? 'none' : '0 4px 16px rgba(0, 255, 255, 0.4)',
              textShadow: energy < 1 || isScanning ? 'none' : '0 0 8px rgba(0, 0, 0, 0.8)'
            }}
            onMouseEnter={(e) => {
              if (energy >= 1 && !isScanning) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (energy >= 1 && !isScanning) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 255, 255, 0.4)';
              }
            }}
          >
            {isScanning ? '🔍 SCANNING SECTOR...' : '🛰️ INITIATE DEEP SCAN (1 Energy)'}
          </button>
        </div>
        
        {/* Target Selection Section */}
        {missions.length > 0 ? (
          <div>
            <h2 style={{
              fontSize: '16px',
              margin: '0 0 16px',
              color: '#fc0',
              textAlign: 'center',
              textShadow: '0 0 10px rgba(255, 204, 0, 0.5)'
            }}>
              📡 VULNERABLE TARGETS ({missions.length})
            </h2>
            
            {/* Real-time Users Status */}
            {realTimeUsers.length > 0 && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(0,60,80,0.4)',
                border: '1px solid #0cf',
                borderRadius: '8px'
              }}>
                <h3 style={{
                  margin: '0 0 12px',
                  fontSize: '12px',
                  color: '#0ff'
                }}>
                  🌐 ACTIVE PILOTS ({realTimeUsers.length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {realTimeUsers.map(user => (
                    <UserStatusIndicator
                      key={user.id}
                      user={user}
                      isCompact={true}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '20px',
              border: '2px solid #0cf',
              borderRadius: '8px',
              background: 'rgba(0,20,40,0.3)'
            }}>
              {missions.map((mission) => {
                const difficulty = getMissionDifficulty(mission.reward);
                const playerExp = getPlayerExperience(mission);
                const isSelected = selectedTarget?.id === mission.id;
                
                // Calculate time remaining for the mission
                const timeLeft = calculateMissionTimeRemaining({
                  ts_start: mission.ts_start,
                  cooldown_seconds: mission.ts_complete - mission.ts_start // Calculate cooldown from ts_start and ts_complete
                });
                
                return (
                  <div 
                    key={mission.id} 
                    onClick={() => handleSelectTarget(mission)}
                    style={{
                      margin: '0',
                      padding: '16px',
                      background: isSelected ? 
                        'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,200,255,0.1))' :
                        mission.mode === 'Shielded' ? 
                          'linear-gradient(135deg, rgba(255,136,0,0.1), rgba(255,68,0,0.05))' : 
                          'rgba(0,40,60,0.2)',
                      border: isSelected ? '2px solid #0ff' : '1px solid #0cf',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderBottom: '1px solid #0cf',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.background = 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(0,150,255,0.05))';
                        e.target.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.background = mission.mode === 'Shielded' ? 
                          'linear-gradient(135deg, rgba(255,136,0,0.1), rgba(255,68,0,0.05))' : 
                          'rgba(0,40,60,0.2)';
                        e.target.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        bottom: '0',
                        width: '4px',
                        background: 'linear-gradient(180deg, #0ff, #0af)',
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
                      }} />
                    )}
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: window.innerWidth <= 600 ? 'column' : 'row',
                      justifyContent: 'space-between',
                      alignItems: window.innerWidth <= 600 ? 'stretch' : 'flex-start',
                      gap: window.innerWidth <= 600 ? '12px' : '16px'
                    }}>
                      {/* Target Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ fontSize: '18px' }}>
                            {getMissionTypeIcon(mission.type)}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#0ff' }}>
                            {mission.type.replace(/([A-Z])/g, ' $1').trim()}
                          </strong>
                          {mission.mode === 'Shielded' && (
                            <span style={{ 
                              color: '#f80', 
                              fontSize: '12px',
                              background: 'rgba(255, 136, 0, 0.2)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #f80'
                            }}>
                              🛡️ SHIELDED
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span>
                            Pilot: <span style={{ color: '#0cf' }}>
                              {mission.owner_short || 'Unknown'}
                            </span>
                          </span>
                          
                          {/* Real-time status indicator */}
                          {realTimeUsers.find(u => u.public_key === mission.owner) && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '9px',
                              color: '#0f0'
                            }}>
                              🟢 ONLINE
                            </span>
                          )}
                          
                          {mission.total_missions && (
                            <span style={{ color: '#666' }}>
                              Missions: {mission.total_missions}
                            </span>
                          )}
                          {mission.total_raids_won && (
                            <span style={{ color: '#f80' }}>
                              Raids: {mission.total_raids_won}
                            </span>
                          )}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: window.innerWidth <= 600 ? '9px' : '10px',
                          marginTop: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ color: difficulty.color }}>
                            {difficulty.icon} {difficulty.level} RISK
                          </span>
                          <span style={{ color: playerExp.color }}>
                            {playerExp.icon} {playerExp.level}
                          </span>
                          <span style={{ color: '#888' }}>
                            Time Remaining: {formatTimeLeft(timeLeft)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Reward Info */}
                      <div style={{ 
                        textAlign: window.innerWidth <= 600 ? 'center' : 'right',
                        minWidth: window.innerWidth <= 600 ? 'auto' : '120px',
                        alignSelf: window.innerWidth <= 600 ? 'center' : 'auto'
                      }}>
                        <div style={{
                          fontSize: '16px',
                          color: '#ff0', 
                          fontWeight: 'bold', 
                          marginBottom: '4px',
                          textShadow: '0 0 8px rgba(255, 255, 0, 0.5)',
                          whiteSpace: 'nowrap'
                        }}>
                          {parseInt(mission.reward || 0).toLocaleString()} BR
                        </div>
                        <div style={{
                          fontSize: '9px',
                          color: '#888'
                        }}>
                          Exact Loot
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection prompt */}
                    {isSelected && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        background: 'rgba(0, 255, 255, 0.1)',
                        border: '1px solid #0ff',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#0ff',
                        textAlign: 'center'
                      }}>
                        🎯 TARGET LOCKED • Ready for raid execution
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Raid Execution Button */}
            {selectedTarget && (
              <button
                onClick={handleConfirmRaid}
                disabled={isRaiding}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isRaiding ? 
                    'linear-gradient(135deg, rgba(40,40,40,0.5), rgba(20,20,20,0.5))' :
                    selectedTarget.mode === 'Shielded' ? 
                      'linear-gradient(135deg, #f80, #f60)' : 
                      'linear-gradient(135deg, #f00, #c00)',
                  color: isRaiding ? '#666' : '#fff',
                  border: '2px solid #f00',
                  borderRadius: '8px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: window.innerWidth <= 600 ? '12px' : '14px',
                  cursor: isRaiding ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: isRaiding ? 'none' : '0 4px 16px rgba(255, 0, 0, 0.4)',
                  textShadow: isRaiding ? 'none' : '0 0 8px rgba(0, 0, 0, 0.8)'
                }}
                onMouseEnter={(e) => {
                  if (!isRaiding) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(255, 0, 0, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRaiding) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(255, 0, 0, 0.4)';
                  }
                }}
              >
                {isRaiding ? '⚔️ RAID IN PROGRESS...' : 
                 selectedTarget.mode === 'Shielded' ? '🛡️ ATTEMPT BREACH RAID' : 
                 '⚔️ EXECUTE RAID MISSION'}
              </button>
            )}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#888',
            fontSize: '12px',
            background: 'rgba(0,20,40,0.3)',
            border: '2px dashed #0cf',
            borderRadius: '8px'
          }}>
            {energy < 1 ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
                <p style={{ marginBottom: '8px' }}>Insufficient energy for sector scanning.</p>
                <p style={{ fontSize: '10px', color: '#666' }}>
                  Energy regenerates automatically at 1 point per hour.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛰️</div>
                <p>Initiate deep scan to detect vulnerable targets.</p>
                <p style={{ fontSize: '10px', color: '#666' }}>
                  Scanning reveals unshielded missions ripe for raiding.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Test Travel Button */}
        <button
          onClick={handleTestTravel}
          style={{
            display: 'block',
            margin: '16px auto 0',
            background: 'linear-gradient(135deg, #f0f, #c0c)',
            color: '#fff',
            border: '2px solid #f0f',
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: window.innerWidth <= 600 ? '8px' : '10px',
            borderRadius: '6px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(255, 0, 255, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(255, 0, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(255, 0, 255, 0.3)';
          }}
        >
          🧪 TEST NAVIGATION SYSTEMS
        </button>
      </div>
    </>
  );
};

export default RaidModal;
