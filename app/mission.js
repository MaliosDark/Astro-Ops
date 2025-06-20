// FILE: app/mission.js

window.pageInit = () => {
  const form = document.getElementById('mission-form');

  form.addEventListener('submit', event => {
    event.preventDefault();

    // Gather form values
    const data = new FormData(form);
    const missionType = data.get('mission'); // e.g. "MiningRun"
    const mode        = data.get('mode');    // "unshielded", "shielded", or "decoy"

    // Pass both mission type and mode up to parent game logic
    window.parent.AstroUI.setMode(mode);
    window.parent.startMission(missionType, mode);

    // Close the modal once the mission is launched
    window.parent.closeModal();
  });
};

// If loaded standalone (not in modal), initialize immediately
if (!window.opener) {
  window.pageInit();
}
