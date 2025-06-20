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
    setWallet(id) {
      document.getElementById('wallet-id').textContent = id;
    },
    setBalance(at) {
      document.getElementById('balance-val').textContent = at.toFixed(1);
    },
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
    onMission(fn)  { document.getElementById('btn-mission').onclick = fn; },
    onUpgrade(fn)  { document.getElementById('btn-upgrade').onclick = fn; },
    onRaid(fn)     { document.getElementById('btn-raid').onclick    = fn; },
    onClaim(fn)    { document.getElementById('btn-claim').onclick   = fn; },
    onHelp(fn)     { document.getElementById('btn-help').onclick    = fn; },  // ← added here
  };
}
