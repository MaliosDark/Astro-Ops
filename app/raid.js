// app/raid.js

window.pageInit = () => {
  const list = document.getElementById('raid-list');

  // Dummy targets
  const targets = [
    { name: 'Player A', mode: 'Unshielded', reward: 20 },
    { name: 'Player B', mode: 'Shielded',   reward: 30 },
    { name: 'Player C', mode: 'Decoy',      reward: 0  },
  ];

  list.innerHTML = '';
  targets.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${t.name}: ${t.mode} (${t.reward} AT)</span>
      <button data-idx="${i}">RAID</button>
    `;
    list.appendChild(li);
  });

  // Wire up each RAID button
  list.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.onclick = async () => {
      const idx = parseInt(btn.dataset.idx, 10);
      await window.animateShipLaunch();
      await window.animateRaidTo(idx);
      window.performRaid(idx);
      await window.animateShipReturn();
      window.closeModal();
    };
  });

  // TEST TRAVEL
  document.getElementById('btn-test').onclick = async () => {
    await window.testTravel();
  };
};
