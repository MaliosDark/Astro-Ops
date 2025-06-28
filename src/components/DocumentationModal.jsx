import React, { useState } from 'react';

const DocumentationModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('gameplay');

  const tabs = {
    gameplay: {
      title: '🎮 Gameplay',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Bonk Raiders Gameplay Guide</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🚀 Getting Started</h4>
            <ol style={{ paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>Connect your Solana wallet (Phantom, Solflare, etc.)</li>
              <li style={{ marginBottom: '8px' }}>Purchase your first ship for 15 USDC equivalent</li>
              <li style={{ marginBottom: '8px' }}>Launch missions to earn BR tokens</li>
              <li style={{ marginBottom: '8px' }}>Upgrade your ship to improve efficiency</li>
              <li style={{ marginBottom: '8px' }}>Raid other players for additional rewards</li>
            </ol>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🎯 Mission Types</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#0f0' }}>⛏️ Mining Run</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Low risk (90% success), low reward (10 BR). Perfect for beginners.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#ff0' }}>🏴‍☠️ Black Market</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Medium risk (70% success), medium reward (30 BR). Good balance of risk/reward.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f80' }}>🏺 Artifact Hunt</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  High risk (50% success), high reward (60 BR). For experienced players.
                </p>
              </li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🛡️ Mission Modes</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#0f0' }}>🛡️ Shielded</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  80% of normal rewards, but cannot be raided by other players.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f80' }}>🔓 Unshielded</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Full rewards, but vulnerable to raids from other players.
                </p>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    raiding: {
      title: '⚔️ Raiding',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Raiding System</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🏴‍☠️ How Raiding Works</h4>
            <ol style={{ paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>Click the <strong>RAID</strong> button in the bottom menu</li>
              <li style={{ marginBottom: '8px' }}>Spend 1 energy to scan for vulnerable targets</li>
              <li style={{ marginBottom: '8px' }}>Select a target from the list of unshielded missions</li>
              <li style={{ marginBottom: '8px' }}>Launch your raid and watch the battle unfold</li>
              <li style={{ marginBottom: '8px' }}>If successful, you'll steal the target's mission reward</li>
            </ol>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>⚡ Energy System</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>You have a maximum of 10 energy points</li>
              <li style={{ marginBottom: '8px' }}>Energy regenerates at a rate of 1 point per hour</li>
              <li style={{ marginBottom: '8px' }}>Each scan costs 1 energy point</li>
              <li style={{ marginBottom: '8px' }}>Plan your raids carefully to maximize efficiency</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🎯 Target Selection</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#0f0' }}>Low Risk</strong>: Newer players with fewer defenses
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#ff0' }}>Medium Risk</strong>: Average players with decent defenses
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#f00' }}>High Risk</strong>: Veteran players with strong defenses
              </li>
            </ul>
          </div>
          
          <div style={{ background: 'rgba(255,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid #f00' }}>
            <h4 style={{ color: '#f00', marginBottom: '8px' }}>⚠️ Raid Risks</h4>
            <p style={{ fontSize: '11px', margin: '0', color: '#ccc' }}>
              Attempting to raid shielded missions will always fail and may result in reputation penalties. Always check the mission mode before raiding!
            </p>
          </div>
        </div>
      )
    },
    economy: {
      title: '💰 Economy',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Game Economy</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>💰 BR Token</h4>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#ccc' }}>
              BR (Bonk Raiders) is the in-game currency used for upgrades and transactions. 
              It's earned through successful missions and raids, and can be claimed to your wallet.
            </p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>📈 Earning BR</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#0f0' }}>Missions</strong>: Complete missions to earn BR based on risk level
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#f80' }}>Raids</strong>: Steal BR from other players' unshielded missions
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#0cf' }}>Defense</strong>: Successfully defending against raids may yield bonus BR
              </li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🛒 Spending BR</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f0f' }}>Ship Upgrades</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Improve your ship's performance, increasing mission rewards and reducing cooldowns.
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #666', padding: '4px', textAlign: 'left', color: '#0cf' }}>Level</th>
                      <th style={{ border: '1px solid #666', padding: '4px', textAlign: 'left', color: '#0cf' }}>Cost</th>
                      <th style={{ border: '1px solid #666', padding: '4px', textAlign: 'left', color: '#0cf' }}>Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>2</td>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>50 BR</td>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>+10%</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>3</td>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>100 BR</td>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>+20%</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>7</td>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>400 BR</td>
                      <td style={{ border: '1px solid #666', padding: '4px' }}>+80%</td>
                    </tr>
                  </tbody>
                </table>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#0f0' }}>Claiming</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Convert your in-game BR to on-chain tokens in your wallet.
                </p>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    strategy: {
      title: '🧠 Strategy',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Advanced Strategies</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🚀 Mission Strategy</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#0f0' }}>Beginners</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Start with Shielded Mining Runs to build up initial BR safely. Once you have around 50 BR, upgrade to Level 2.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#ff0' }}>Intermediate</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Mix Shielded Black Market runs with Unshielded Mining Runs. Focus on reaching Level 3-4 upgrades.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f80' }}>Advanced</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Run Unshielded Artifact Hunts during off-peak hours to minimize raid risk. Aim for Level 5-7 upgrades.
                </p>
              </li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>⚔️ Raiding Strategy</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#0f0' }}>Target Selection</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Prioritize high-value missions (Artifact Hunts) from players with lower experience levels.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#ff0' }}>Energy Management</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Save energy for peak hours when more players are running missions. Scan strategically.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#f80' }}>Risk Assessment</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Check player stats before raiding. Veterans have stronger defenses and lower success rates.
                </p>
              </li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>💰 Economy Strategy</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#0f0' }}>Upgrade Path</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Prioritize early upgrades (Levels 2-4) for best ROI. Each upgrade pays for itself after 10-15 missions.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#ff0' }}>Claiming Strategy</strong>
                <p style={{ margin: '4px 0 0', color: '#ccc' }}>
                  Batch your claims to minimize transaction fees. Aim for at least 100 BR per claim.
                </p>
              </li>
            </ul>
          </div>
          
          <div style={{ background: 'rgba(0,255,255,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
            <h4 style={{ color: '#0cf', marginBottom: '8px' }}>💡 Pro Tips</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '11px', lineHeight: '1.5', margin: '0' }}>
              <li style={{ marginBottom: '6px' }}>Time your unshielded missions during off-peak hours (3-6 AM UTC)</li>
              <li style={{ marginBottom: '6px' }}>Watch for patterns in other players' mission schedules</li>
              <li style={{ marginBottom: '6px' }}>Balance mission types based on your risk tolerance</li>
              <li>Upgrade to Level 3 as quickly as possible for the best early-game advantage</li>
            </ul>
          </div>
        </div>
      )
    },
    faq: {
      title: '❓ FAQ',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Frequently Asked Questions</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '8px' }}>🚀 General Questions</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: What is Bonk Raiders?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: Bonk Raiders is a space-themed raiding game on Solana where you send ships on missions, upgrade your fleet, and raid other players for rewards.
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: Do I need a Solana wallet to play?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: Yes, you need a Solana wallet like Phantom, Solflare, or Glow to connect and play the game.
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: How much does it cost to start playing?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: You need to purchase a ship for approximately 15 USDC worth of SOL. This is a one-time purchase.
              </p>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '8px' }}>🎮 Gameplay Questions</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: What happens if my mission fails?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: If a mission fails, you receive 0 BR rewards but still have to wait for the cooldown period before launching another mission.
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: Can I be raided while offline?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: Yes, if you run unshielded missions, other players can raid them even when you're offline. Use shielded mode for protection.
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: How long is the mission cooldown?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: The base cooldown is 8 hours, but it decreases as you upgrade your ship, down to 5 hours at Level 7.
              </p>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '8px' }}>💰 Economy Questions</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: What is BR used for?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: BR tokens are used for ship upgrades and can be claimed to your wallet as on-chain tokens.
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0cf', marginBottom: '4px' }}>
                <strong>Q: How do I claim my BR rewards?</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: '0' }}>
                A: Click the CLAIM button in the bottom menu to see your pending rewards and claim them to your wallet.
              </p>
            </div>
          </div>
          
          <div style={{ background: 'rgba(0,255,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid #0f0' }}>
            <h4 style={{ color: '#0f0', marginBottom: '8px' }}>🔧 Technical Support</h4>
            <p style={{ fontSize: '11px', margin: '0 0 8px', color: '#ccc' }}>
              If you encounter any issues or have questions not covered here, please contact us:
            </p>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '11px', lineHeight: '1.5', margin: '0' }}>
              <li style={{ marginBottom: '4px' }}>Discord: <span style={{ color: '#0cf' }}>discord.gg/bonkraiders</span></li>
              <li style={{ marginBottom: '4px' }}>Twitter: <span style={{ color: '#0cf' }}>@BonkRaiders</span></li>
              <li>Email: <span style={{ color: '#0cf' }}>support@bonkraiders.com</span></li>
            </ul>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="documentation-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,80,0.9))',
        border: '4px solid #0cf',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0, 255, 255, 0.3)',
        position: 'relative',
        fontFamily: "'Press Start 2P', monospace",
        color: '#0cf'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.5)',
            border: '2px solid #0cf',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0cf',
            fontSize: '16px',
            cursor: 'pointer',
            zIndex: 1
          }}
        >
          ×
        </button>

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
            📚 BONK RAIDERS DOCUMENTATION
          </h1>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#888',
            lineHeight: '1.4'
          }}>
            Complete guide to gameplay, strategy, and mechanics
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '24px',
          justifyContent: 'center'
        }}>
          {Object.entries(tabs).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: activeTab === key ?
                  'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(0,200,255,0.2))' :
                  'rgba(0,40,80,0.4)',
                border: activeTab === key ? '2px solid #0ff' : '2px solid #0cf',
                borderRadius: '8px',
                padding: '8px 12px',
                color: activeTab === key ? '#0ff' : '#0cf',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: "'Press Start 2P', monospace",
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== key) {
                  e.target.style.background = 'rgba(0,60,120,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== key) {
                  e.target.style.background = 'rgba(0,40,80,0.4)';
                }
              }}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          background: 'rgba(0,40,80,0.6)',
          border: '2px solid #0cf',
          borderRadius: '12px',
          padding: '20px',
          maxHeight: '50vh',
          overflowY: 'auto'
        }}>
          {tabs[activeTab].content}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '10px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          <div style={{ marginBottom: '8px' }}>
            🚀 Bonk Raiders v1.0.0 • © 2025 Bonk Raiders Inc.
          </div>
          <div>
            For support and updates, follow us on Twitter @BonkRaiders
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;