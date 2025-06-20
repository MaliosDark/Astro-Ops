// app/hud.js

export function setupHUD() {
  // 1️⃣ Tooltip element
  const tooltip = document.getElementById('tooltip');

  // 2️⃣ Wire up hover tooltips on each .gb-btn
  document.querySelectorAll('.gb-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const tip = btn.getAttribute('data-tip') || '';
      tooltip.textContent = tip;
      tooltip.style.top        = (e.clientY + 10) + 'px';
      tooltip.style.left       = (e.clientX + 10) + 'px';
      tooltip.style.visibility = tip ? 'visible' : 'hidden';
    });
    btn.addEventListener('mouseleave', () => {
      tooltip.style.visibility = 'hidden';
    });
  });

  // 3️⃣ Expose AstroUI API
  window.AstroUI = {
    /**
     * Set the connected wallet address/ID in the top HUD.
     * @param {string} id - The wallet identifier to display.
     */
    setWallet(id) {
      document.getElementById('wallet-id').textContent = id;
    },

    /**
     * Update the AT balance display in the top HUD.
     * @param {number} at - The new AT balance.
     */
    setBalance(at) {
      document.getElementById('balance-val').textContent = at.toFixed(1);
    },

    /**
     * Show a temporary status message in the status panel.
     * Automatically hides after 3 seconds.
     * @param {string} msg - The status message to display.
     */
    setStatus(msg) {
      const panel = document.getElementById('status-panel');
      const span  = document.getElementById('status-msg');
      span.textContent = msg;
      if (msg) {
        panel.style.visibility = 'visible';
        clearTimeout(panel._hideTimer);
        panel._hideTimer = setTimeout(() => {
          panel.style.visibility = 'hidden';
        }, 3000);
      } else {
        panel.style.visibility = 'hidden';
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

    // 4️⃣ Hook mission button
    onMission(fn)  { document.getElementById('btn-mission').onclick = fn; },

    // 5️⃣ Hook upgrade button
    onUpgrade(fn)  { document.getElementById('btn-upgrade').onclick = fn; },

    // 6️⃣ Hook raid button
    onRaid(fn)     { document.getElementById('btn-raid').onclick    = fn; },

    // 7️⃣ Hook claim button
    onClaim(fn)    { document.getElementById('btn-claim').onclick   = fn; },

    // 8️⃣ Hook help/how-to-play button
    onHelp(fn)     { document.getElementById('btn-help').onclick    = fn; },
  };
}
