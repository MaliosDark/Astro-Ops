import React from 'react';

const HowToModal = ({ onClose }) => {
  return (
    <div style={{
      width: '90%',
      maxWidth: '900px',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '24px',
      padding: '16px',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0cf'
    }}>
      <h1 style={{
        textAlign: 'center',
        color: '#fc0',
        fontSize: '24px',
        marginBottom: '16px'
      }}>
        Astro Ops – How to Play
      </h1>

      {/* Ships & Missions */}
      <div style={{
        background: 'rgba(0, 20, 20, 0.6)',
        border: '2px solid #0cf',
        borderRadius: '8px',
        backdropFilter: 'blur(6px)',
        padding: '16px'
      }}>
        <h2 style={{
          fontSize: '16px',
          margin: '8px 0',
          color: '#f60',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="https://bonkraiders.com/assets/ship.png" alt="Ship" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
          1. Ships & Missions
        </h2>
        <p>Buy a ship for <strong>~15 USDC (in SOL)</strong> to start playing. Each mission requires a <strong>500 BR burn fee</strong>. Send your ship on one of the following missions:</p>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '8px 0 16px'
        }}>
          <thead>
            <tr>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>Mission</th>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>Success Chance</th>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>BR Rewards</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: 'rgba(0, 20, 20, 0.5)' }}>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>Mining Run</td>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>90%</td>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>100k-300k BR</td>
            </tr>
            <tr>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>Black Market</td>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>70%</td>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>300k-500k BR</td>
            </tr>
            <tr style={{ background: 'rgba(0, 20, 20, 0.5)' }}>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>Artifact Hunt</td>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>50%</td>
              <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>700k-1M BR</td>
            </tr>
          </tbody>
        </table>
        <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '12px', lineHeight: '1.4' }}>
          <li style={{ margin: '4px 0' }}>Each ship has an 8-hour cooldown per mission.</li>
          <li style={{ margin: '4px 0' }}>Each mission requires 500 BR burn fee to participate.</li>
          <li style={{ margin: '4px 0' }}>If the mission fails, you receive 0 AT.</li>
        </ul>
      </div>

      {/* Mission Modes */}
      <div style={{
        background: 'rgba(0, 20, 20, 0.6)',
        border: '2px solid #0cf',
        borderRadius: '8px',
        backdropFilter: 'blur(6px)',
        padding: '16px'
      }}>
        <h2 style={{
          fontSize: '16px',
          margin: '8px 0',
          color: '#f60',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="https://bonkraiders.com/assets/object.png" alt="Modes" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
          2. Mission Modes
        </h2>
        <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '12px', lineHeight: '1.4' }}>
          <li style={{ margin: '4px 0' }}><strong>Shielded Mode:</strong> Cannot be raided, but gives reduced AT yield (e.g., 80% payout).</li>
          <li style={{ margin: '4px 0' }}><strong>Unshielded Mode:</strong> Full AT yield, but can be raided.</li>
          <li style={{ margin: '4px 0' }}><strong>Decoy Mode:</strong> No AT earned, but if raided, the attacker is punished (loses rep or energy; defender gains bonus AT).</li>
        </ul>
      </div>

      {/* Upgrades */}
      <div style={{
        background: 'rgba(0, 20, 20, 0.6)',
        border: '2px solid #0cf',
        borderRadius: '8px',
        backdropFilter: 'blur(6px)',
        padding: '16px'
      }}>
        <h2 style={{
          fontSize: '16px',
          margin: '8px 0',
          color: '#f60',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="https://bonkraiders.com/assets/building.png" alt="Upgrades" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
          3. Upgrades
        </h2>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '8px 0 16px'
        }}>
          <thead>
            <tr>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>Level</th>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>Reward Bonus</th>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>Cooldown</th>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>Upgrade Cost</th>
              <th style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px', background: 'rgba(0, 40, 40, 0.8)' }}>Cumulative AT Cost</th>
            </tr>
          </thead>
          <tbody>
            {[
              { level: 1, bonus: 'Base (1.0×)', cooldown: '8 h', cost: '—', cumulative: '0 AT' },
              { level: 2, bonus: '+10% (1.1×)', cooldown: '7.5 h', cost: '50 AT', cumulative: '50 AT' },
              { level: 3, bonus: '+20% (1.2×)', cooldown: '7 h', cost: '100 AT', cumulative: '150 AT' },
              { level: 4, bonus: '+30% (1.3×)', cooldown: '6.5 h', cost: '150 AT', cumulative: '300 AT' },
              { level: 5, bonus: '+45% (1.45×)', cooldown: '6 h', cost: '225 AT', cumulative: '525 AT' },
              { level: 6, bonus: '+60% (1.6×)', cooldown: '5.5 h', cost: '300 AT', cumulative: '825 AT' },
              { level: 7, bonus: '+80% (1.8×)', cooldown: '5 h', cost: '400 AT', cumulative: '1,225 AT' }
            ].map((row, index) => (
              <tr key={row.level} style={{ background: index % 2 === 0 ? 'rgba(0, 20, 20, 0.5)' : 'transparent' }}>
                <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{row.level}</td>
                <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{row.bonus}</td>
                <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{row.cooldown}</td>
                <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{row.cost}</td>
                <td style={{ border: '2px solid #0cf', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{row.cumulative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raiding */}
      <div style={{
        background: 'rgba(0, 20, 20, 0.6)',
        border: '2px solid #0cf',
        borderRadius: '8px',
        backdropFilter: 'blur(6px)',
        padding: '16px'
      }}>
        <h2 style={{
          fontSize: '16px',
          margin: '8px 0',
          color: '#f60',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="https://bonkraiders.com/assets/object1.png" alt="Raid" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
          4. Raiding Missions
        </h2>
        <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '12px', lineHeight: '1.4' }}>
          <li style={{ margin: '4px 0' }}>Use your energy (off-chain mechanic) to scan for active missions.</li>
          <li style={{ margin: '4px 0' }}>Choose a target (you'll see mission type and reward tier).</li>
          <li style={{ margin: '4px 0' }}>Attempt a raid:
            <ul style={{ paddingLeft: '16px' }}>
              <li style={{ margin: '4px 0' }}><strong>Unshielded:</strong> Steal the full AT reward.</li>
              <li style={{ margin: '4px 0' }}><strong>Shielded:</strong> Raid fails — no reward.</li>
              <li style={{ margin: '4px 0' }}><strong>Decoy:</strong> You get penalized; defender gains bonus AT.</li>
            </ul>
          </li>
        </ul>
      </div>

      {/* Strategy */}
      <div style={{
        background: 'rgba(0, 20, 20, 0.6)',
        border: '2px solid #0cf',
        borderRadius: '8px',
        backdropFilter: 'blur(6px)',
        padding: '16px'
      }}>
        <h2 style={{
          fontSize: '16px',
          margin: '8px 0',
          color: '#f60',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="https://bonkraiders.com/assets/ship.png" alt="Strategy" style={{ width: '20px', height: '20px', imageRendering: 'pixelated' }} />
          5. Strategy & Progression
        </h2>
        <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '12px', lineHeight: '1.4' }}>
          <li style={{ margin: '4px 0' }}>Time your unshielded missions for off-peak hours to reduce risk.</li>
          <li style={{ margin: '4px 0' }}>Upgrade key ships to farm faster and dominate raiding.</li>
          <li style={{ margin: '4px 0' }}>Bluff with decoys to trap greedy players.</li>
          <li style={{ margin: '4px 0' }}>Compete on leaderboards for:
            <ul style={{ paddingLeft: '16px' }}>
              <li style={{ margin: '4px 0' }}>Most AT earned</li>
              <li style={{ margin: '4px 0' }}>Most successful raids</li>
              <li style={{ margin: '4px 0' }}>Best decoy defenses</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HowToModal;