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
      background: 'rgba(0, 0, 0, 0.95)',
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

// README Content Component - Project Overview & Quick Start
const ReadmeContent = () => (
  <div style={{ lineHeight: '1.6', fontSize: '12px' }}>
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        <img 
          src="https://bonkraiders.com/assets/ship.png" 
          alt="Player Ship" 
          style={{ 
            width: '64px', 
            height: '64px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.8))'
          }} 
        />
        <img 
          src="https://bonkraiders.com/assets/mech.png" 
          alt="Combat Mech" 
          style={{ 
            width: '64px', 
            height: '64px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.8))'
          }} 
        />
        <img 
          src="https://bonkraiders.com/assets/building.png" 
          alt="Space Station" 
          style={{ 
            width: '64px', 
            height: '64px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 10px rgba(255, 255, 0, 0.8))'
          }} 
        />
      </div>
      <h1 style={{ 
        fontSize: '32px', 
        margin: '0 0 12px',
        background: 'linear-gradient(45deg, #0cf, #ff0, #f0f)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
      }}>
        BONK RAIDERS
      </h1>
      <p style={{ color: '#888', margin: '0 0 16px', fontSize: '14px' }}>
        The Ultimate Retro Space Raiding Experience on Solana
      </p>
      <div style={{ 
        background: 'rgba(0,60,120,0.4)', 
        padding: '12px 20px', 
        borderRadius: '20px',
        border: '2px solid #0cf',
        display: 'inline-block'
      }}>
        <span style={{ color: '#ff0', fontSize: '14px' }}>🚀 EXPLORE • ⚔️ RAID • 💰 EARN</span>
      </div>
    </div>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px', textAlign: 'center' }}>
        🌟 WHAT IS BONK RAIDERS?
      </h2>
      <div style={{ 
        background: 'rgba(0,40,80,0.4)', 
        padding: '20px', 
        borderRadius: '12px',
        border: '2px solid #0cf',
        marginBottom: '20px'
      }}>
        <p style={{ color: '#ccc', marginBottom: '16px', fontSize: '13px', lineHeight: '1.7' }}>
          Bonk Raiders is a revolutionary blockchain-based strategy game that combines the nostalgia of 
          classic pixel art with cutting-edge Solana technology. Command your own spaceship, embark on 
          dangerous missions across the galaxy, and engage in thrilling player-vs-player raids to steal 
          valuable resources.
        </p>
        <p style={{ color: '#ccc', margin: '0', fontSize: '13px', lineHeight: '1.7' }}>
          Every action you take has real consequences - your successes earn you BR tokens that can be 
          traded, spent on upgrades, or withdrawn directly to your wallet. This isn't just a game; 
          it's a living economy where skill and strategy translate to real rewards.
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '16px' 
      }}>
        <div style={{ 
          background: 'rgba(0,60,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img 
              src="https://bonkraiders.com/assets/object.png" 
              alt="Mission Icon" 
              style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} 
            />
            <h3 style={{ color: '#0f0', margin: 0, fontSize: '14px' }}>EPIC MISSIONS</h3>
          </div>
          <p style={{ color: '#ccc', fontSize: '11px', margin: 0, lineHeight: '1.5' }}>
            Embark on Mining Runs, Black Market deals, and Artifact Hunts. Each mission type offers 
            unique risks and rewards, from safe steady income to high-stakes treasure hunting.
          </p>
        </div>

        <div style={{ 
          background: 'rgba(60,0,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f00'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img 
              src="https://bonkraiders.com/assets/soldier.png" 
              alt="Combat Icon" 
              style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} 
            />
            <h3 style={{ color: '#f00', margin: 0, fontSize: '14px' }}>PVP RAIDING</h3>
          </div>
          <p style={{ color: '#ccc', fontSize: '11px', margin: 0, lineHeight: '1.5' }}>
            Hunt down other players' vulnerable missions and steal their rewards! Use energy to scan 
            for targets, then launch tactical raids to claim their hard-earned BR tokens.
          </p>
        </div>

        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f0f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img 
              src="https://bonkraiders.com/assets/dog.png" 
              alt="Upgrade Icon" 
              style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} 
            />
            <h3 style={{ color: '#f0f', margin: 0, fontSize: '14px' }}>SHIP EVOLUTION</h3>
          </div>
          <p style={{ color: '#ccc', fontSize: '11px', margin: 0, lineHeight: '1.5' }}>
            Transform your basic ship into a legendary vessel. Seven upgrade levels await, each 
            boosting your rewards and reducing mission cooldowns for maximum efficiency.
          </p>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px', textAlign: 'center' }}>
        ⚡ CORE FEATURES
      </h2>
      <div style={{ 
        background: 'rgba(0,60,80,0.4)', 
        padding: '20px', 
        borderRadius: '12px',
        border: '2px solid #0cf'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>🎮 GAMEPLAY</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• Three distinct mission types with varying risk/reward</li>
              <li style={{ marginBottom: '6px' }}>• Strategic mode selection (Shielded vs Unshielded)</li>
              <li style={{ marginBottom: '6px' }}>• Real-time battle animations and combat</li>
              <li style={{ marginBottom: '6px' }}>• Energy-based raiding system</li>
              <li>• Progressive ship upgrade mechanics</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>🔗 BLOCKCHAIN</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• Built on Solana for fast, cheap transactions</li>
              <li style={{ marginBottom: '6px' }}>• True ownership of in-game assets</li>
              <li style={{ marginBottom: '6px' }}>• BR tokens tradeable on DEX platforms</li>
              <li style={{ marginBottom: '6px' }}>• Wallet integration with major providers</li>
              <li>• Transparent, verifiable game mechanics</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>🎨 EXPERIENCE</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• Retro pixel art aesthetic</li>
              <li style={{ marginBottom: '6px' }}>• Immersive sound design and music</li>
              <li style={{ marginBottom: '6px' }}>• Smooth animations and transitions</li>
              <li style={{ marginBottom: '6px' }}>• Mobile-responsive design</li>
              <li>• Intuitive user interface</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px', textAlign: 'center' }}>
        🚀 QUICK START GUIDE
      </h2>
      <div style={{ 
        background: 'rgba(0,60,0,0.3)', 
        padding: '20px', 
        borderRadius: '12px',
        border: '2px solid #0f0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>1️⃣</div>
            <h3 style={{ color: '#0f0', marginBottom: '8px', fontSize: '12px' }}>CONNECT WALLET</h3>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0, lineHeight: '1.4' }}>
              Link your Phantom, Solflare, or other Solana wallet to start playing
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>2️⃣</div>
            <h3 style={{ color: '#0f0', marginBottom: '8px', fontSize: '12px' }}>BUY YOUR SHIP</h3>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0, lineHeight: '1.4' }}>
              One-time purchase of 15 USDC gets you a starter ship and full game access
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>3️⃣</div>
            <h3 style={{ color: '#0f0', marginBottom: '8px', fontSize: '12px' }}>START MISSIONS</h3>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0, lineHeight: '1.4' }}>
              Begin with safe Mining Runs to learn the game and earn your first BR tokens
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>4️⃣</div>
            <h3 style={{ color: '#0f0', marginBottom: '8px', fontSize: '12px' }}>UPGRADE & RAID</h3>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0, lineHeight: '1.4' }}>
              Enhance your ship and start raiding other players for maximum profits
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px', textAlign: 'center' }}>
        🌐 COMMUNITY & SUPPORT
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px', 
          border: '2px solid #f0f',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#f0f', marginBottom: '12px', fontSize: '14px' }}>🐦 FOLLOW US</h3>
          <p style={{ color: '#ccc', fontSize: '11px', margin: '0 0 8px' }}>@BonkRaiders</p>
          <p style={{ color: '#888', fontSize: '9px', margin: 0 }}>Latest updates and announcements</p>
        </div>
        
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px', 
          border: '2px solid #f0f',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#f0f', marginBottom: '12px', fontSize: '14px' }}>💬 DISCORD</h3>
          <p style={{ color: '#ccc', fontSize: '11px', margin: '0 0 8px' }}>Coming Soon</p>
          <p style={{ color: '#888', fontSize: '9px', margin: 0 }}>Join the raider community</p>
        </div>
        
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px', 
          border: '2px solid #f0f',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#f0f', marginBottom: '12px', fontSize: '14px' }}>📧 SUPPORT</h3>
          <p style={{ color: '#ccc', fontSize: '11px', margin: '0 0 8px' }}>help@bonkraiders.com</p>
          <p style={{ color: '#888', fontSize: '9px', margin: 0 }}>Technical assistance</p>
        </div>
      </div>
    </section>
  </div>
);

