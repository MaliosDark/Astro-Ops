// app/gameLogic.js
import React from 'react';
import ReactDOM from 'react-dom';
import { showModal, closeModal } from './modal.js';
import {
  animateShipLaunch,
  animateRaidTo,
  animateShipReturn,
  testTravel
} from './shipAnimator.js';
import {
  Connection,
  PublicKey,
  clusterApiUrl
} from '@solana/web3.js';
import {
  WalletAdapterNetwork
} from '@solana/wallet-adapter-base';
import {
  getPhantomWallet
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import {
  useWallet,
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';

// — Solana wallet setup —
const network = WalletAdapterNetwork.Mainnet;
const endpoint = clusterApiUrl(network);
const wallets = [ getPhantomWallet() ];

ReactDOM.render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
      <WalletMultiButton />
        <MainApp />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>,
  document.getElementById('react-root')
);

function MainApp() {
  const { publicKey, signMessage } = useWallet();
  const [jwt, setJwt] = React.useState(null);
  const hud = window.AstroUI;

  // Helper para llamar al backend con JWT
  const api = async (action, body = {}) => {
    const res = await fetch(`https://api.bonkraiders.com/api.php?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  };

  // Actualiza el balance en el HUD
  const fetchBalance = async () => {
    const { claimable_AT } = await api('claim_rewards');
    hud.setBalance(claimable_AT);
  };

  // 1️⃣ Cuando cambia publicKey: login por nonce
  React.useEffect(() => {
    if (!publicKey) return;
    (async () => {
      try {
        // 1) get nonce
        let res = await fetch(`https://api.bonkraiders.com/api.php?action=auth/nonce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey: publicKey.toBase58() })
        });
        const { nonce } = await res.json();

        // 2) sign it
        const encoded = new TextEncoder().encode(nonce);
        const sig = await signMessage(encoded);
        const signature = Buffer.from(sig).toString('base64');

        // 3) login
        res = await fetch(`https://api.bonkraiders.com/api.php?action=auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicKey: publicKey.toBase58(),
            nonce,
            signature
          })
        });
        const { token } = await res.json();
        setJwt(token);
        window._jwt = token;
        hud.setWallet(publicKey.toBase58());
      } catch (e) {
        hud.setStatus(`Auth error: ${e.message}`);
      }
    })();
  }, [publicKey]);

  // 2️⃣ Cuando cambia jwt: compramos el ship y mostramos la UI
  React.useEffect(() => {
    if (!jwt) return;
    (async () => {
      try {
        // refrescamos balance (claimable_AT)
        await fetchBalance();
        // intentamos comprar ship (si ya tiene, ignora)
        await api('buy_ship');
        hud.setStatus('Ship acquired!');
      } catch (e) {
        // ignoramos “already purchased”
      } finally {
        // ocultar pantalla de héroe y mostrar el juego
        document.getElementById('hero').style.display        = 'none';
        document.getElementById('game-canvas').style.display = 'block';
        document.getElementById('gb-ui').style.display       = 'flex';
      }
    })();
  }, [jwt]);

  // 3️⃣ Hook de botones HUD (solo tras obtener jwt)
  React.useEffect(() => {
    if (!jwt) return;
    hud.onMission(() => showModal('mission'));
    hud.onUpgrade(() => showModal('upgrade'));
    hud.onRaid    (() => showModal('raid'));
    hud.onHelp    (() => showModal('howto'));
    hud.onClaim   (() => showModal('claim'));
  }, [jwt]);

  // — Funciones globales para misiones, raids, upgrades, claim —
  window.startMission = async (type, mode = 'Unshielded') => {
    closeModal();
    try {
      hud.setStatus(`Launching ${type}…`);
      await animateShipLaunch();
      hud.setStatus('In transit…');
      await animateRaidTo(type);

      const { success, reward, br_balance } = await api('send_mission', { type, mode });
      hud.setStatus(success ? `+${reward} BR` : 'Mission failed');
      hud.setBalance(br_balance);

      hud.setStatus('Returning home…');
      await animateShipReturn();
    } catch (e) {
      hud.setStatus(e.message);
    }
  };

  window.performUpgrade = async level => {
    closeModal();
    try {
      const { br_balance } = await api('upgrade_ship', { level });
      hud.setStatus(`Upgraded to L${level}`);
      hud.setBalance(br_balance);
    } catch (e) {
      hud.setStatus(e.message);
    }
  };

  window.performRaid = async mission_id => {
    closeModal();
    try {
      const { stolen, br_balance } = await api('raid_mission', { mission_id });
      hud.setStatus(`+${stolen} BR`);
      hud.setBalance(br_balance);
    } catch (e) {
      hud.setStatus(e.message);
    }
  };

  window.performClaim = async () => {
    closeModal();
    try {
      const { claimable_AT } = await api('claim_rewards');
      hud.setStatus(`+${claimable_AT} BR`);
      hud.setBalance(claimable_AT);
    } catch (e) {
      hud.setStatus(e.message);
    }
  };

  return null;
}
