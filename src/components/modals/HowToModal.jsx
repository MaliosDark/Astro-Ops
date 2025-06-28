import React, { useState } from 'react';

const HowToModal = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('basics');

  const sections = {
    basics: {
      title: '🚀 Getting Started',
      icon: '🎮',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Welcome to Bonk Raiders!</h3>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>🛸 Your First Steps</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>✓ Connect your Solana wallet (Phantom, Solflare, etc.)</li>
              <li style={{ marginBottom: '8px' }}>✓ Purchase your first ship for 15 USDC equivalent</li>
              <li style={{ marginBottom: '8px' }}>✓ Start with Mining Runs to learn the basics</li>
              <li style={{ marginBottom: '8px' }}>✓ Accumulate BR tokens through successful missions</li>
            </ul>
          </div>
          
          <div style={{ background: 'rgba(0,60,80,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
            <h4 style={{ color: '#0f0', marginBottom: '8px' }}>💡 Pro Tip</h4>
            <p style={{ fontSize: '11px', margin: '0', color: '#ccc' }}>
              Start with Shielded missions to learn the game mechanics safely, then switch to Unshielded for higher rewards once you're comfortable.
            </p>
          </div>
        </div>
      )
    },
    missions: {
      title: '🎯 Mission System',
      icon: '🚀',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Mission Types & Strategies</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Mission Categories</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { name: 'Mining Run', icon: '⛏️', success: '90%', reward: '10 BR', desc: 'Low risk, steady income' },
                { name: 'Black Market', icon: '🏴‍☠️', success: '70%', reward: '30 BR', desc: 'Medium risk, good rewards' },
                { name: 'Artifact Hunt', icon: '🏺', success: '50%', reward: '60 BR', desc: 'High risk, high reward' }
              ].map((mission, i) => (
                <div key={i} style={{ 
                  background: 'rgba(0,40,60,0.3)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #0cf'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{mission.icon}</span>
                    <strong style={{ color: '#0ff' }}>{mission.name}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '4px' }}>{mission.desc}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '10px' }}>
                    <span style={{ color: '#0f0' }}>Success: {mission.success}</span>
                    <span style={{ color: '#ff0' }}>Reward: {mission.reward}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Mission Modes</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: 'rgba(0,60,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span>🛡️</span>
                  <strong style={{ color: '#0f0' }}>Shielded Mode</strong>
                </div>
                <p style={{ fontSize: '11px', margin: '0', color: '#ccc' }}>
                  80% rewards, cannot be raided. Perfect for safe farming.
                </p>
              </div>
              <div style={{ background: 'rgba(60,30,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #f80' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span>🔓</span>
                  <strong style={{ color: '#f80' }}>Unshielded Mode</strong>
                </div>
                <p style={{ fontSize: '11px', margin: '0', color: '#ccc' }}>
                  100% rewards, can be raided. Higher risk, higher reward.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    raiding: {
      title: '⚔️ Raiding System',
      icon: '🏴‍☠️',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Raid Other Players</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>How Raiding Works</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>🔍 Use energy to scan for vulnerable targets</li>
              <li style={{ marginBottom: '8px' }}>🎯 Target unshielded missions for full rewards</li>
              <li style={{ marginBottom: '8px' }}>⚡ Energy refills at 1 point per hour (max 10)</li>
              <li style={{ marginBottom: '8px' }}>💰 Steal the entire mission reward if successful</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Raid Strategies</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: 'rgba(0,60,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #0f0' }}>
                <strong style={{ color: '#0f0' }}>✓ Target High-Value Missions</strong>
                <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#ccc' }}>
                  Look for Artifact Hunts and Black Market missions for maximum profit.
                </p>
              </div>
              <div style={{ background: 'rgba(60,60,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #ff0' }}>
                <strong style={{ color: '#ff0' }}>⚠️ Manage Your Energy</strong>
                <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#ccc' }}>
                  Don't waste scans on low-value targets. Save energy for big scores.
                </p>
              </div>
              <div style={{ background: 'rgba(60,0,60,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #f0f' }}>
                <strong style={{ color: '#f0f' }}>🎯 Timing is Everything</strong>
                <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#ccc' }}>
                  Raid during peak hours when more players are active and vulnerable.
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(60,0,0,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid #f00' }}>
            <h4 style={{ color: '#f00', marginBottom: '8px' }}>⚠️ Raid Risks</h4>
            <p style={{ fontSize: '11px', margin: '0', color: '#ccc' }}>
              Attacking shielded missions will fail and may result in reputation penalties. Always verify target status before attacking.
            </p>
          </div>
        </div>
      )
    },
    upgrades: {
      title: '⚙️ Ship Upgrades',
      icon: '🔧',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>Enhance Your Ship</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Upgrade Benefits</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>📈 Increased mission rewards (up to 80% bonus)</li>
              <li style={{ marginBottom: '8px' }}>⏱️ Reduced mission cooldowns (down to 5 hours)</li>
              <li style={{ marginBottom: '8px' }}>🎯 Better success rates on difficult missions</li>
              <li style={{ marginBottom: '8px' }}>💪 Enhanced combat effectiveness in raids</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Upgrade Path</h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                { level: 'Level 2', cost: '50 BR', bonus: '+10%', time: '7.5h' },
                { level: 'Level 3', cost: '100 BR', bonus: '+20%', time: '7h' },
                { level: 'Level 5', cost: '225 BR', bonus: '+45%', time: '6h' },
                { level: 'Level 7', cost: '400 BR', bonus: '+80%', time: '5h' }
              ].map((upgrade, i) => (
                <div key={i} style={{ 
                  background: 'rgba(40,0,80,0.3)', 
                  padding: '8px 12px', 
                  borderRadius: '6px',
                  border: '1px solid #f0f',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#f0f', fontSize: '11px' }}>{upgrade.level}</span>
                  <span style={{ color: '#ff0', fontSize: '10px' }}>{upgrade.cost}</span>
                  <span style={{ color: '#0f0', fontSize: '10px' }}>{upgrade.bonus}</span>
                  <span style={{ color: '#0cf', fontSize: '10px' }}>{upgrade.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(0,60,80,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
            <h4 style={{ color: '#0cf', marginBottom: '8px' }}>💡 Upgrade Strategy</h4>
            <p style={{ fontSize: '11px', margin: '0', color: '#ccc' }}>
              Focus on early upgrades (Levels 2-4) for the best return on investment. Higher levels are for dedicated players seeking maximum efficiency.
            </p>
          </div>
        </div>
      )
    },
    economy: {
      title: '💰 Game Economy',
      icon: '📊',
      content: (
        <div>
          <h3 style={{ color: '#0ff', marginBottom: '16px' }}>BR Token Economy</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Earning BR Tokens</h4>
            <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '12px', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}>🎯 Complete successful missions</li>
              <li style={{ marginBottom: '8px' }}>⚔️ Raid other players' unshielded missions</li>
              <li style={{ marginBottom: '8px' }}>🛡️ Defend against raids successfully</li>
              <li style={{ marginBottom: '8px' }}>🏆 Participate in special events</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Spending BR Tokens</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: 'rgba(40,0,80,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #f0f' }}>
                <strong style={{ color: '#f0f' }}>⚙️ Ship Upgrades</strong>
                <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#ccc' }}>
                  Invest in permanent improvements to your ship's capabilities.
                </p>
              </div>
              <div style={{ background: 'rgba(0,60,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #0f0' }}>
                <strong style={{ color: '#0f0' }}>💰 Cash Out</strong>
                <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#ccc' }}>
                  Claim your BR tokens directly to your Solana wallet.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0', marginBottom: '12px' }}>Economic Tips</h4>
            <div style={{ background: 'rgba(0,60,80,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
              <ul style={{ listStyle: 'none', paddingLeft: '0', fontSize: '11px', lineHeight: '1.5', margin: '0' }}>
                <li style={{ marginBottom: '6px' }}>📊 Track your ROI on upgrades</li>
                <li style={{ marginBottom: '6px' }}>⏰ Time your unshielded missions during off-peak hours</li>
                <li style={{ marginBottom: '6px' }}>🎯 Focus on consistent earnings over risky plays</li>
                <li>💎 Consider holding BR tokens for future features</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,80,0.9))',
      border: '4px solid #0cf',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '1000px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(12px)',
      fontFamily: "'Press Start 2P', monospace",
      color: '#0cf',
      boxShadow: '0 8px 32px rgba(0, 255, 255, 0.3)',
      maxHeight: '80vh',
      overflowY: 'auto'
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
          📚 PILOT'S HANDBOOK
        </h1>
        <p style={{
          margin: '0',
          fontSize: '12px',
          color: '#888',
          lineHeight: '1.4'
        }}>
          Master the art of space raiding and resource management
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '24px',
        justifyContent: 'center'
      }}>
        {Object.entries(sections).map(([key, section]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            style={{
              background: activeSection === key ?
                'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(0,200,255,0.2))' :
                'rgba(0,40,80,0.4)',
              border: activeSection === key ? '2px solid #0ff' : '2px solid #0cf',
              borderRadius: '8px',
              padding: '8px 12px',
              color: activeSection === key ? '#0ff' : '#0cf',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace",
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== key) {
                e.target.style.background = 'rgba(0,60,120,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== key) {
                e.target.style.background = 'rgba(0,40,80,0.4)';
              }
            }}
          >
            <span>{section.icon}</span>
            <span>{section.title}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{
        background: 'rgba(0,40,80,0.6)',
        border: '2px solid #0cf',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '400px'
      }}>
        {sections[activeSection].content}
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
          🚀 Good luck, Raider! May your missions be profitable and your raids successful.
        </div>
        <div>
          For support and updates, follow us on social media or join our community.
        </div>
      </div>
    </div>
  );
};

export default HowToModal;