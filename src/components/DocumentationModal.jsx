import React, { useState } from 'react';

const DocumentationModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('readme');

  const tabs = {
    readme: {
      title: 'README',
      icon: '📖',
      content: <ReadmeContent />
    },
    whitepaper: {
      title: 'WHITE PAPER',
      icon: '📄',
      content: <WhitepaperContent />
    },
    guide: {
      title: 'PLAYER GUIDE',
      icon: '🎮',
      content: <PlayerGuideContent />
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,20,40,0.98), rgba(0,40,80,0.95))',
        border: '4px solid #0cf',
        borderRadius: '16px',
        width: '95%',
        maxWidth: '1200px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(12px)',
        fontFamily: "'Press Start 2P', monospace",
        color: '#0cf',
        boxShadow: '0 8px 32px rgba(0, 255, 255, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #0cf',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,60,120,0.3)'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            background: 'linear-gradient(45deg, #0cf, #ff0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📚 BONK RAIDERS DOCUMENTATION
          </h1>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,0,0,0.7)',
              border: '2px solid #f00',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,40,80,0.5)',
          borderBottom: '2px solid #0cf'
        }}>
          {Object.entries(tabs).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === key ? 
                  'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(0,200,255,0.2))' :
                  'transparent',
                border: 'none',
                borderRight: '1px solid #0cf',
                color: activeTab === key ? '#ff0' : '#0cf',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: "'Press Start 2P', monospace",
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== key) {
                  e.target.style.background = 'rgba(0,100,200,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== key) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.title}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {tabs[activeTab].content}
        </div>
      </div>
    </div>
  );
};

