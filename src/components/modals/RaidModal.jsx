import React, { useEffect, useState } from 'react';
import { performRaid, scanForRaids, getPlayerEnergy } from '../../utils/gameLogic';

const RaidModal = ({ onClose }) => {
  const [missions, setMissions] = useState([]);
  const [energy, setEnergy] = useState(10);
  const [playerRating, setPlayerRating] = useState(1000);
  const [matchmakingInfo, setMatchmakingInfo] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRaiding, setIsRaiding] = useState(false);
  const [selectedRaidType, setSelectedRaidType] = useState('Quick');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Cargar energía actual del jugador
      const currentEnergy = await getPlayerEnergy();
      setEnergy(currentEnergy);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setEnergy(10); // Default energy
    }
  };

  const handleScanForRaids = async () => {
    if (energy < 1) {
      alert('Not enough energy to scan! Energy refills 1 point per hour.');
      return;
    }

    try {
      setIsScanning(true);
      const scanResult = await scanForRaids();
      setMissions(scanResult.missions || []);
      setEnergy(scanResult.remainingEnergy || 0);
      setPlayerRating(scanResult.playerRating || 1000);
      setMatchmakingInfo(scanResult.matchmakingInfo || null);
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Found ${scanResult.missions?.length || 0} suitable targets`);
      }
    } catch (error) {
      console.error('Failed to scan for raids:', error);
      // Mock data for development
      setMissions([
        { id: 1, type: 'Mining Run', mode: 'Unshielded', reward: 10 },
        { id: 2, type: 'Black Market', mode: 'Shielded', reward: 24 },
        { id: 3, type: 'Artifact Hunt', mode: 'Unshielded', reward: 60 }
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRaid = async (missionId) => {
    if (isRaiding) return;
    
    try {
      setIsRaiding(true);
      
      // Usar la nueva función de raid con tipo seleccionado
      await performRaid(missionId, selectedRaidType);
      
      // Remover la misión raideada de la lista
      setMissions(prev => prev.filter(m => m.id !== missionId));
      
      onClose();
    } catch (error) {
      console.error('Raid failed:', error);
    } finally {
      setIsRaiding(false);
    }
  };

  const handleTestTravel = () => {
    // Exact same as original
    window.testTravel();
  };

  return (
    <div style={{
      background: 'rgba(0,20,40,0.8)',
      border: '4px solid #0ff',
      borderRadius: '8px',
      padding: '20px',
      width: '80%',
      maxWidth: '600px',
      boxSizing: 'border-box',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0ff'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{
          textAlign: 'center',
          margin: '0 0 12px',
          fontSize: '20px'
        }}>
          Raid Operations
        </h1>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          marginBottom: '12px',
          padding: '8px',
          background: 'rgba(0,40,60,0.5)',
          border: '1px solid #0ff',
          borderRadius: '4px'
        }}>
          <div>
            <div>Energy: {energy}/10</div>
            <div style={{ fontSize: '10px', color: '#888' }}>
              Rating: {playerRating}
            </div>
          </div>
          <span style={{ fontSize: '10px', color: '#888' }}>
            Refills 1/hour
          </span>
        </div>
        
        {/* Raid Type Selection */}
        <div style={{
          marginBottom: '12px',
          padding: '8px',
          background: 'rgba(0,20,40,0.3)',
          border: '1px solid #0cf',
          borderRadius: '4px'
        }}>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#fc0' }}>
            Raid Type:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Quick', 'Stealth', 'Assault'].map(type => (
              <label key={type} style={{ 
                fontSize: '10px', 
                display: 'flex', 
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="raidType"
                  value={type}
                  checked={selectedRaidType === type}
                  onChange={(e) => setSelectedRaidType(e.target.value)}
                />
                {type}
              </label>
            ))}
          </div>
          <div style={{ fontSize: '9px', color: '#888', marginTop: '4px' }}>
            {selectedRaidType === 'Quick' && 'Balanced attack, moderate success chance'}
            {selectedRaidType === 'Stealth' && 'Higher stealth, lower damage but better detection avoidance'}
            {selectedRaidType === 'Assault' && 'Maximum damage, higher risk of detection'}
          </div>
        </div>
        
        <button
          onClick={handleScanForRaids}
          disabled={energy < 1 || isScanning}
          style={{
            width: '100%',
            padding: '8px',
            background: energy < 1 || isScanning ? 'rgba(20,20,20,0.5)' : '#0cf',
            color: energy < 1 || isScanning ? '#666' : '#000',
            border: '2px solid #0cf',
            borderRadius: '4px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '12px',
            cursor: energy < 1 || isScanning ? 'not-allowed' : 'pointer',
            marginBottom: '16px'
          }}
        >
          {isScanning ? 'SCANNING...' : `SCAN FOR TARGETS (1 Energy)`}
        </button>
        
        {matchmakingInfo && (
          <div style={{
            fontSize: '9px',
            color: '#888',
            textAlign: 'center',
            marginTop: '4px'
          }}>
            Pool: {matchmakingInfo.totalPoolSize} active missions | 
            Rating range: {matchmakingInfo.ratingRange[0]}-{matchmakingInfo.ratingRange[1]}
          </div>
        )}
      </div>
      
      {missions.length > 0 ? (
        <div>
          <h2 style={{
            fontSize: '14px',
            margin: '0 0 12px',
            color: '#fc0'
          }}>
            Matched Targets ({missions.length})
          </h2>
          
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 16px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {missions.map((mission) => (
              <li key={mission.id} style={{
                margin: '8px 0',
                padding: '8px',
                background: 'rgba(0,20,40,0.3)',
                border: '1px solid #0cf',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{mission.type}</strong>
                      <span style={{ color: '#fc0' }}>★{mission.target_rating}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                      {mission.owner_name} • Lv.{mission.target_ship_level} • {mission.loot_value} BR
                    </div>
                    <div style={{ fontSize: '9px', color: '#666' }}>
                      Risk: {mission.risk_factor}x • Defended: {mission.raids_defended || 0} times
                    </div>
                  </div>
                  <button
                    onClick={() => handleRaid(mission.id)}
                    disabled={isRaiding}
                    style={{
                      background: isRaiding ? 'rgba(20,20,20,0.5)' : '#0ff',
                      color: isRaiding ? '#666' : '#000',
                      border: '2px solid #0ff',
                      padding: '6px 12px',
                      cursor: isRaiding ? 'not-allowed' : 'pointer',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '10px',
                      borderRadius: '4px',
                      marginLeft: '8px'
                    }}
                  >
                    {isRaiding ? 'RAIDING...' : 'RAID'}
                  </button>
                </div>
                
                {/* Match Score Indicator */}
                <div style={{
                  marginTop: '6px',
                  height: '4px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (mission.matchmaking_score || 0) / 2)}%`,
                    background: mission.matchmaking_score > 100 ? '#0f0' : 
                               mission.matchmaking_score > 50 ? '#fc0' : '#f60',
                    borderRadius: '2px'
                  }} />
                </div>
                <div style={{ fontSize: '8px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                  Match: {Math.round(mission.matchmaking_score || 0)}%
                </div>
              </li>
            ))}
          </ul>
          
          <div style={{
            fontSize: '10px',
            color: '#888',
            textAlign: 'center',
            marginTop: '8px',
            padding: '6px',
            background: 'rgba(0,20,40,0.2)',
            borderRadius: '4px'
          }}>
            Targets matched by rating, difficulty, and loot value.
            <br />
            Higher match scores indicate better raid opportunities.
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#888',
          fontSize: '12px'
        }}>
          {energy < 1 ? (
            <div>
              <p>Not enough energy to scan for targets.</p>
              <p style={{ fontSize: '10px' }}>
                Energy refills automatically at 1 point per hour.
              </p>
            </div>
          ) : (
            <div>
              <p>Click "SCAN FOR TARGETS" to find suitable raid targets.</p>
              <p style={{ fontSize: '10px' }}>
                Matchmaking finds players near your skill level.
              </p>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={handleTestTravel}
        style={{
          display: 'block',
          margin: '12px auto 0',
          background: '#f0f',
          borderColor: '#f0f',
          color: '#000',
          border: '2px solid #f0f',
          padding: '8px 16px',
          cursor: 'pointer',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '12px'
        }}
      >
        TEST TRAVEL
      </button>
    </div>
  );
};

