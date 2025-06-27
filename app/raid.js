// app/raid.js
window.pageInit = async () => {
  const listEl = document.getElementById('raid-list');
  // 1) Traer misiones del servidor
  const res = await fetch(`https://api.bonkraiders.com/api.php?action=list_missions`, {
    headers: { Authorization: `Bearer ${window.parent._jwt}` }
  });
  const scanBtn = document.getElementById('btn-scan');
  scanBtn.addEventListener('click', async () => {
    const res = await api('raid/scan');
    renderMissionList(res.missions);
    AstroUI.setEnergy(res.remainingEnergy);
  });
  const missions = await res.json();  // [{id,type,mode,reward},…]
  listEl.innerHTML = '';
  missions.forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${m.type} — ${m.mode} — ${m.reward} BR</span>
      <button data-id="${m.id}">RAID</button>
    `;
    listEl.appendChild(li);
  });
  // 2) Al pinchar, animar + llamar al API
  listEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await window.animateShipLaunch();
      await window.animateRaidTo(id);
      window.parent.performRaid(id);
      await window.animateShipReturn();
      window.parent.closeModal();
    });
  });
  // TEST
  document.getElementById('btn-test').onclick = () => window.testTravel();
};