// README Content Component
const ReadmeContent = () => (
  <div style={{ lineHeight: '1.6', fontSize: '12px' }}>
    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
      <img 
        src="https://bonkraiders.com/assets/ship.png" 
        alt="Bonk Raiders Ship" 
        style={{ 
          width: '80px', 
          height: '80px', 
          imageRendering: 'pixelated',
          marginBottom: '16px',
          filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.5))'
        }} 
      />
      <h1 style={{ 
        fontSize: '24px', 
        margin: '0 0 8px',
        background: 'linear-gradient(45deg, #0cf, #ff0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        BONK RAIDERS
      </h1>
      <p style={{ color: '#888', margin: 0 }}>
        A retro pixel-style, Solana-powered space raiding game
      </p>
    </div>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🚀 OVERVIEW</h2>
      <p style={{ color: '#ccc', marginBottom: '16px' }}>
        Bonk Raiders is an innovative blockchain-based strategy game where players command spaceships, 
        complete missions, and raid other players for valuable BR tokens. Built on the Solana blockchain, 
        the game combines classic pixel art aesthetics with modern DeFi mechanics.
      </p>
      
      <div style={{ 
        background: 'rgba(0,60,80,0.4)', 
        padding: '16px', 
        borderRadius: '8px',
        border: '1px solid #0cf',
        marginBottom: '16px'
      }}>
        <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>✨ KEY FEATURES</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '8px' }}>🛸 <strong>Mission System:</strong> Mining runs, black market deals, and artifact hunts</li>
          <li style={{ marginBottom: '8px' }}>⚔️ <strong>Player vs Player:</strong> Raid other players' unshielded missions</li>
          <li style={{ marginBottom: '8px' }}>⚙️ <strong>Ship Upgrades:</strong> Enhance performance and reduce cooldowns</li>
          <li style={{ marginBottom: '8px' }}>💰 <strong>BR Tokens:</strong> Earn and trade on-chain rewards</li>
          <li style={{ marginBottom: '8px' }}>🛡️ <strong>Strategic Modes:</strong> Choose between shielded and unshielded missions</li>
        </ul>
      </div>
    </section>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🛠️ TECHNOLOGY STACK</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'rgba(0,40,60,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
          <h4 style={{ color: '#0ff', marginBottom: '8px', fontSize: '12px' }}>Frontend</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
            React • HTML5 Canvas • CSS3 • Vanilla JS
          </p>
        </div>
        <div style={{ background: 'rgba(0,40,60,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
          <h4 style={{ color: '#0ff', marginBottom: '8px', fontSize: '12px' }}>Blockchain</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
            Solana • @solana/web3.js • SPL-Token
          </p>
        </div>
        <div style={{ background: 'rgba(0,40,60,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
          <h4 style={{ color: '#0ff', marginBottom: '8px', fontSize: '12px' }}>Backend</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
            PHP API • MySQL • Node.js Microservices
          </p>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🎮 GETTING STARTED</h2>
      <div style={{ background: 'rgba(0,60,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #0f0' }}>
        <ol style={{ paddingLeft: '20px', margin: 0, color: '#ccc' }}>
          <li style={{ marginBottom: '8px' }}>Connect your Solana wallet (Phantom, Solflare, etc.)</li>
          <li style={{ marginBottom: '8px' }}>Purchase your first ship for 15 USDC equivalent</li>
          <li style={{ marginBottom: '8px' }}>Start with Mining Runs to learn the basics</li>
          <li style={{ marginBottom: '8px' }}>Upgrade your ship and explore advanced missions</li>
          <li>Begin raiding other players for maximum profits</li>
        </ol>
      </div>
    </section>

    <section>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>📞 SUPPORT & COMMUNITY</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'rgba(40,0,80,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #f0f' }}>
          <h4 style={{ color: '#f0f', marginBottom: '8px', fontSize: '12px' }}>🐦 Twitter</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>@BonkRaiders</p>
        </div>
        <div style={{ background: 'rgba(40,0,80,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #f0f' }}>
          <h4 style={{ color: '#f0f', marginBottom: '8px', fontSize: '12px' }}>💬 Discord</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>Coming Soon</p>
        </div>
        <div style={{ background: 'rgba(40,0,80,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #f0f' }}>
          <h4 style={{ color: '#f0f', marginBottom: '8px', fontSize: '12px' }}>📧 Support</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>help@bonkraiders.com</p>
        </div>
      </div>
    </section>
  </div>
);

// White Paper Content Component
const WhitepaperContent = () => (
  <div style={{ lineHeight: '1.6', fontSize: '12px' }}>
    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
      <h1 style={{ 
        fontSize: '24px', 
        margin: '0 0 8px',
        background: 'linear-gradient(45deg, #0cf, #ff0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        BONK RAIDERS WHITE PAPER
      </h1>
      <p style={{ color: '#888', margin: 0 }}>
        Technical Overview and Economic Model
      </p>
    </div>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>📋 ABSTRACT</h2>
      <p style={{ color: '#ccc', marginBottom: '16px' }}>
        Bonk Raiders represents a new paradigm in blockchain gaming, combining strategic gameplay 
        with decentralized finance (DeFi) mechanics. Built on Solana's high-performance blockchain, 
        the game enables true ownership of in-game assets while maintaining engaging gameplay through 
        a sophisticated mission and raiding system.
      </p>
    </section>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🎯 GAME MECHANICS</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>Mission System</h3>
        <div style={{ background: 'rgba(0,40,60,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #0cf' }}>
          <p style={{ color: '#ccc', marginBottom: '12px' }}>
            The mission system forms the core gameplay loop, offering three distinct mission types:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>⛏️ <strong>Mining Runs:</strong> 90% success rate, 10 BR base reward</li>
            <li style={{ marginBottom: '8px' }}>🏴‍☠️ <strong>Black Market:</strong> 70% success rate, 30 BR base reward</li>
            <li>🏺 <strong>Artifact Hunt:</strong> 50% success rate, 60 BR base reward</li>
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>Raiding Mechanics</h3>
        <div style={{ background: 'rgba(60,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #f00' }}>
          <p style={{ color: '#ccc', margin: 0 }}>
            Players can raid unshielded missions of other players, creating a dynamic PvP economy. 
            The energy system (10 max, 1 per hour refill) prevents spam while encouraging strategic timing.
          </p>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>💰 TOKENOMICS</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>BR Token Utility</h3>
        <div style={{ background: 'rgba(0,60,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #0f0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>💎 <strong>Earning:</strong> Mission rewards, raid spoils, defense bonuses</li>
            <li style={{ marginBottom: '8px' }}>⚙️ <strong>Spending:</strong> Ship upgrades, premium features</li>
            <li>💰 <strong>Trading:</strong> Direct wallet transfers, marketplace transactions</li>
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>Economic Balance</h3>
        <div style={{ background: 'rgba(60,60,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #ff0' }}>
          <p style={{ color: '#ccc', margin: 0 }}>
            The game maintains economic balance through cooldown periods, energy limitations, 
            and progressive upgrade costs. This prevents inflation while rewarding skilled and dedicated players.
          </p>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🔧 TECHNICAL ARCHITECTURE</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'rgba(0,40,80,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #0cf' }}>
          <h4 style={{ color: '#0ff', marginBottom: '12px', fontSize: '12px' }}>Frontend Layer</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li>• React-based UI with pixel art styling</li>
            <li>• HTML5 Canvas for game rendering</li>
            <li>• Wallet integration via @solana/web3.js</li>
            <li>• Real-time battle animations</li>
          </ul>
        </div>
        
        <div style={{ background: 'rgba(40,0,80,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #f0f' }}>
          <h4 style={{ color: '#f0f', marginBottom: '12px', fontSize: '12px' }}>Backend Services</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li>• PHP API with MySQL database</li>
            <li>• JWT-based authentication</li>
            <li>• Anti-cheat and rate limiting</li>
            <li>• Node.js Solana microservices</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🚀 ROADMAP</h2>
      <div style={{ background: 'rgba(0,60,80,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid #0cf' }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#0f0', fontSize: '16px' }}>✅</span>
            <span style={{ color: '#ccc' }}>Phase 1: Core gameplay and mission system</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#0f0', fontSize: '16px' }}>✅</span>
            <span style={{ color: '#ccc' }}>Phase 2: Raiding and PvP mechanics</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#ff0', fontSize: '16px' }}>🔄</span>
            <span style={{ color: '#ccc' }}>Phase 3: Advanced ship customization</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#888', fontSize: '16px' }}>⏳</span>
            <span style={{ color: '#ccc' }}>Phase 4: Guild system and tournaments</span>
          </div>
        </div>
      </div>
    </section>
  </div>
);

// Player Guide Content Component
const PlayerGuideContent = () => (
  <div style={{ lineHeight: '1.6', fontSize: '12px' }}>
    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
      <img 
        src="https://bonkraiders.com/assets/mech.png" 
        alt="Game Character" 
        style={{ 
          width: '64px', 
          height: '64px', 
          imageRendering: 'pixelated',
          marginBottom: '16px',
          filter: 'drop-shadow(0 0 10px rgba(255, 255, 0, 0.5))'
        }} 
      />
      <h1 style={{ 
        fontSize: '24px', 
        margin: '0 0 8px',
        background: 'linear-gradient(45deg, #ff0, #0f0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        PLAYER'S GUIDE
      </h1>
      <p style={{ color: '#888', margin: 0 }}>
        Master the art of space raiding and resource management
      </p>
    </div>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🚀 GETTING STARTED</h2>
      
      <div style={{ background: 'rgba(0,60,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #0f0', marginBottom: '20px' }}>
        <h3 style={{ color: '#0f0', marginBottom: '12px', fontSize: '14px' }}>First Steps</h3>
        <ol style={{ paddingLeft: '20px', margin: 0, color: '#ccc' }}>
          <li style={{ marginBottom: '8px' }}>Connect your Solana wallet (Phantom recommended)</li>
          <li style={{ marginBottom: '8px' }}>Purchase your starter ship for 15 USDC</li>
          <li style={{ marginBottom: '8px' }}>Complete your first Mining Run mission</li>
          <li style={{ marginBottom: '8px' }}>Learn the difference between Shielded and Unshielded modes</li>
          <li>Start accumulating BR tokens for upgrades</li>
        </ol>
      </div>

      <div style={{ background: 'rgba(0,40,80,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #0cf' }}>
        <h3 style={{ color: '#0cf', marginBottom: '12px', fontSize: '14px' }}>💡 Beginner Tips</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '8px' }}>🛡️ Use Shielded mode while learning the game</li>
          <li style={{ marginBottom: '8px' }}>⏰ Plan missions around your schedule (8-hour cooldowns)</li>
          <li style={{ marginBottom: '8px' }}>💰 Save BR tokens for your first upgrade (Level 2)</li>
          <li>📊 Track your success rates and adjust strategy accordingly</li>
        </ul>
      </div>
    </section>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>⚔️ ADVANCED STRATEGIES</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'rgba(60,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #f00' }}>
          <h3 style={{ color: '#f00', marginBottom: '12px', fontSize: '14px' }}>🎯 Raiding Mastery</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
            <li style={{ marginBottom: '6px' }}>• Target high-value Artifact Hunts</li>
            <li style={{ marginBottom: '6px' }}>• Raid during peak player hours</li>
            <li style={{ marginBottom: '6px' }}>• Manage energy efficiently</li>
            <li>• Avoid shielded missions</li>
          </ul>
        </div>
        
        <div style={{ background: 'rgba(40,0,80,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid #f0f' }}>
          <h3 style={{ color: '#f0f', marginBottom: '12px', fontSize: '14px' }}>⚙️ Upgrade Strategy</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
            <li style={{ marginBottom: '6px' }}>• Prioritize Level 2-4 upgrades first</li>
            <li style={{ marginBottom: '6px' }}>• Calculate ROI before upgrading</li>
            <li style={{ marginBottom: '6px' }}>• Focus on cooldown reduction</li>
            <li>• Plan long-term progression</li>
          </ul>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>📊 MISSION REFERENCE</h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          background: 'rgba(0,40,80,0.3)',
          border: '2px solid #0cf',
          borderRadius: '8px'
        }}>
          <thead>
            <tr style={{ background: 'rgba(0,60,120,0.5)' }}>
              <th style={{ padding: '12px', border: '1px solid #0cf', color: '#0ff', fontSize: '11px' }}>Mission</th>
              <th style={{ padding: '12px', border: '1px solid #0cf', color: '#0ff', fontSize: '11px' }}>Success Rate</th>
              <th style={{ padding: '12px', border: '1px solid #0cf', color: '#0ff', fontSize: '11px' }}>Base Reward</th>
              <th style={{ padding: '12px', border: '1px solid #0cf', color: '#0ff', fontSize: '11px' }}>Risk Level</th>
              <th style={{ padding: '12px', border: '1px solid #0cf', color: '#0ff', fontSize: '11px' }}>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ccc', fontSize: '10px' }}>⛏️ Mining Run</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#0f0', fontSize: '10px' }}>90%</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ff0', fontSize: '10px' }}>10 BR</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#0f0', fontSize: '10px' }}>Low</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ccc', fontSize: '10px' }}>Beginners, steady income</td>
            </tr>
            <tr style={{ background: 'rgba(0,20,40,0.3)' }}>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ccc', fontSize: '10px' }}>🏴‍☠️ Black Market</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ff0', fontSize: '10px' }}>70%</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ff0', fontSize: '10px' }}>30 BR</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ff0', fontSize: '10px' }}>Medium</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ccc', fontSize: '10px' }}>Balanced risk/reward</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ccc', fontSize: '10px' }}>🏺 Artifact Hunt</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#f00', fontSize: '10px' }}>50%</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ff0', fontSize: '10px' }}>60 BR</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#f00', fontSize: '10px' }}>High</td>
              <td style={{ padding: '10px', border: '1px solid #0cf', color: '#ccc', fontSize: '10px' }}>Risk-takers, big rewards</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 style={{ color: '#ff0', marginBottom: '16px', fontSize: '16px' }}>🏆 PRO TIPS</h2>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{ background: 'rgba(0,60,80,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid #0cf' }}>
          <h4 style={{ color: '#0cf', marginBottom: '8px', fontSize: '12px' }}>⏰ Timing Strategy</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
            Launch unshielded missions during off-peak hours (late night/early morning) to reduce raid risk.
          </p>
        </div>
        
        <div style={{ background: 'rgba(60,60,0,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid #ff0' }}>
          <h4 style={{ color: '#ff0', marginBottom: '8px', fontSize: '12px' }}>💰 Economic Efficiency</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
            Calculate your hourly BR rate: (Mission Reward × Success Rate) ÷ Cooldown Hours
          </p>
        </div>
        
        <div style={{ background: 'rgba(60,0,60,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid #f0f' }}>
          <h4 style={{ color: '#f0f', marginBottom: '8px', fontSize: '12px' }}>🎯 Raid Targeting</h4>
          <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
            Focus on players with high mission counts but low raid wins - they're likely less defensive.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default DocumentationModal;