export default RaidModal;
                  </div>
                </div>
                <button
                  onClick={() => handleRaid(mission.id)}
                  disabled={isRaiding}
                  style={{
                    background: isRaiding ? 'rgba(20,20,20,0.5)' : '#0ff',
                    color: isRaiding ? '#666' : '#000',
                    border: '2px solid #0ff',
                    padding: '6px 12px',
                    cursor: isRaiding ? 'not-allowed' : 'pointer',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '10px',
                    borderRadius: '4px'
                  }}
                >
                  {isRaiding ? 'RAIDING...' : 'RAID'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#888',
          fontSize: '12px'
        }}>
          {energy < 1 ? (
            <div>
              <p>Not enough energy to scan for targets.</p>
              <p style={{ fontSize: '10px' }}>
                Energy refills automatically at 1 point per hour.
              </p>
            </div>
          ) : (
            <p>Click "SCAN FOR TARGETS" to find raidable missions.</p>
          )}
        </div>
      )}
      
      <button
        onClick={handleTestTravel}
        style={{
          display: 'block',
          margin: '12px auto 0',
          background: '#f0f',
          borderColor: '#f0f',
          color: '#000',
          border: '2px solid #f0f',
          padding: '8px 16px',
          cursor: 'pointer',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '12px'
        }}
      >
        TEST TRAVEL
      </button>
    </div>
  );
};

export default RaidModal;