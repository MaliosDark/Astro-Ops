// FILE: app/mission.js

window.pageInit = () => {
  const form = document.getElementById('mission-form');

  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const missionType = formData.get('mission');             // e.g. "MiningRun"
    const mode        = formData.get('mode');                // "unshielded" or "shielded"

    // Call into parent game logic with both mission and mode
    window.parent.startMission(missionType, mode);

    // Close the modal
    window.parent.closeModal();
  });
};

// If this page is loaded directly (outside of modal), initialize immediately
if (!window.opener) {
  window.pageInit();
}
