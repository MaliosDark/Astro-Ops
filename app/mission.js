// app/mission.js

// Called automatically after mission.html is injected
window.pageInit = () => {
  // Attach click handlers to each “Launch” button
  document.querySelectorAll('button[data-mission]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.mission;
      // Call into the parent game logic
      window.parent.startMission(type);
      // Close the modal after dispatch
      window.parent.closeModal();
    });
  });
};
