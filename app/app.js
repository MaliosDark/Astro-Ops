// app/app.js

import initCanvas        from './canvasController.js';
import { setupHUD }      from './hud.js';
import { setupModal }    from './modal.js';
// import { setupGame }     from './gameLogic.js';

// pull in the four functions and re-export them globally:
import {
  animateShipLaunch,
  animateRaidTo,
  animateShipReturn,
  testTravel
} from './shipAnimator.js';

// attach to window
window.animateShipLaunch = animateShipLaunch;
window.animateRaidTo    = animateRaidTo;
window.animateShipReturn = animateShipReturn;
window.testTravel        = testTravel;

/** ================= Wallet Connection Logic ================= **/

/*** WALLET PICKER ***/

// when the user clicks “Connect X”, call its `.connect()`
async function connectWith(provider) {
  try {
    const resp = await provider.connect();
    onWalletConnected(provider, resp.publicKey.toString());
  } catch (err) {
    console.error('❌ Wallet connection failed', err);
    alert('Connection failed: ' + (err.message || err));
  }
}

// render one “Connect Phantom / Solflare / Glow…” button per injected provider
function renderWalletOptions() {
  const picker   = document.getElementById('wallet-selector');
  const noWallet = document.getElementById('btn-no-wallet');

  // no `window.solana` at all?
  if (!window.solana) {
    noWallet.style.display = 'block';
    return;
  }

  noWallet.style.display = 'none';
  picker.innerHTML = '';

  // phantom+solflare+… might live in `window.solana.providers` array
  const providers = Array.isArray(window.solana.providers)
    ? window.solana.providers
    : [window.solana];

  providers.forEach(provider => {
    let name = 'Unknown Wallet';
    if (provider.isPhantom)  name = 'Phantom';
    if (provider.isSolflare) name = 'Solflare';
    if (provider.isGlow)     name = 'Glow';
    if (provider.isTorus)    name = 'Torus';

    const btn = document.createElement('button');
    btn.textContent = `Connect ${name}`;
    btn.className   = 'gb-btn';
    btn.onclick     = () => connectWith(provider);
    picker.appendChild(btn);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderWalletOptions);
} else {
  // DOM is already parsed, so just go
  renderWalletOptions();
}

/**
 * Called after successfully connecting:
 *  – hides the hero screen
 *  – shows your HUD
 *  – writes the pubkey into #wallet-id
 *  – sets up a disconnect handler that reloads the page
 */
function onWalletConnected(provider, publicKey) {
  document.getElementById('hero').style.display = 'none';
  document.getElementById('gb-ui').style.display   = 'flex';
  document.getElementById('wallet-id').textContent = publicKey;
  provider.on('disconnect', () => {
    console.log('🔌 Wallet disconnected, reloading…');
    window.location.reload();
  });
}

/**
 * Pops up the wallet’s “Connect” modal.
 * Alerts the user if no provider is found.
 */
async function connectWallet() {
  console.log('🚀 connectWallet fired');
  const provider = getSolanaProvider();
  if (!provider) {
    alert(
      'No Solana wallet detected.\n' +
      'Ensure you’re on HTTPS (or http://localhost) and have Phantom, Solflare, Glow, etc. installed.'
    );
    return;
  }

  try {
    const resp = await provider.connect();
    onWalletConnected(provider, resp.publicKey.toString());
  } catch (err) {
    console.error('❌ Wallet connection failed', err);
    alert('Connection failed: ' + (err.message || err));
  }
}

// wire up the #btn-connect click as soon as the DOM exists
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-connect');
  if (btn) {
    btn.addEventListener('click', connectWallet);
  } else {
    console.warn('⚠️  #btn-connect not found – make sure you have a <button id="btn-connect">');
  }
});

/** ================ Your Existing Load Logic ================ **/
window.addEventListener('load', async () => {
  const canvas = document.getElementById('game-canvas');
  await initCanvas(canvas);

  setupHUD();
  setupModal();
 // setupGame(canvas);
});
