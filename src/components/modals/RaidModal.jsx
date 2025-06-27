import React, { useEffect, useState } from 'react';
import { performRaid, scanForRaids, getPlayerEnergy } from '../../utils/gameLogic';

const RaidModal = ({ onClose }) => {
  const [missions, setMissions] = useState([]);
  const [energy, setEnergy] = useState(10);
  const [isScanning, setIsScanning] = useState(false);
  const [isRaiding, setIsRaiding] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Cargar energía actual del jugador
      const currentEnergy = await getPlayerEnergy();
      setEnergy(currentEnergy);
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('Failed to load initial data:', error);
      }
      // Don't show error to user for initial load failures
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
      const scannedMissions = await scanForRaids();
      setMissions(scannedMissions);
      setEnergy(prev => prev - 1);
      
      if (window.AstroUI) {
        window.AstroUI.setStatus(`Found ${scannedMissions.length} raidable missions`);
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
      
      // Usar la nueva función de raid con animaciones completas
      await performRaid(missionId);
      
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
          <span>Energy: {energy}/10</span>
          <span style={{ fontSize: '10px', color: '#888' }}>
            Refills 1/hour
          </span>
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
      </div>
      
      {missions.length > 0 ? (
        <div>
          <h2 style={{
            fontSize: '14px',
            margin: '0 0 12px',
            color: '#fc0'
          }}>
            Available Targets ({missions.length})
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>{mission.type}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    {mission.mode} • {mission.reward} BR
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