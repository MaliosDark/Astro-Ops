**Astro Ops**
*An isometric pixel-art strategy game on Solana*

---

## 🧭 Project Overview

Astro Ops is a browser-based, isometric pixel-art strategy game built on Solana. Players connect any Solana wallet, buy a spaceship, send it on missions to earn in-game tokens (AT), upgrade their ship, and raid others. The frontend is a plain HTML / JavaScript canvas (no frameworks), and the on-chain logic is implemented in Rust using Anchor.

---

## 📁 Repository Structure

```
astro-ops/
├── Anchor.toml             # Anchor workspace & network config
├── Cargo.toml              # Rust workspace config
├── programs/astro_ops/     # On-chain Solana program (Anchor)
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs          # Entry point & instruction dispatch
│       ├── state.rs        # Account/state definitions
│       ├── errors.rs       # Custom error codes
│       └── instructions/
│           ├── buy_ship.rs
│           ├── send_mission.rs
│           ├── upgrade_ship.rs
│           ├── raid_mission.rs
│           └── claim_rewards.rs
└── app/                     # Browser frontend (plain HTML/JS)
    ├── index.html
    ├── style.css
    ├── app.js
    ├── canvasController.js
    └── assets/
        ├── ship.png        # Pixel-art ship sprite
        ├── tiles.png       # Isometric floor tile spritesheet
        └── pixel-font.png  # Optional bitmap font
```

---

## 🔧 Prerequisites

* **Rust & Cargo** (latest stable)
* **Anchor CLI**

  ```bash
  cargo install --locked anchor-cli
  ```
* **Solana CLI**

  ```bash
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
  ```
* **Localnet validator** (via `solana-test-validator`)
* (Optional) **http-server** or similar for serving static files

---

## 🚀 On-Chain Program Setup

1. **Build & Deploy**

   ```bash
   cd programs/astro_ops
   anchor build
   anchor deploy
   ```

2. **Update IDL / Program ID**

   * After deploy, update your frontend RPC endpoints or client configs if needed.

---

## 🖥️ Frontend Setup

1. **Serve `app/` folder**

   * Simply open `app/index.html` in your browser, or
   * Use a simple HTTP server:

     ```bash
     cd app
     npx http-server .   # or python3 -m http.server
     ```

2. **Connect Wallet**

   * Click **CONNECT WALLET** on the Hero screen.
   * (Stubbed by default; see **Customization** below.)

3. **Play**

   * After connecting, the canvas appears.
   * Pan by dragging, zoom with mouse wheel.
   * Ship and grid render in isometric pixel art.
   * Mission buttons (once implemented) appear as overlays.

---

## ⚙️ Customization & Extensions

* **Real Wallet Integration**

  * Integrate [solana-wallet-adapter](https://github.com/solana-labs/wallet-adapter) by adding its scripts to `index.html` and replacing the stub in `app.js`.

* **Wire Up RPC Calls**

  * Use `@project-serum/anchor` client or `@solana/web3.js` to invoke on-chain instructions from `app.js`.

* **Asset Swap**

  * Replace `assets/ship.png` and `assets/tiles.png` with your own pixel sprites (maintain transparency).

* **Missions & UI**

  * Add HTML buttons or canvas overlays for mission selection, cooldown display, raid interface, and upgrades.

* **Styling**

  * The pixelated font is applied via CSS. Swap `pixel-font.png` or use any bitmap font you prefer.

---