// White Paper Content Component - Technical Deep Dive & Economics
const WhitepaperContent = () => (
  <div style={{ lineHeight: '1.6', fontSize: '12px' }}>
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
        <img 
          src="https://bonkraiders.com/assets/object1.png" 
          alt="Technology" 
          style={{ 
            width: '48px', 
            height: '48px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))'
          }} 
        />
        <img 
          src="https://bonkraiders.com/assets/ship-fly.png" 
          alt="Innovation" 
          style={{ 
            width: '48px', 
            height: '48px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.6))'
          }} 
        />
      </div>
      <h1 style={{ 
        fontSize: '28px', 
        margin: '0 0 12px',
        background: 'linear-gradient(45deg, #0cf, #ff0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        BONK RAIDERS WHITE PAPER
      </h1>
      <p style={{ color: '#888', margin: '0 0 8px', fontSize: '14px' }}>
        Technical Architecture & Economic Framework
      </p>
      <p style={{ color: '#666', margin: 0, fontSize: '11px' }}>
        Version 1.0 • December 2024
      </p>
    </div>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>📋 EXECUTIVE SUMMARY</h2>
      <div style={{ 
        background: 'rgba(0,40,80,0.4)', 
        padding: '20px', 
        borderRadius: '12px',
        border: '2px solid #0cf'
      }}>
        <p style={{ color: '#ccc', marginBottom: '16px', fontSize: '13px', lineHeight: '1.7' }}>
          Bonk Raiders represents a paradigm shift in blockchain gaming, merging sophisticated game theory 
          with decentralized finance to create a sustainable play-to-earn ecosystem. Built on Solana's 
          high-performance infrastructure, the game introduces novel mechanics that balance competitive 
          gameplay with economic incentives.
        </p>
        <p style={{ color: '#ccc', marginBottom: '16px', fontSize: '13px', lineHeight: '1.7' }}>
          Our innovative approach addresses key challenges in blockchain gaming: economic sustainability, 
          player retention, and meaningful asset ownership. Through carefully designed tokenomics and 
          anti-inflationary mechanisms, Bonk Raiders creates lasting value for all participants.
        </p>
        <div style={{ 
          background: 'rgba(0,60,120,0.4)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid #0cf'
        }}>
          <h3 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>🎯 KEY INNOVATIONS</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px' }}>
            <li style={{ marginBottom: '6px' }}>• Energy-based PvP system preventing spam and encouraging strategy</li>
            <li style={{ marginBottom: '6px' }}>• Dynamic risk/reward balancing through mission modes</li>
            <li style={{ marginBottom: '6px' }}>• Progressive upgrade system with diminishing returns</li>
            <li>• Real-time battle mechanics with deterministic outcomes</li>
          </ul>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>🎮 GAME THEORY & MECHANICS</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '16px', fontSize: '16px' }}>Mission Architecture</h3>
        <div style={{ 
          background: 'rgba(0,60,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0f0',
          marginBottom: '16px'
        }}>
          <p style={{ color: '#ccc', marginBottom: '12px', fontSize: '12px' }}>
            The three-tier mission system creates a risk spectrum that accommodates different player 
            preferences while maintaining economic balance:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,40,0,0.3)', borderRadius: '6px' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>⛏️</div>
              <h4 style={{ color: '#0f0', margin: '0 0 4px', fontSize: '11px' }}>MINING RUNS</h4>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>90% success • Low volatility • Steady income</p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(40,20,0,0.3)', borderRadius: '6px' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🏴‍☠️</div>
              <h4 style={{ color: '#f80', margin: '0 0 4px', fontSize: '11px' }}>BLACK MARKET</h4>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>70% success • Medium risk • Balanced rewards</p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(40,0,40,0.3)', borderRadius: '6px' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🏺</div>
              <h4 style={{ color: '#f0f', margin: '0 0 4px', fontSize: '11px' }}>ARTIFACT HUNT</h4>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>50% success • High volatility • Maximum rewards</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '16px', fontSize: '16px' }}>Strategic Mode Selection</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ 
            background: 'rgba(0,60,0,0.3)', 
            padding: '16px', 
            borderRadius: '8px',
            border: '2px solid #0f0'
          }}>
            <h4 style={{ color: '#0f0', marginBottom: '12px', fontSize: '14px' }}>🛡️ SHIELDED MODE</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• 80% reward multiplier</li>
              <li style={{ marginBottom: '6px' }}>• Complete protection from raids</li>
              <li style={{ marginBottom: '6px' }}>• Ideal for risk-averse players</li>
              <li>• Guaranteed return on successful missions</li>
            </ul>
          </div>
          
          <div style={{ 
            background: 'rgba(60,30,0,0.3)', 
            padding: '16px', 
            borderRadius: '8px',
            border: '2px solid #f80'
          }}>
            <h4 style={{ color: '#f80', marginBottom: '12px', fontSize: '14px' }}>🔓 UNSHIELDED MODE</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• 100% reward multiplier</li>
              <li style={{ marginBottom: '6px' }}>• Vulnerable to player raids</li>
              <li style={{ marginBottom: '6px' }}>• Higher risk, higher reward</li>
              <li>• Creates dynamic PvP economy</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#0ff', marginBottom: '16px', fontSize: '16px' }}>Energy-Based Raiding System</h3>
        <div style={{ 
          background: 'rgba(60,0,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f00'
        }}>
          <p style={{ color: '#ccc', marginBottom: '12px', fontSize: '12px' }}>
            The energy system prevents raid spam while encouraging strategic timing and target selection:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff0', fontSize: '16px', marginBottom: '4px' }}>10</div>
              <div style={{ color: '#ccc', fontSize: '10px' }}>Maximum Energy</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff0', fontSize: '16px', marginBottom: '4px' }}>1/hr</div>
              <div style={{ color: '#ccc', fontSize: '10px' }}>Refill Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff0', fontSize: '16px', marginBottom: '4px' }}>1</div>
              <div style={{ color: '#ccc', fontSize: '10px' }}>Cost per Scan</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>💰 TOKENOMICS & ECONOMIC MODEL</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '16px', fontSize: '16px' }}>BR Token Utility Matrix</h3>
        <div style={{ 
          background: 'rgba(0,60,80,0.4)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0cf'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <h4 style={{ color: '#0f0', marginBottom: '12px', fontSize: '12px' }}>💎 EARNING MECHANISMS</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Mission completion rewards</li>
                <li style={{ marginBottom: '4px' }}>• Successful raid spoils</li>
                <li style={{ marginBottom: '4px' }}>• Defense victory bonuses</li>
                <li style={{ marginBottom: '4px' }}>• Achievement unlocks</li>
                <li>• Special event participation</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: '#f80', marginBottom: '12px', fontSize: '12px' }}>⚙️ SPENDING UTILITIES</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Ship upgrade investments</li>
                <li style={{ marginBottom: '4px' }}>• Premium cosmetic items</li>
                <li style={{ marginBottom: '4px' }}>• Advanced mission unlocks</li>
                <li style={{ marginBottom: '4px' }}>• Tournament entry fees</li>
                <li>• Guild creation costs</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: '#f0f', marginBottom: '12px', fontSize: '12px' }}>🔄 CIRCULATION</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Direct wallet withdrawals</li>
                <li style={{ marginBottom: '4px' }}>• DEX trading pairs</li>
                <li style={{ marginBottom: '4px' }}>• Cross-game integrations</li>
                <li style={{ marginBottom: '4px' }}>• Staking mechanisms</li>
                <li>• Liquidity pool rewards</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#0ff', marginBottom: '16px', fontSize: '16px' }}>Anti-Inflation Mechanisms</h3>
        <div style={{ 
          background: 'rgba(60,60,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #ff0'
        }}>
          <p style={{ color: '#ccc', marginBottom: '12px', fontSize: '12px' }}>
            Multiple systems work together to maintain token value and prevent hyperinflation:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(40,40,0,0.3)', borderRadius: '6px' }}>
              <h5 style={{ color: '#ff0', margin: '0 0 8px', fontSize: '11px' }}>⏱️ COOLDOWN LIMITS</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>8-hour mission cooldowns prevent token farming</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(40,40,0,0.3)', borderRadius: '6px' }}>
              <h5 style={{ color: '#ff0', margin: '0 0 8px', fontSize: '11px' }}>⚡ ENERGY GATES</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Limited raid attempts control token circulation</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(40,40,0,0.3)', borderRadius: '6px' }}>
              <h5 style={{ color: '#ff0', margin: '0 0 8px', fontSize: '11px' }}>📈 UPGRADE SINKS</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Progressive costs remove tokens from circulation</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#0ff', marginBottom: '16px', fontSize: '16px' }}>Economic Sustainability Model</h3>
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f0f'
        }}>
          <p style={{ color: '#ccc', marginBottom: '12px', fontSize: '12px' }}>
            Long-term economic health is maintained through balanced token flows and value creation:
          </p>
          <div style={{ fontSize: '11px', color: '#ccc' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#f0f' }}>Token Generation:</strong> Controlled by mission success rates and cooldowns
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#f0f' }}>Token Burning:</strong> Upgrade costs and premium features
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#f0f' }}>Value Creation:</strong> Skill-based gameplay and strategic depth
            </div>
            <div>
              <strong style={{ color: '#f0f' }}>Market Dynamics:</strong> Player-driven economy with real utility
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>🔧 TECHNICAL ARCHITECTURE</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div style={{ 
          background: 'rgba(0,40,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0cf'
        }}>
          <h4 style={{ color: '#0ff', marginBottom: '12px', fontSize: '14px' }}>🎨 FRONTEND LAYER</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li style={{ marginBottom: '4px' }}>• React 18 with modern hooks</li>
            <li style={{ marginBottom: '4px' }}>• HTML5 Canvas for game rendering</li>
            <li style={{ marginBottom: '4px' }}>• CSS3 animations and transitions</li>
            <li style={{ marginBottom: '4px' }}>• Responsive design patterns</li>
            <li style={{ marginBottom: '4px' }}>• Progressive Web App features</li>
            <li>• Real-time state management</li>
          </ul>
        </div>
        
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f0f'
        }}>
          <h4 style={{ color: '#f0f', marginBottom: '12px', fontSize: '14px' }}>⚙️ BACKEND SERVICES</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li style={{ marginBottom: '4px' }}>• PHP 8+ API with MySQL 8.0</li>
            <li style={{ marginBottom: '4px' }}>• JWT-based authentication</li>
            <li style={{ marginBottom: '4px' }}>• Rate limiting and anti-cheat</li>
            <li style={{ marginBottom: '4px' }}>• Node.js microservices</li>
            <li style={{ marginBottom: '4px' }}>• Redis caching layer</li>
            <li>• Automated backup systems</li>
          </ul>
        </div>
        
        <div style={{ 
          background: 'rgba(0,60,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0f0'
        }}>
          <h4 style={{ color: '#0f0', marginBottom: '12px', fontSize: '14px' }}>🔗 BLOCKCHAIN LAYER</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li style={{ marginBottom: '4px' }}>• Solana mainnet integration</li>
            <li style={{ marginBottom: '4px' }}>• SPL token standard compliance</li>
            <li style={{ marginBottom: '4px' }}>• Multi-wallet support</li>
            <li style={{ marginBottom: '4px' }}>• Transaction optimization</li>
            <li style={{ marginBottom: '4px' }}>• Smart contract auditing</li>
            <li>• Cross-chain bridge readiness</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>🚀 DEVELOPMENT ROADMAP</h2>
      <div style={{ 
        background: 'rgba(0,60,80,0.4)', 
        padding: '16px', 
        borderRadius: '8px',
        border: '2px solid #0cf'
      }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#0f0', fontSize: '20px', marginTop: '2px' }}>✅</span>
            <div>
              <h4 style={{ color: '#0f0', margin: '0 0 4px', fontSize: '12px' }}>PHASE 1: CORE FOUNDATION (COMPLETED)</h4>
              <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
                Basic gameplay loop, mission system, wallet integration, and initial tokenomics
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#0f0', fontSize: '20px', marginTop: '2px' }}>✅</span>
            <div>
              <h4 style={{ color: '#0f0', margin: '0 0 4px', fontSize: '12px' }}>PHASE 2: PVP MECHANICS (COMPLETED)</h4>
              <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
                Raiding system, energy mechanics, battle animations, and anti-cheat measures
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#ff0', fontSize: '20px', marginTop: '2px' }}>🔄</span>
            <div>
              <h4 style={{ color: '#ff0', margin: '0 0 4px', fontSize: '12px' }}>PHASE 3: ADVANCED FEATURES (IN PROGRESS)</h4>
              <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
                Ship customization, advanced missions, leaderboards, and achievement system
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: '#888', fontSize: '20px', marginTop: '2px' }}>⏳</span>
            <div>
              <h4 style={{ color: '#888', margin: '0 0 4px', fontSize: '12px' }}>PHASE 4: SOCIAL FEATURES (PLANNED)</h4>
              <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
                Guild system, tournaments, cross-game integrations, and mobile app
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

