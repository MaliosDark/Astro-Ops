// app/mission.js
window.pageInit = () => {
  const form = document.getElementById('mission-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const type = data.get('mission');   // "MiningRun" o similar
    const mode = data.get('mode');      // "unshielded"|"shielded"|"decoy"

    window.parent.AstroUI.setMode(mode);
    window.parent.startMission(type, mode);
    window.parent.closeModal();
  });
};
if (!window.opener) window.pageInit();
