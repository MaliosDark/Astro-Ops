// app/upgrade.js
window.pageInit = () => {
  document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lvl = parseInt(btn.dataset.level, 10);
      window.parent.performUpgrade(lvl);
      window.parent.closeModal();
    });
  });
};
if (!window.opener) window.pageInit();
