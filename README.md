````markdown
 _______     ______    _____  ___   __   ___                                     
|   _  "\   /    " \  (\"   \|"  \ |/"| /  ")                                    
(. |_)  :) // ____  \ |.\\   \    |(: |/   /                                     
|:     \/ /  /    ) :)|: \.   \\  ||    __/                                      
(|  _  \\(: (____/ // |.  \    \. |(// _  \                                      
|: |_)  :)\        /  |    \    \ ||: | \  \                                     
(_______/  \"_____/    \___|\____\)(__|  \__)                                    
                                                                                 
      _______        __        __     ________    _______   _______    ________  
     /"      \      /""\      |" \   |"      "\  /"     "| /"      \  /"       ) 
    |:        |    /    \     ||  |  (.  ___  :)(: ______)|:        |(:   \___/  
    |_____/   )   /' /\  \    |:  |  |: \   ) || \/    |  |_____/   ) \___  \    
     //      /   //  __'  \   |.  |  (| (___\ || // ___)_  //      /   __/  \\   
    |:  __   \  /   /  \\  \  /\  |\ |:       :)(:      "||:  __   \  /" \   :)  
    |__|  \___)(___/    \___)(__\_|_)(________/  \_______)|__|  \___)(_______/   
                                                                                                                      
````

# Bonk Raiders

Welcome to **Bonk Raiders** 👾 — a retro pixel-style, Solana-powered raiding game where you launch missions, upgrade your ship, and raid other players for juicy rewards!

---

## 🚀 Features

* **🛸 Missions & Raiding**

  * Send your ship on mining runs, black market deals or artifact hunts
  * Choose **Shielded**, **Unshielded** modes
  * Raid other players’ unshielded missions for extra spoils

* **⚙️ Ship Upgrades**

  * Enhance ship performance, reduce cooldowns & boost rewards
  * 7 upgrade tiers with escalating costs and benefits

* **💰 On-chain Tokens & Rewards**

  * Burn participation fee on Solana
  * Off-chain mission logic guarded by anti-cheat rules
  * Mint or steal \$BR tokens directly to your wallet

* **🔐 Security & Anti-Cheat**

  * Enforced cooldowns, daily mission limits
  * Payload inspection, origin checks & replay protection
  * Hardened PHP backend & Node.js Solana API microservice

* **📈 Leaderboards & Progression**

  * Track kills, raids won & energy
  * Compete in global rankings

---

## 🛠️ Tech Stack

| Layer          | Technologies                                       |
| -------------- | -------------------------------------------------- |
| **Frontend**   | HTML5 · CSS3 · Vanilla JS · React · Canvas API     |
| **Blockchain** | Solana · @solana/web3.js · SPL-Token               |
| **Backend**    | PHP (API) · MySQL · Node.js (Solana API)           |
| **Styling**    | Retro pixel font (Press Start 2P) · CSS pixelation |
| **Security**   | CSP, XSS & injection filters · AntiCheat rules     |

---

## 📂 Directory Structure

```
home/base/Bonk-Raiders/
├── app/                 ← Frontend single-page & modals
│   ├── assets/          ← Images & sprites
│   ├── app.js           ← Bootstraps canvas, HUD & game logic
│   ├── canvasController.js
│   ├── shipAnimator.js
│   ├── hud.js
│   ├── modal.js
│   ├── gameLogic.js
│   ├── mission.html/js
│   ├── raid.html/js
│   ├── upgrade.html/js
│   ├── claim.html/js
│   ├── wallet.html/js
│   ├── howto.html
│   ├── uiOverlay.html
│   └── style.css
├── Server/              ← PHP API & anti-cheat
│   ├── api.php
│   ├── hacker_protect.php
│   ├── anti_cheat.php
│   ├── error.php
│   ├── migrations.sql
│   └── solana-api/      ← Node.js microservice (burn & mint)
│       ├── index.js
│       ├── .env.example
│       └── package.json
└── README.md            ← You are here! 🎉
```

---

## 🔧 Prerequisites

* **Node.js** (v16+) & **npm**
* **PHP** (v7.4+) & **Composer**
* **MySQL** (or MariaDB)
* **Solana CLI / RPC access**

---

## ⚙️ Configuration

1. **Frontend**

   * No build step: static files in `app/`
   * Ensure your webserver points to `app/index.html`.

2. **PHP API** (`Server/api.php`)

   ```php
   define('DB_HOST',      '127.0.0.1');
   define('DB_NAME',      'astroops');
   define('DB_USER',      'your_db_user');
   define('DB_PASS',      'your_db_pass');
   define('JWT_SECRET',   'replace_with_strong_secret');
   define('SOLANA_API_URL','http://localhost:3070');
   ```

   * Run `migrations.sql` on empty database (auto-migration runs if needed).

3. **Solana API** (`Server/solana-api/`)

   * Copy `.env.example → .env`
   * Populate:

     ```
     SOLANA_RPC=https://api.mainnet-beta.solana.com
     COMMUNITY_SECRET_KEY=[ … your mint authority secret … ]
     GAME_TOKEN_MINT=PCYfGh9…bonk
     PORT=3070
     CORS_ORIGINS=https://bonkraiders.com
     ```

---

## 🏃 Installation & Run

### 1. Start Solana Microservice

```bash
cd Server/solana-api
npm install
npm start
```

*🚀 Listens on port `3070` by default.*

### 2. Start PHP API

```bash
cd Server
composer install           # (if you have dependencies)
php -S localhost:8000 api.php
```

*🔐 Exposes `/api.php?action=…` endpoints, enables anti-cheat & rate-limiting.*

### 3. Serve Frontend

* **Option A:** Static file server

  ```bash
  cd app
  npx serve .               # or your favorite static server
  ```
* **Option B:** Integrated with PHP (for index.php dead-end)

  ```bash
  cd Server
  php -S localhost:8000 ../app/index.php
  ```

---

## 🎮 Usage

1. **Connect Wallet**

   * Click the **Phantom** wallet button (top-right).
2. **Buy Ship**

   * 15 USDC on Solana → one-time burn.
3. **Launch Missions**

   * Select type, mode & confirm → watch pixel animation.
4. **Raid Other Players**

   * Spend energy to scan & raid unshielded missions.
5. **Upgrade & Claim**

   * Improve ship tier; claim your on-chain rewards.

---

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/XYZ`)
3. Commit your changes (`git commit -m "Add XYZ"`)
4. Push & open a PR

Please adhere to **clean code**, **pixel-perfect styling**, and keep all **anti-cheat** safeguards intact ⚔️.

---

## 📄 License

This project is licensed under the **MIT License**.
See [LICENSE](LICENSE) for details.

---

> **Bonk Raiders** – Explore. Raid. Earn. 💥
> © 2024 Bonk Raiders Inc. All rights reserved.

```
```
