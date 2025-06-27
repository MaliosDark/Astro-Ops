import React, { useEffect, useState } from 'react';
import { performRaid } from '../../utils/gameLogic';
import { testTravel } from '../../utils/shipAnimator';
import { getMissionsForRaid } from '../../utils/gameLogic';

const RaidModal = ({ onClose }) => {
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    // Fetch missions from server
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const missions = await getMissionsForRaid();
      setMissions(missions);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
      // Mock data for development
      setMissions([
        { id: 1, type: 'Mining Run', mode: 'Unshielded', reward: 10 },
        { id: 2, type: 'Black Market', mode: 'Shielded', reward: 24 },
        { id: 3, type: 'Artifact Hunt', mode: 'Unshielded', reward: 60 }
      ]);
    }
  };

  const handleRaid = async (missionId) => {
    try {
      await window.animateShipLaunch();
      await window.animateRaidTo(missionId);
      await performRaid(missionId);
      await window.animateShipReturn();
      onClose();
    } catch (error) {
      console.error('Raid failed:', error);
    }
  };

  const handleTestTravel = () => {
    testTravel();
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
      <h1 style={{
        textAlign: 'center',
        margin: '0 0 16px',
        fontSize: '20px'
      }}>
        Nearby Targets
      </h1>
      
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: '0 0 16px'
      }}>
        {missions.map((mission) => (
          <li key={mission.id} style={{
            margin: '8px 0',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px'
          }}>
            <span>{mission.type} — {mission.mode} — {mission.reward} BR</span>
            <button
              onClick={() => handleRaid(mission.id)}
              style={{
                background: '#0ff',
                color: '#000',
                border: '2px solid #0ff',
                padding: '4px 8px',
                cursor: 'pointer',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '12px'
              }}
            >
              RAID
            </button>
          </li>
        ))}
      </ul>
      
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
        onMouseEnter={(e) => {
          e.target.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '1';
        }}
      >
        TEST TRAVEL
      </button>
    </div>
  );
};

export default RaidModal;