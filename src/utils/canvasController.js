// src/utils/canvasController.js

export async function initCanvas(canvas) {
  // — Resize to fill viewport —
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // — Load assets —
  const marsImg = new Image(); marsImg.src = 'https://bonkraiders.com/assets/mars_floor.png';
  const shipImg = new Image(); shipImg.src = 'https://bonkraiders.com/assets/ship.png';
  const enemyShipImg = new Image(); enemyShipImg.src = 'https://bonkraiders.com/assets/ship-fly.png';
  const dogImg = new Image(); dogImg.src = 'https://bonkraiders.com/assets/dog.png';
  const buildingImg = new Image(); buildingImg.src = 'https://bonkraiders.com/assets/building.png';
  const objectImg0 = new Image(); objectImg0.src = 'https://bonkraiders.com/assets/object.png';
  const objectImg1 = new Image(); objectImg1.src = 'https://bonkraiders.com/assets/object1.png';
  const soldierImg = new Image(); soldierImg.src = 'https://bonkraiders.com/assets/soldier.png';
  const mechImg = new Image(); mechImg.src = 'https://bonkraiders.com/assets/mech.png';

  const soldierFrames = [
    new Image(),  // frame 0
    new Image()   // frame 1
  ];
  soldierFrames[0].src = 'https://bonkraiders.com/assets/soldier1.png';
  soldierFrames[1].src = 'https://bonkraiders.com/assets/soldier2.png';

  await Promise.all([
    marsImg, shipImg, enemyShipImg, dogImg, buildingImg,
    objectImg0, objectImg1, mechImg,
    soldierFrames[0], soldierFrames[1]
  ].map(img => new Promise(r => img.onload = r)));

  // — Tile dims & grid —
  const TILE_W = 64, TILE_H = 32;
  const totalCells = Math.round((2 * marsImg.width) / TILE_W);
  const GRID_W = Math.floor(totalCells / 2);
  const GRID_H = GRID_W;

  // — Convert grid to isometric —
  function raw(ix, iy) {
    return { x: (ix - iy) * (TILE_W / 2), y: (ix + iy) * (TILE_H / 2) };
  }

  // — Camera state —
  const scale = 1.5;
  let offsetX = 0, offsetY = 0;
  function clampOffset() { } // no clamping

  // — Random cell in lower half —
  function randLowerCell() {
    return {
      ix: Math.floor(Math.random() * (GRID_W - 1)) + 1,
      iy: Math.floor(Math.random() * (GRID_H / 2)) + Math.ceil(GRID_H / 2)
    };
  }

  // — Static scene elements —
  const buildings = Array.from({ length: 5 }, randLowerCell);
  const objects0 = Array.from({ length: 7 }, randLowerCell);
  const objects1 = Array.from({ length: 7 }, randLowerCell);

  // — Our ship & pilot dog —
  const baseShipPos = { ix: GRID_W / 2 | 0, iy: GRID_H / 2 | 0 };
  const dogPos = randLowerCell();

  window.shipPos = { ...baseShipPos };
  window.hasShip = false; // Track if player owns a ship
  window.__iso = {
    TILE_W,
    getScale: () => scale,
    worldToScreen(ix, iy) {
      const p = raw(ix, iy);
      return { x: p.x * scale + offsetX, y: p.y * scale + offsetY };
    }
  };

  // — Battle participants and projectiles —
  const characters = [];
  const projectiles = [];

  // — Global stats counters on window for easy access —
  window.killCount = 0;
  window.raidWins = 0;

  // — Battle state (solo cuando reciben raid) —
  let battleActive = false;
  let enemyLanding = null;

  // — Dispatch battle end event to be caught elsewhere —
  window.onBattleEnd = survivors => {
    // If allies survived but no enemies left, count it as a raid win
    if (survivors > 0) {
      window.raidWins++;
      if (window.AstroUI) {
        window.AstroUI.setRaidsWon(window.raidWins);
      }
    }
    const evt = new CustomEvent('battleEnd', { detail: survivors });
    window.dispatchEvent(evt);
  };

  // — Enemy ship overlay for landing/departure —
  function getEnemyOverlay() {
    let el = document.getElementById('__enemyOverlay');
    if (!el) {
      el = document.createElement('img');
      el.id = '__enemyOverlay';
      el.src = enemyShipImg.src;
      Object.assign(el.style, {
        position: 'absolute',
        width: `${TILE_W * scale}px`,
        height: 'auto',
        pointerEvents: 'none',
        transform: 'translate(-50%,-50%) scaleX(-1)', // flipped horizontally
        transition: 'none',
        zIndex: '2400',
        display: 'none'
      });
      document.body.appendChild(el);
    }
    return el;
  }

  async function animateEnemyArrive(ix, iy) {
    const el = getEnemyOverlay();
    const start = window.__iso.worldToScreen(-5, iy);
    el.style.left = `${start.x}px`;
    el.style.top = `${start.y}px`;
    el.style.transition = 'none';
    el.style.display = 'block';
    await new Promise(r => setTimeout(r, 20));
    const dest = window.__iso.worldToScreen(ix, iy);
    el.style.transition = 'left 1s ease, top 1s ease';
    el.style.left = `${dest.x}px`;
    el.style.top = `${dest.y}px`;
    await new Promise(r => setTimeout(r, 1000));
  }

  async function animateEnemyDepart(ix, iy) {
    const el = getEnemyOverlay();
    const start = window.__iso.worldToScreen(ix, iy);
    el.style.transition = 'left 1s ease, top 1s ease';
    el.style.left = `${canvas.width + 50}px`;
    el.style.top = `${start.y}px`;
    await new Promise(r => setTimeout(r, 1000));
    el.style.display = 'none';
  }

  // — Función para iniciar batalla cuando el jugador recibe un raid —
  window.startDefenseBattle = async function() {
    if (battleActive || !window.hasShip || window.__shipInFlight) {
      return; // No iniciar si ya hay batalla, no tiene nave, o está en raid
    }

    battleActive = true;
    const edge = { ix: GRID_W - 1, iy: Math.random() * GRID_H };
    enemyLanding = edge;
    await animateEnemyArrive(edge.ix, edge.iy);

    // spawn 2-4 enemy mechs (atacantes del raid)
    const enemyCount = Math.floor(Math.random() * 3) + 2; // 2-4 enemies
    for (let i = 0; i < enemyCount; i++) {
      characters.push({
        ix: edge.ix + Math.random() * 2,
        iy: edge.iy + (Math.random() - 0.5) * 2,
        dirX: Math.random() - 0.5,
        dirY: Math.random() - 0.5,
        type: 'mech',
        faction: 'enemy',
        health: 60 + Math.random() * 40, // 60-100 health
        maxHealth: 100,
        lastShot: 0, shootInterval: 1 + Math.random() * 2
      });
    }

    // spawn 3-5 ally soldiers (defensores)
    const allyCount = Math.floor(Math.random() * 3) + 3; // 3-5 allies
    for (let i = 0; i < allyCount; i++) {
      characters.push({
        ix: baseShipPos.ix + (Math.random() - 0.5) * 4,
        iy: baseShipPos.iy + (Math.random() - 0.5) * 4,
        dirX: Math.random() - 0.5,
        dirY: Math.random() - 0.5,
        type: 'soldier',
        faction: 'ally',
        health: 50 + Math.random() * 30, // 50-80 health
        maxHealth: 80,
        lastShot: 0, shootInterval: 1 + Math.random() * 2
      });
    }
  };

  // — Función para iniciar batalla durante un raid ofensivo —
  window.startRaidBattle = async function() {
    if (battleActive) {
      return; // No iniciar si ya hay batalla
    }

    battleActive = true;
    
    // No necesitamos animación de nave enemiga porque somos nosotros los atacantes
    
    // spawn 3-5 enemy defenders (defensores del objetivo)
    const enemyCount = Math.floor(Math.random() * 3) + 3; // 3-5 enemies
    for (let i = 0; i < enemyCount; i++) {
      characters.push({
        ix: baseShipPos.ix + (Math.random() - 0.5) * 6,
        iy: baseShipPos.iy + (Math.random() - 0.5) * 6,
        dirX: Math.random() - 0.5,
        dirY: Math.random() - 0.5,
        type: 'soldier',
        faction: 'enemy',
        health: 60 + Math.random() * 40, // 60-100 health
        maxHealth: 100,
        lastShot: 0, shootInterval: 1 + Math.random() * 2
      });
    }

    // spawn 2-4 ally raiders (nuestras fuerzas de ataque)
    const allyCount = Math.floor(Math.random() * 3) + 2; // 2-4 allies
    for (let i = 0; i < allyCount; i++) {
      characters.push({
        ix: baseShipPos.ix + (Math.random() - 0.5) * 4,
        iy: baseShipPos.iy + (Math.random() - 0.5) * 4,
        dirX: Math.random() - 0.5,
        dirY: Math.random() - 0.5,
        type: 'mech',
        faction: 'ally',
        health: 80 + Math.random() * 20, // 80-100 health (más fuertes para raid)
        maxHealth: 100,
        lastShot: 0, shootInterval: 1 + Math.random() * 2
      });
    }
    
    // Esperar un poco para que se vea la batalla
    await new Promise(resolve => setTimeout(resolve, 3000));
  };
  // — Center camera on our ship initially —
  (c => {
    offsetX = canvas.width / 2 - c.x * scale;
    offsetY = canvas.height / 2 - c.y * scale + canvas.height * 0.3;
  })(raw(baseShipPos.ix, baseShipPos.iy));

  let lastTime = performance.now() / 1000;

  async function draw() {
    const now = performance.now() / 1000, dt = now - lastTime;
    lastTime = now;

    // — No más batallas automáticas —
    // Las batallas solo se inician cuando alguien hace raid al jugador
    // usando window.startDefenseBattle()

    // — Update each character's movement & shooting —
    characters.forEach((ch, idx) => {
      // movement
      const speed = ch.type === 'mech' ? 0.4 : 0.6; // velocidad ligeramente aumentada
      const nx = ch.ix + ch.dirX * dt * speed;
      const ny = ch.iy + ch.dirY * dt * speed;
      const inside = nx >= 0 && nx <= GRID_W && ny >= 0 && ny <= GRID_H;
      const blocked = [...buildings, ...objects0, ...objects1, baseShipPos, dogPos]
        .map(o => raw(o.ix, o.iy))
        .some(o => {
          const w = raw(nx, ny);
          return Math.hypot(w.x - o.x, w.y - o.y) < TILE_W * 0.5;
        });
      if (!inside || blocked) {
        ch.dirX *= -1;
        ch.dirY = (Math.random() - 0.5) || ch.dirY;
      } else {
        ch.ix = nx; ch.iy = ny;
      }

      // shooting
      if (now - ch.lastShot >= ch.shootInterval) {
        ch.lastShot = now;
        ch.shootInterval = 1 + Math.random() * 2;
        const targets = characters.filter(t =>
          t !== ch &&
          t.faction !== 'neutral' &&
          t.faction !== ch.faction &&
          t.health > 0
        );
        if (targets.length) {
          const tgt = targets[Math.floor(Math.random() * targets.length)];
          const from = raw(ch.ix, ch.iy), to = raw(tgt.ix, tgt.iy);
          const dx = to.x - from.x, dy = to.y - from.y;
          const mag = Math.hypot(dx, dy) || 1;
          projectiles.push({
            x: from.x, y: from.y,
            vx: dx / mag * (200 + Math.random() * 50), // proyectiles más rápidos
            vy: dy / mag * (200 + Math.random() * 50),
            damage: (ch.type === 'soldier' ? 20 + Math.random() * 10 : 30 + Math.random() * 15), // más daño para batallas más rápidas
            faction: ch.faction,
            targetIdx: characters.indexOf(tgt)
          });
        }
      }
    });

    // — Update projectiles & handle hits —
    projectiles.forEach((pr, i) => {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      const tgt = characters[pr.targetIdx];
      if (tgt && tgt.health > 0) {
        const pos = raw(tgt.ix, tgt.iy);
        if (Math.hypot(pr.x - pos.x, pr.y - pos.y) < 15) { // slightly larger hit radius
          tgt.health -= pr.damage;
          projectiles.splice(i, 1);

          if (tgt.health <= 0) {
            // if ally shoots enemy → increment killCount + HUD
            if (pr.faction === 'ally' && tgt.faction === 'enemy') {
              window.killCount++;
              if (window.AstroUI) {
                window.AstroUI.setKills(window.killCount);
              }
            }
            // remove dead
            characters.splice(pr.targetIdx, 1);
          }
        }
      }
      // discard off-world shots
      if (
        pr.x * scale + offsetX < -50 ||
        pr.x * scale + offsetX > canvas.width + 50 ||
        pr.y * scale + offsetY < -50 ||
        pr.y * scale + offsetY > canvas.height + 50
      ) {
        projectiles.splice(i, 1);
      }
    });

    // — Check battle end —
    if (battleActive) {
      const hasAlly = characters.some(c => c.faction === 'ally' && c.health > 0);
      const hasEnemy = characters.some(c => c.faction === 'enemy' && c.health > 0);
      if (!hasAlly || !hasEnemy) {
        battleActive = false;
        const survivors = characters.filter(c => c.faction === 'ally' && c.health > 0).length;

        // increment raidWins if allies won
        if (hasAlly && !hasEnemy) {
          window.raidWins++;
          // Bonus reward for defending successfully
          if (window.AstroUI) {
            window.AstroUI.setStatus(`Defense successful! Raid repelled!`);
          }
          if (window.AstroUI) {
            window.AstroUI.setRaidsWon(window.raidWins);
          }
        } else if (!hasAlly && hasEnemy) {
          // Player lost defense
          if (window.AstroUI) {
            window.AstroUI.setStatus(`Defense failed! Base raided!`);
          }
        }

        // clean up all battle chars
        for (let i = characters.length - 1; i >= 0; i--) {
          if (characters[i].faction !== 'neutral') {
            characters.splice(i, 1);
          }
        }

        // animate enemy ship departure
        if (enemyLanding) {
          await animateEnemyDepart(enemyLanding.ix, enemyLanding.iy);
        }
        enemyLanding = null;

        // notify game logic
        window.onBattleEnd(survivors);
      }
    }

    // — Rendering everything —
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    // clip to floor
    const fc = raw(GRID_W / 2, GRID_H / 2);
    const fx = fc.x - marsImg.width / 2;
    const fy = fc.y - marsImg.height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, marsImg.width, marsImg.height);
    ctx.clip();

    // floor
    ctx.drawImage(marsImg, fx, fy);

    // buildings
    buildings.forEach(({ ix, iy }) => {
      const p = raw(ix, iy), s = 0.15;
      ctx.drawImage(
        buildingImg,
        p.x - buildingImg.width / 2 * s,
        p.y - buildingImg.height * s,
        buildingImg.width * s,
        buildingImg.height * s
      );
    });

    // objects
    [[objectImg0, objects0], [objectImg1, objects1]].forEach(([img, arr]) => {
      arr.forEach(({ ix, iy }) => {
        const p = raw(ix, iy), s = 0.10;
        ctx.drawImage(
          img,
          p.x - img.width / 2 * s,
          p.y - img.height * s,
          img.width * s,
          img.height * s
        );
      });
    });

    // our ship
    if (!window.__shipInFlight && window.hasShip) {
      const p = raw(window.shipPos.ix, window.shipPos.iy), s = 0.25;
      ctx.drawImage(
        shipImg,
        p.x - shipImg.width / 2 * s,
        p.y - shipImg.height * s,
        shipImg.width * s,
        shipImg.height * s
      );
    }

    // Characters + health bars
    characters.forEach(ch => {
      // 1. Compute screen position
      const p = raw(ch.ix, ch.iy);

      // 2. Choose separate scales for mech vs. soldier
      const scaleMech = 0.10;  // original mech scale
      const scaleSoldier = 0.05;  // adjust until soldier height matches mech

      // 3. Pick the correct image and scale
      let img, s;
      if (ch.type === 'soldier') {
        // Animate walk cycle by alternating between frame 0 and 1 every 300 ms
        const frameIndex = Math.floor(now * 1000 / 300) % soldierFrames.length;
        img = soldierFrames[frameIndex];
        s = scaleSoldier;
      } else {
        img = mechImg;
        s = scaleMech;
      }

      // 4. Compute sprite height in world units (for health bar placement)
      const imgHeightWorld = img.height * s;

      // 5. Draw health bar just above sprite's head
      const barWidth = 40;
      const barHeight = 4;
      const barX = p.x - barWidth / 2;
      const barY = p.y - imgHeightWorld - 6;
      // Background (red)
      ctx.fillStyle = 'red';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      // Foreground (green), proportional to current health
      ctx.fillStyle = 'lime';
      const healthRatio = ch.health / ch.maxHealth;
      ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

      // 6. Draw the sprite itself
      ctx.save();
      // Tint enemy sprites slightly translucent
      ctx.globalAlpha = (ch.faction === 'enemy') ? 0.8 : 1;
      // Move origin to sprite's position
      ctx.translate(p.x, p.y);
      // Mirror horizontally if moving left
      if (ch.dirX < 0) ctx.scale(-1, 1);
      // Draw image centered at origin
      ctx.drawImage(
        img,
        -img.width / 2 * s,  // x offset
        -img.height * s,  // y offset
        img.width * s,      // draw width
        img.height * s       // draw height
      );
      ctx.restore();
    });

    // projectiles
    projectiles.forEach(pr => {
      // Different colors for different factions
      ctx.fillStyle = pr.faction === 'ally' ? '#0f0' : '#f00';
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.restore();
    requestAnimationFrame(draw);
  }

  draw();

  // — Disable zoom & enable panning —
  canvas.addEventListener('wheel', e => e.preventDefault());
  let dragging = false, last = { x: 0, y: 0 };
  canvas.addEventListener('mousedown', e => {
    dragging = true;
    last.x = e.clientX; last.y = e.clientY;
  });
  canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    offsetX += e.clientX - last.x;
    offsetY += e.clientY - last.y;
    last.x = e.clientX; last.y = e.clientY;
  });
  window.addEventListener('mouseup', () => dragging = false);

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      dragging = true;
      last.x = e.touches[0].clientX;
      last.y = e.touches[0].clientY;
      e.preventDefault();
    }
  });
  canvas.addEventListener('touchmove', e => {
    if (!dragging || e.touches.length !== 1) return;
    const tx = e.touches[0].clientX, ty = e.touches[0].clientY;
    offsetX += tx - last.x;
    offsetY += ty - last.y;
    last.x = tx; last.y = ty;
    e.preventDefault();
  });
  canvas.addEventListener('touchend', () => dragging = false);
}