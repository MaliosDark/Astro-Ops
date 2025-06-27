import React, { useState } from 'react';
import { startMission } from '../../utils/gameLogic';

const MissionModal = ({ onClose }) => {
  const [selectedMission, setSelectedMission] = useState('MiningRun');
  const [selectedMode, setSelectedMode] = useState('Unshielded');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update mode in UI exactly like original
    if (window.AstroUI) {
      window.AstroUI.setMode(selectedMode);
    }
    
    // Start mission exactly like original
    startMission(selectedMission, selectedMode);
    onClose();
  };

  return (
    <div style={{ 
      background: 'rgba(0,20,40,0.8)',
      border: '4px solid #0cf',
      borderRadius: '8px',
      padding: '20px',
      width: '90%',
      maxWidth: '600px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(6px)',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0cf'
    }}>
      <h1 style={{ 
        margin: '0 0 16px',
        fontSize: '24px',
        textAlign: 'center',
        color: '#fc0'
      }}>
        Select Your Mission
      </h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr>
                <th style={{ border: '2px solid #0cf', padding: '8px', background: 'rgba(0,40,60,0.9)', color: '#0ff', textAlign: 'center', whiteSpace: 'nowrap' }}>Mission</th>
                <th style={{ border: '2px solid #0cf', padding: '8px', background: 'rgba(0,40,60,0.9)', color: '#0ff', textAlign: 'center', whiteSpace: 'nowrap' }}>Success %</th>
                <th style={{ border: '2px solid #0cf', padding: '8px', background: 'rgba(0,40,60,0.9)', color: '#0ff', textAlign: 'center', whiteSpace: 'nowrap' }}>Base Reward</th>
                <th style={{ border: '2px solid #0cf', padding: '8px', background: 'rgba(0,40,60,0.9)', color: '#0ff', textAlign: 'center', whiteSpace: 'nowrap' }}>Select</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: 'rgba(0,20,40,0.5)' }}>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>Mining Run</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>90%</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>10 AT</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>
                  <input 
                    type="radio" 
                    name="mission" 
                    value="MiningRun" 
                    checked={selectedMission === 'MiningRun'}
                    onChange={(e) => setSelectedMission(e.target.value)}
                  />
                </td>
              </tr>
              <tr style={{ background: 'rgba(0,30,50,0.3)' }}>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>Black Market</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>70%</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>30 AT</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>
                  <input 
                    type="radio" 
                    name="mission" 
                    value="BlackMarket" 
                    checked={selectedMission === 'BlackMarket'}
                    onChange={(e) => setSelectedMission(e.target.value)}
                  />
                </td>
              </tr>
              <tr style={{ background: 'rgba(0,20,40,0.5)' }}>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>Artifact Hunt</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>50%</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>60 AT</td>
                <td style={{ border: '2px solid #0cf', padding: '8px', textAlign: 'center' }}>
                  <input 
                    type="radio" 
                    name="mission" 
                    value="ArtifactHunt" 
                    checked={selectedMission === 'ArtifactHunt'}
                    onChange={(e) => setSelectedMission(e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <fieldset style={{ 
          border: '2px solid #0cf',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <legend style={{ 
            padding: '0 8px',
            color: '#0ff',
            fontSize: '14px'
          }}>
            Mode
          </legend>
          <label style={{ 
            marginRight: '16px',
            fontSize: '12px',
            color: '#0cf'
          }}>
            <input 
              type="radio" 
              name="mode" 
              value="Unshielded" 
              checked={selectedMode === 'Unshielded'}
              onChange={(e) => setSelectedMode(e.target.value)}
            />
            Unshielded
          </label>
          <label style={{ 
            fontSize: '12px',
            color: '#0cf'
          }}>
            <input 
              type="radio" 
              name="mode" 
              value="Shielded" 
              checked={selectedMode === 'Shielded'}
              onChange={(e) => setSelectedMode(e.target.value)}
            />
            Shielded
          </label>
        </fieldset>

        <button 
          type="submit"
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 0',
            background: '#0cf',
            border: '2px solid #0ff',
            borderRadius: '6px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '14px',
            color: '#000',
            cursor: 'pointer',
            transition: 'background .1s, color .1s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#0ff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#0cf';
          }}
        >
          Launch Mission
        </button>
      </form>
      
      {/* Mobile responsive styles */}
      <style jsx>{`
        @media (max-width: 600px) {
          .window {
            padding: 12px !important;
            width: 100% !important;
            height: 100% !important;
            overflow-y: auto !important;
          }
          h1 { 
            font-size: 18px !important; 
            margin-bottom: 12px !important; 
          }
          fieldset { 
            padding: 8px !important; 
            margin-bottom: 12px !important; 
          }
          legend { 
            font-size: 12px !important; 
          }
          label { 
            font-size: 10px !important; 
            margin-right: 8px !important; 
            display: block !important; 
            margin-bottom: 4px !important; 
          }
          .table-container { 
            margin-bottom: 12px !important; 
          }
          th, td { 
            padding: 6px !important; 
            font-size: 10px !important; 
          }
          button {
            padding: 10px 0 !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MissionModal;