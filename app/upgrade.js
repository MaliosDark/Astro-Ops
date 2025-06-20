// app/upgrade.js

// This function will be called after the HTML is injected into the modal.
window.pageInit = () => {
  // Select all the upgrade buttons in the dossier grid
  const buttons = document.querySelectorAll('.upgrade-btn');

  buttons.forEach(btn => {
    // Read the target level from the data attribute
    const level = parseInt(btn.dataset.level, 10);

    // Attach click handler
    btn.addEventListener('click', () => {
      // Call into the parent to perform the upgrade
      window.parent.performUpgrade(level);
      // Close the modal and restore the HUD
      window.parent.closeModal();
    });
  });
};