// Player Guide Content Component - Comprehensive Gameplay Guide
const PlayerGuideContent = () => (
  <div style={{ lineHeight: '1.6', fontSize: '12px' }}>
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
        <img 
          src="https://bonkraiders.com/assets/soldier1.png" 
          alt="Soldier Frame 1" 
          style={{ 
            width: '40px', 
            height: '40px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))'
          }} 
        />
        <img 
          src="https://bonkraiders.com/assets/soldier2.png" 
          alt="Soldier Frame 2" 
          style={{ 
            width: '40px', 
            height: '40px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))'
          }} 
        />
        <img 
          src="https://bonkraiders.com/assets/mech.png" 
          alt="Combat Mech" 
          style={{ 
            width: '40px', 
            height: '40px', 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))'
          }} 
        />
      </div>
      <h1 style={{ 
        fontSize: '28px', 
        margin: '0 0 12px',
        background: 'linear-gradient(45deg, #ff0, #0f0, #0cf)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        COMPLETE PLAYER'S GUIDE
      </h1>
      <p style={{ color: '#888', margin: '0 0 8px', fontSize: '14px' }}>
        Master Every Aspect of Space Raiding
      </p>
      <div style={{ 
        background: 'rgba(0,60,120,0.4)', 
        padding: '8px 16px', 
        borderRadius: '16px',
        border: '2px solid #0cf',
        display: 'inline-block'
      }}>
        <span style={{ color: '#ff0', fontSize: '12px' }}>🎯 FROM ROOKIE TO LEGEND</span>
      </div>
    </div>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>🚀 BEGINNER'S JOURNEY</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#0f0', marginBottom: '16px', fontSize: '16px' }}>Your First Hour</h3>
        <div style={{ 
          background: 'rgba(0,60,0,0.3)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '2px solid #0f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <h4 style={{ color: '#0f0', marginBottom: '12px', fontSize: '14px' }}>🔗 WALLET SETUP</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
                <li style={{ marginBottom: '6px' }}>• Download Phantom wallet (recommended)</li>
                <li style={{ marginBottom: '6px' }}>• Create new wallet or import existing</li>
                <li style={{ marginBottom: '6px' }}>• Fund with SOL for transaction fees</li>
                <li style={{ marginBottom: '6px' }}>• Connect to Bonk Raiders</li>
                <li>• Verify connection in top-right corner</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: '#0f0', marginBottom: '12px', fontSize: '14px' }}>🚢 SHIP ACQUISITION</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
                <li style={{ marginBottom: '6px' }}>• One-time purchase: 15 USDC equivalent</li>
                <li style={{ marginBottom: '6px' }}>• Permanent access to all features</li>
                <li style={{ marginBottom: '6px' }}>• Ship appears on game map</li>
                <li style={{ marginBottom: '6px' }}>• Unlock mission capabilities</li>
                <li>• Begin earning BR tokens immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#0f0', marginBottom: '16px', fontSize: '16px' }}>First Mission Strategy</h3>
        <div style={{ 
          background: 'rgba(0,40,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0cf'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <img 
              src="https://bonkraiders.com/assets/object.png" 
              alt="Mining Equipment" 
              style={{ 
                width: '48px', 
                height: '48px', 
                imageRendering: 'pixelated'
              }} 
            />
            <div>
              <h4 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '14px' }}>START WITH MINING RUNS</h4>
              <p style={{ color: '#ccc', fontSize: '11px', margin: 0 }}>
                90% success rate makes them perfect for learning game mechanics safely
              </p>
            </div>
          </div>
          
          <div style={{ fontSize: '11px', color: '#ccc' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#0cf' }}>Why Mining Runs First:</strong>
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '4px' }}>• Highest success rate minimizes early losses</li>
              <li style={{ marginBottom: '4px' }}>• Steady 10 BR income builds your treasury</li>
              <li style={{ marginBottom: '4px' }}>• Learn mission timing and cooldowns</li>
              <li>• Understand Shielded vs Unshielded modes</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#0f0', marginBottom: '16px', fontSize: '16px' }}>Essential Beginner Tips</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div style={{ 
            background: 'rgba(0,60,80,0.3)', 
            padding: '12px', 
            borderRadius: '8px',
            border: '1px solid #0cf'
          }}>
            <h5 style={{ color: '#0cf', margin: '0 0 8px', fontSize: '12px' }}>🛡️ USE SHIELDED MODE</h5>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
              While learning, use Shielded mode to avoid raids. 80% rewards are better than losing everything.
            </p>
          </div>
          
          <div style={{ 
            background: 'rgba(60,60,0,0.3)', 
            padding: '12px', 
            borderRadius: '8px',
            border: '1px solid #ff0'
          }}>
            <h5 style={{ color: '#ff0', margin: '0 0 8px', fontSize: '12px' }}>⏰ PLAN YOUR SCHEDULE</h5>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
              8-hour cooldowns mean timing matters. Launch missions before sleep or work.
            </p>
          </div>
          
          <div style={{ 
            background: 'rgba(60,0,60,0.3)', 
            padding: '12px', 
            borderRadius: '8px',
            border: '1px solid #f0f'
          }}>
            <h5 style={{ color: '#f0f', margin: '0 0 8px', fontSize: '12px' }}>💰 SAVE FOR UPGRADES</h5>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
              Your first 50 BR should go to Level 2 upgrade for 10% bonus rewards.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>⚔️ INTERMEDIATE TACTICS</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f80', marginBottom: '16px', fontSize: '16px' }}>Mission Optimization</h3>
        <div style={{ 
          background: 'rgba(60,30,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f80'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#f80', marginBottom: '12px', fontSize: '14px' }}>📊 Expected Value Calculations</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '10px',
                background: 'rgba(0,0,0,0.3)'
              }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', border: '1px solid #f80', color: '#f80' }}>Mission</th>
                    <th style={{ padding: '8px', border: '1px solid #f80', color: '#f80' }}>Success Rate</th>
                    <th style={{ padding: '8px', border: '1px solid #f80', color: '#f80' }}>Reward</th>
                    <th style={{ padding: '8px', border: '1px solid #f80', color: '#f80' }}>Expected Value</th>
                    <th style={{ padding: '8px', border: '1px solid #f80', color: '#f80' }}>BR per Hour</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#ccc' }}>Mining Run</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#0f0' }}>90%</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#ff0' }}>10 BR</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#0cf' }}>9 BR</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#f0f' }}>1.125</td>
                  </tr>
                  <tr style={{ background: 'rgba(20,10,0,0.3)' }}>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#ccc' }}>Black Market</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#ff0' }}>70%</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#ff0' }}>30 BR</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#0cf' }}>21 BR</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#f0f' }}>2.625</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#ccc' }}>Artifact Hunt</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#f00' }}>50%</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#ff0' }}>60 BR</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#0cf' }}>30 BR</td>
                    <td style={{ padding: '8px', border: '1px solid #f80', color: '#f0f' }}>3.75</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(40,20,0,0.4)', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #f80'
          }}>
            <p style={{ color: '#ccc', fontSize: '11px', margin: 0 }}>
              <strong style={{ color: '#f80' }}>Key Insight:</strong> Artifact Hunts offer the highest BR per hour, 
              but require risk tolerance. Black Market provides good balance for intermediate players.
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f80', marginBottom: '16px', fontSize: '16px' }}>Risk Management Strategies</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ 
            background: 'rgba(0,60,0,0.3)', 
            padding: '16px', 
            borderRadius: '8px',
            border: '2px solid #0f0'
          }}>
            <h4 style={{ color: '#0f0', marginBottom: '12px', fontSize: '14px' }}>🛡️ CONSERVATIVE APPROACH</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• 70% Mining Runs (steady income)</li>
              <li style={{ marginBottom: '6px' }}>• 30% Black Market (moderate risk)</li>
              <li style={{ marginBottom: '6px' }}>• Always use Shielded mode</li>
              <li style={{ marginBottom: '6px' }}>• Focus on consistent upgrades</li>
              <li>• Ideal for new players</li>
            </ul>
          </div>
          
          <div style={{ 
            background: 'rgba(60,30,0,0.3)', 
            padding: '16px', 
            borderRadius: '8px',
            border: '2px solid #f80'
          }}>
            <h4 style={{ color: '#f80', marginBottom: '12px', fontSize: '14px' }}>⚖️ BALANCED APPROACH</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• 40% Mining Runs (foundation)</li>
              <li style={{ marginBottom: '6px' }}>• 50% Black Market (main income)</li>
              <li style={{ marginBottom: '6px' }}>• 10% Artifact Hunts (high reward)</li>
              <li style={{ marginBottom: '6px' }}>• Mix Shielded and Unshielded</li>
              <li>• Best long-term strategy</li>
            </ul>
          </div>
          
          <div style={{ 
            background: 'rgba(60,0,0,0.3)', 
            padding: '16px', 
            borderRadius: '8px',
            border: '2px solid #f00'
          }}>
            <h4 style={{ color: '#f00', marginBottom: '12px', fontSize: '14px' }}>🎯 AGGRESSIVE APPROACH</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', color: '#ccc' }}>
              <li style={{ marginBottom: '6px' }}>• 20% Mining Runs (safety net)</li>
              <li style={{ marginBottom: '6px' }}>• 30% Black Market (steady gains)</li>
              <li style={{ marginBottom: '6px' }}>• 50% Artifact Hunts (maximum risk)</li>
              <li style={{ marginBottom: '6px' }}>• Primarily Unshielded mode</li>
              <li>• High risk, high reward</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#f80', marginBottom: '16px', fontSize: '16px' }}>Timing Optimization</h3>
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f0f'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(20,0,40,0.5)', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>🌙</div>
              <h5 style={{ color: '#f0f', margin: '0 0 4px', fontSize: '11px' }}>NIGHT MISSIONS</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>2 AM - 6 AM: Lowest raid activity</p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(20,0,40,0.5)', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>🌅</div>
              <h5 style={{ color: '#f0f', margin: '0 0 4px', fontSize: '11px' }}>EARLY MORNING</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>6 AM - 9 AM: Safe launch window</p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(20,0,40,0.5)', borderRadius: '6px' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️</div>
              <h5 style={{ color: '#f0f', margin: '0 0 4px', fontSize: '11px' }}>PEAK HOURS</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>7 PM - 11 PM: High raid risk</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>🏴‍☠️ ADVANCED RAIDING MASTERY</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f00', marginBottom: '16px', fontSize: '16px' }}>Target Selection Matrix</h3>
        <div style={{ 
          background: 'rgba(60,0,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f00'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <img 
              src="https://bonkraiders.com/assets/ship-fly.png" 
              alt="Raiding Ship" 
              style={{ 
                width: '48px', 
                height: '48px', 
                imageRendering: 'pixelated'
              }} 
            />
            <div>
              <h4 style={{ color: '#f00', margin: '0 0 4px', fontSize: '14px' }}>PRIORITY TARGET IDENTIFICATION</h4>
              <p style={{ color: '#ccc', fontSize: '11px', margin: 0 }}>
                Maximize your raid success by choosing the right targets
              </p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(40,0,0,0.4)', borderRadius: '6px' }}>
              <h5 style={{ color: '#0f0', margin: '0 0 8px', fontSize: '12px' }}>🎯 HIGH PRIORITY</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Artifact Hunts (60 BR potential)</li>
                <li style={{ marginBottom: '4px' }}>• High mission count, low raid wins</li>
                <li style={{ marginBottom: '4px' }}>• Recently completed missions</li>
                <li>• Players with basic ships</li>
              </ul>
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(40,0,0,0.4)', borderRadius: '6px' }}>
              <h5 style={{ color: '#ff0', margin: '0 0 8px', fontSize: '12px' }}>⚠️ MEDIUM PRIORITY</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Black Market missions (30 BR)</li>
                <li style={{ marginBottom: '4px' }}>• Balanced player statistics</li>
                <li style={{ marginBottom: '4px' }}>• Moderate upgrade levels</li>
                <li>• Mixed success patterns</li>
              </ul>
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(40,0,0,0.4)', borderRadius: '6px' }}>
              <h5 style={{ color: '#f00', margin: '0 0 8px', fontSize: '12px' }}>🚫 AVOID</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Mining Runs (only 10 BR)</li>
                <li style={{ marginBottom: '4px' }}>• High raid win ratios</li>
                <li style={{ marginBottom: '4px' }}>• Veteran players (Level 5+ ships)</li>
                <li>• Suspicious timing patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f00', marginBottom: '16px', fontSize: '16px' }}>Energy Management Tactics</h3>
        <div style={{ 
          background: 'rgba(0,40,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0cf'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#0cf', marginBottom: '12px', fontSize: '14px' }}>⚡ ENERGY EFFICIENCY STRATEGIES</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ff0', fontSize: '20px', marginBottom: '8px' }}>🕐</div>
                <h5 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '11px' }}>PEAK SCANNING</h5>
                <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Scan during 7-11 PM for maximum targets</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ff0', fontSize: '20px', marginBottom: '8px' }}>💤</div>
                <h5 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '11px' }}>OVERNIGHT REFILL</h5>
                <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Sleep with full energy, wake to 10/10</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ff0', fontSize: '20px', marginBottom: '8px' }}>🎯</div>
                <h5 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '11px' }}>SELECTIVE RAIDING</h5>
                <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Only raid 20+ BR targets minimum</p>
              </div>
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(0,20,40,0.4)', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #0cf'
          }}>
            <h5 style={{ color: '#0cf', margin: '0 0 8px', fontSize: '12px' }}>📊 ENERGY ROI CALCULATION</h5>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
              <strong>Formula:</strong> (Target Reward - 0) ÷ Energy Cost = ROI per Energy<br />
              <strong>Minimum Threshold:</strong> 20 BR per energy spent for profitable raiding
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#f00', marginBottom: '16px', fontSize: '16px' }}>Battle Mechanics Deep Dive</h3>
        <div style={{ 
          background: 'rgba(40,0,40,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f0f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <img 
                src="https://bonkraiders.com/assets/soldier1.png" 
                alt="Allied Forces" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  imageRendering: 'pixelated'
                }} 
              />
              <span style={{ color: '#f0f', fontSize: '20px', alignSelf: 'center' }}>VS</span>
              <img 
                src="https://bonkraiders.com/assets/mech.png" 
                alt="Enemy Forces" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  imageRendering: 'pixelated'
                }} 
              />
            </div>
            <div>
              <h4 style={{ color: '#f0f', margin: '0 0 4px', fontSize: '14px' }}>COMBAT SYSTEM ANALYSIS</h4>
              <p style={{ color: '#ccc', fontSize: '11px', margin: 0 }}>
                Understanding battle outcomes and tactical advantages
              </p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            <div>
              <h5 style={{ color: '#0f0', margin: '0 0 8px', fontSize: '12px' }}>🛡️ DEFENSIVE ADVANTAGES</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Home field advantage</li>
                <li style={{ marginBottom: '4px' }}>• Fortified positions</li>
                <li style={{ marginBottom: '4px' }}>• Support from base defenses</li>
                <li>• Familiar terrain benefits</li>
              </ul>
            </div>
            
            <div>
              <h5 style={{ color: '#f00', margin: '0 0 8px', fontSize: '12px' }}>⚔️ OFFENSIVE TACTICS</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
                <li style={{ marginBottom: '4px' }}>• Surprise attack bonus</li>
                <li style={{ marginBottom: '4px' }}>• Elite raiding forces</li>
                <li style={{ marginBottom: '4px' }}>• Advanced weaponry</li>
                <li>• Tactical coordination</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>⚙️ SHIP PROGRESSION MASTERY</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#f0f', marginBottom: '16px', fontSize: '16px' }}>Upgrade Investment Strategy</h3>
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f0f'
        }}>
          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '10px',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', border: '1px solid #f0f', color: '#f0f' }}>Level</th>
                  <th style={{ padding: '8px', border: '1px solid #f0f', color: '#f0f' }}>Cost</th>
                  <th style={{ padding: '8px', border: '1px solid #f0f', color: '#f0f' }}>Bonus</th>
                  <th style={{ padding: '8px', border: '1px solid #f0f', color: '#f0f' }}>Cooldown</th>
                  <th style={{ padding: '8px', border: '1px solid #f0f', color: '#f0f' }}>ROI (Missions)</th>
                  <th style={{ padding: '8px', border: '1px solid #f0f', color: '#f0f' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ccc' }}>2</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>50 BR</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>+10%</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0cf' }}>7.5h</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f80' }}>50</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>HIGH</td>
                </tr>
                <tr style={{ background: 'rgba(20,0,40,0.3)' }}>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ccc' }}>3</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>100 BR</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>+20%</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0cf' }}>7h</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f80' }}>50</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>HIGH</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ccc' }}>4</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>150 BR</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>+30%</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0cf' }}>6.5h</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f80' }}>50</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>MEDIUM</td>
                </tr>
                <tr style={{ background: 'rgba(20,0,40,0.3)' }}>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ccc' }}>5</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>225 BR</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>+45%</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0cf' }}>6h</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f80' }}>50</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>MEDIUM</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ccc' }}>6</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>300 BR</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>+60%</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0cf' }}>5.5h</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f80' }}>60</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f00' }}>LOW</td>
                </tr>
                <tr style={{ background: 'rgba(20,0,40,0.3)' }}>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ccc' }}>7</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#ff0' }}>400 BR</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0f0' }}>+80%</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#0cf' }}>5h</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f80' }}>67</td>
                  <td style={{ padding: '8px', border: '1px solid #f0f', color: '#f00' }}>LOW</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ 
            background: 'rgba(20,0,40,0.4)', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #f0f'
          }}>
            <h5 style={{ color: '#f0f', margin: '0 0 8px', fontSize: '12px' }}>💡 OPTIMAL UPGRADE PATH</h5>
            <p style={{ color: '#ccc', fontSize: '10px', margin: 0 }}>
              <strong>Phase 1:</strong> Rush to Level 4 for maximum efficiency gains<br />
              <strong>Phase 2:</strong> Focus on raiding to fund Level 5<br />
              <strong>Phase 3:</strong> Levels 6-7 are luxury upgrades for dedicated players
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#f0f', marginBottom: '16px', fontSize: '16px' }}>Performance Metrics Tracking</h3>
        <div style={{ 
          background: 'rgba(0,60,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0cf'
        }}>
          <h4 style={{ color: '#0cf', marginBottom: '12px', fontSize: '14px' }}>📊 KEY PERFORMANCE INDICATORS</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,30,40,0.5)', borderRadius: '6px' }}>
              <div style={{ color: '#ff0', fontSize: '16px', marginBottom: '8px' }}>📈</div>
              <h5 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '11px' }}>BR PER HOUR</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Total earnings ÷ active hours</p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,30,40,0.5)', borderRadius: '6px' }}>
              <div style={{ color: '#ff0', fontSize: '16px', marginBottom: '8px' }}>🎯</div>
              <h5 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '11px' }}>SUCCESS RATE</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Successful missions ÷ total attempts</p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,30,40,0.5)', borderRadius: '6px' }}>
              <div style={{ color: '#ff0', fontSize: '16px', marginBottom: '8px' }}>⚔️</div>
              <h5 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '11px' }}>RAID EFFICIENCY</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>BR stolen ÷ energy spent</p>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,30,40,0.5)', borderRadius: '6px' }}>
              <div style={{ color: '#ff0', fontSize: '16px', marginBottom: '8px' }}>🛡️</div>
              <h5 style={{ color: '#0cf', margin: '0 0 4px', fontSize: '11px' }}>DEFENSE RATE</h5>
              <p style={{ color: '#ccc', fontSize: '9px', margin: 0 }}>Successful defenses ÷ raids received</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 style={{ color: '#ff0', marginBottom: '20px', fontSize: '18px' }}>🏆 LEGENDARY PLAYER STRATEGIES</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        <div style={{ 
          background: 'rgba(60,60,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #ff0'
        }}>
          <h3 style={{ color: '#ff0', marginBottom: '12px', fontSize: '14px' }}>💰 THE ECONOMIST</h3>
          <p style={{ color: '#ccc', fontSize: '11px', marginBottom: '12px' }}>
            Focus on mathematical optimization and market timing for maximum BR accumulation.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li style={{ marginBottom: '4px' }}>• Track all mission ROI metrics</li>
            <li style={{ marginBottom: '4px' }}>• Time missions for optimal completion</li>
            <li style={{ marginBottom: '4px' }}>• Minimize risk through diversification</li>
            <li style={{ marginBottom: '4px' }}>• Reinvest profits systematically</li>
            <li>• Maintain detailed performance logs</li>
          </ul>
        </div>
        
        <div style={{ 
          background: 'rgba(60,0,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f00'
        }}>
          <h3 style={{ color: '#f00', marginBottom: '12px', fontSize: '14px' }}>⚔️ THE RAIDER</h3>
          <p style={{ color: '#ccc', fontSize: '11px', marginBottom: '12px' }}>
            Specialize in PvP combat and target identification for maximum raid profits.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li style={{ marginBottom: '4px' }}>• Master energy management cycles</li>
            <li style={{ marginBottom: '4px' }}>• Develop target selection expertise</li>
            <li style={{ marginBottom: '4px' }}>• Study player behavior patterns</li>
            <li style={{ marginBottom: '4px' }}>• Optimize raid timing windows</li>
            <li>• Build reputation as elite raider</li>
          </ul>
        </div>
        
        <div style={{ 
          background: 'rgba(0,60,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #0f0'
        }}>
          <h3 style={{ color: '#0f0', marginBottom: '12px', fontSize: '14px' }}>🛡️ THE DEFENDER</h3>
          <p style={{ color: '#ccc', fontSize: '11px', marginBottom: '12px' }}>
            Master defensive strategies and psychological warfare to protect your assets.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li style={{ marginBottom: '4px' }}>• Perfect mission timing strategies</li>
            <li style={{ marginBottom: '4px' }}>• Use decoy missions effectively</li>
            <li style={{ marginBottom: '4px' }}>• Build unpredictable patterns</li>
            <li style={{ marginBottom: '4px' }}>• Maintain high defense statistics</li>
            <li>• Discourage raiders through reputation</li>
          </ul>
        </div>
        
        <div style={{ 
          background: 'rgba(40,0,80,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '2px solid #f0f'
        }}>
          <h3 style={{ color: '#f0f', marginBottom: '12px', fontSize: '14px' }}>🎯 THE STRATEGIST</h3>
          <p style={{ color: '#ccc', fontSize: '11px', marginBottom: '12px' }}>
            Combine all approaches with advanced game theory and meta-game awareness.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '10px', color: '#ccc' }}>
            <li style={{ marginBottom: '4px' }}>• Adapt strategies to meta changes</li>
            <li style={{ marginBottom: '4px' }}>• Predict player behavior trends</li>
            <li style={{ marginBottom: '4px' }}>• Balance all gameplay aspects</li>
            <li style={{ marginBottom: '4px' }}>• Maintain competitive advantages</li>
            <li>• Lead community strategy discussions</li>
          </ul>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '24px',
        background: 'rgba(0,60,120,0.4)', 
        padding: '20px', 
        borderRadius: '12px',
        border: '2px solid #0cf',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#0cf', marginBottom: '16px', fontSize: '16px' }}>🚀 YOUR JOURNEY TO MASTERY</h3>
        <p style={{ color: '#ccc', fontSize: '12px', marginBottom: '16px', lineHeight: '1.6' }}>
          Remember that becoming a legendary raider takes time, practice, and continuous learning. 
          Start with the basics, master each system individually, then combine them into your unique playstyle. 
          The galaxy awaits your conquest!
        </p>
        <div style={{ 
          background: 'rgba(0,40,80,0.4)', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px solid #0cf'
        }}>
          <p style={{ color: '#ff0', fontSize: '11px', margin: 0 }}>
            <strong>Pro Tip:</strong> The best players constantly adapt their strategies based on the evolving meta-game. 
            Stay flexible, keep learning, and never stop improving your approach.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default DocumentationModal;