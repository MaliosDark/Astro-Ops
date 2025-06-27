// wallet.js
window.pageInit = async () => {
  const res = await fetch('https://api.bonkraiders.com/api.php?action=wallet/status');
  const data = await res.json();
  document.getElementById('addr').textContent = data.wallet;
  document.getElementById('bal').textContent  = (data.balance/1e9).toFixed(3) + ' SOL';
};
window.pageInit();
