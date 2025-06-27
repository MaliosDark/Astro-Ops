// app/claim.js
window.pageInit = async () => {
  const tbody = document.getElementById('pending-body');
  const totalEl = document.getElementById('pending-total');
  // 1) Traer recompensas pendientes
  const res = await fetch(`https://api.bonkraiders.com/api.php?action=pending_missions`, {
    headers: { Authorization: `Bearer ${window.parent._jwt}` }
  });
  const { pending } = await res.json(); // [{source,amount,id},…]
  let total = 0;
  pending.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${item.source}</td><td>${item.amount} BR</td>`;
    tbody.appendChild(tr);
    total += item.amount;
  });
  totalEl.textContent = total;

  // 2) Al reclamar → llamar a performClaim()
  document.getElementById('claim-button').addEventListener('click', async () => {
    await window.parent.performClaim();
    window.parent.closeModal();
  });
};
