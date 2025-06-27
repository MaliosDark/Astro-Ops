// src/utils/hud.js

export function setupHUD() {
  // Initialize global counters for compatibility - EXACTLY like original
  window.killCount = 0;
  window.raidWins = 0;

  // 1️⃣ Tooltip element
  const tooltip = document.getElementById('tooltip');

  // 2️⃣ Wire up hover tooltips on each .gb-btn - EXACTLY like original
  document.querySelectorAll('.gb-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const tip = btn.getAttribute('data-tip') || '';
      if (tooltip) {
        tooltip.textContent = tip;
        tooltip.style.top = (e.clientY + 10) + 'px';
        tooltip.style.left = (e.clientX + 10) + 'px';
        tooltip.style.visibility = tip ? 'visible' : 'hidden';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.style.visibility = 'hidden';
      }
    });
  });

  // 3️⃣ Expose AstroUI API - EXACTLY like original
  window.AstroUI = {
    /**
     * Set the connected wallet address/ID in the top HUD.
     * @param {string} id - The wallet identifier to display.
     */
    setWallet(id) {
      const el = document.getElementById('wallet-id');
      if (el) el.textContent = id;
    },

    /**
     * Update the BR balance display in the top HUD.
     * @param {number} br - The new BR balance.
     */
    setBalance(br) {
      const el = document.getElementById('balance-val');
      if (el) el.textContent = br.toFixed(1);
    },

    /**
     * Show a temporary status message in the status panel.
     * Automatically hides after 3 seconds.
     * @param {string} msg - The status message to display.
     */
    setStatus(msg) {
      const panel = document.getElementById('status-panel');
      const span = document.getElementById('status-msg');
      if (span) span.textContent = msg;
      if (panel) {
        if (msg) {
          panel.style.visibility = 'visible';
          clearTimeout(panel._hideTimer);
          panel._hideTimer = setTimeout(() => {
            panel.style.visibility = 'hidden';
          }, 3000);
        } else {
          panel.style.visibility = 'hidden';
        }
      }
    },

    /**
     * Update the kill count display in the top HUD.
     * @param {number} count - Total number of kills to display.
     */
    setKills(count) {
      const el = document.getElementById('kill-count');
      if (el) el.textContent = count;
    },

    /**
     * Update the raids-won count display in the top HUD.
     * @param {number} count - Total number of successful raids to display.
     */
    setRaidsWon(count) {
      const el = document.getElementById('raid-wins');
      if (el) el.textContent = count;
    },

    setMode(mode) {
      const el = document.getElementById('mode-val');
      if (!el) return;
      // puedes formatearlo bonito:
      const label = {
        unshielded: 'Unshielded',
        shielded: 'Shielded',
        decoy: 'Decoy'
      }[mode] || mode;
      el.textContent = label;
    },

    // 4️⃣ Hook mission button
    onMission(fn) { 
      const btn = document.getElementById('btn-mission');
      if (btn) btn.onclick = fn;
    },

    // 5️⃣ Hook upgrade button
    onUpgrade(fn) { 
      const btn = document.getElementById('btn-upgrade');
      if (btn) btn.onclick = fn;
    },

    // 6️⃣ Hook raid button
    onRaid(fn) { 
      const btn = document.getElementById('btn-raid');
      if (btn) btn.onclick = fn;
    },

    // 7️⃣ Hook claim button
    onClaim(fn) { 
      const btn = document.getElementById('btn-claim');
      if (btn) btn.onclick = fn;
    },

    // 8️⃣ Hook help/how-to-play button
    onHelp(fn) { 
      const btn = document.getElementById('btn-help');
      if (btn) btn.onclick = fn;
    },
  };

  console.log('HUD setup complete - EXACTLY like original');
}