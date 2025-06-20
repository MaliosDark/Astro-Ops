// app/claim.js

const dummyPending = [
  { source: 'Mining Run',    amount: 10 },
  { source: 'Black Market',  amount: 30 },
  { source: 'Artifact Hunt', amount: 60 },
];

window.pageInit = () => {
  // Populate pending table
  const tbody = document.getElementById('pending-body');
  let total = 0;
  dummyPending.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.source}</td>
      <td>${item.amount} AT</td>
    `;
    tbody.appendChild(tr);
    total += item.amount;
  });
  document.getElementById('pending-total').textContent = total;

  const btn    = document.getElementById('claim-button');
  const status = document.getElementById('claim-status');

  btn.addEventListener('click', async () => {
    // Disable button
    btn.disabled = true;
    btn.style.opacity = '0.6';

    // Typing animation
    const msg = 'Processing claim';
    status.textContent = '';
    for (let i = 0; i < msg.length; i++) {
      status.textContent += msg[i];
      await new Promise(r => setTimeout(r, 50));
    }
    let dots = '';
    for (let cycle = 0; cycle < 3; cycle++) {
      dots += '.';
      status.textContent = msg + dots;
      await new Promise(r => setTimeout(r, 300));
    }

    // Perform the on-chain claim
    window.parent.performClaim();
    window.parent.closeModal();

    // Show success
    status.textContent = `+${total} AT claimed!`;
    await new Promise(r => setTimeout(r, 1500));

    // Clear status and reset
    status.textContent = '';
    btn.disabled = false;
    btn.style.opacity = '1';
  });
};
