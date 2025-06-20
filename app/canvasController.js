// canvasController.js

export default async function initCanvas(canvas) {
  // — Resize to fill viewport —
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // — Load assets —
  const marsImg     = new Image(); marsImg.src     = './assets/mars_floor.png';
  const shipImg     = new Image(); shipImg.src     = './assets/ship.png';
  const dogImg      = new Image(); dogImg.src      = './assets/dog.png';
  const buildingImg = new Image(); buildingImg.src = './assets/building.png';
  const objectImg0  = new Image(); objectImg0.src  = './assets/object.png';
  const objectImg1  = new Image(); objectImg1.src  = './assets/object1.png';
  const soldierImg  = new Image(); soldierImg.src  = './assets/soldier.png';
  const mechImg     = new Image(); mechImg.src     = './assets/mech.png';
  const shipFlyImg  = new Image(); shipFlyImg.src  = './assets/ship-fly.png';

  await Promise.all([
    marsImg, shipImg, dogImg, buildingImg,
    objectImg0, objectImg1, soldierImg, mechImg, shipFlyImg
  ].map(img => new Promise(r => { img.onload = r; })));

  // — Tile dimensions —
  const TILE_W = 64, TILE_H = 32;

  // — Compute grid size so the diamond covers the floor image —
  const totalCells = Math.round((2 * marsImg.width) / TILE_W);
  const GRID_W     = Math.floor(totalCells / 2);
  const GRID_H     = GRID_W;

  // — Convert grid coords to world (isometric) coords —
  function raw(ix, iy) {
    return {
      x: (ix - iy) * (TILE_W / 2),
      y: (ix + iy) * (TILE_H / 2)
    };
  }

  // — Camera state (fixed zoom) —
  const scale = 1.5;
  let offsetX = 0,
      offsetY = 0;

  // — Pan only, no zoom clamping —
  function clampOffset() {
    // no restrictions
  }

  // — Random lower-half cell —
  function randLowerCell() {
    return {
      ix: Math.floor(Math.random() * (GRID_W - 1)) + 1,
      iy: Math.floor(Math.random() * (GRID_H / 2)) + Math.ceil(GRID_H / 2)
    };
  }

  // — Place static sprites —
  const buildings = Array.from({ length: 5 }, randLowerCell);
  const objects0  = Array.from({ length: 7 }, randLowerCell);
  const objects1  = Array.from({ length: 7 }, randLowerCell);

  // — Ship & dog positions —
  const shipPos = { ix: GRID_W/2 | 0, iy: GRID_H/2 | 0 };
  const dogPos  = randLowerCell();

  // — Roaming characters with health & shooting & blocking & grid-boundaries —
  const CHAR_COUNT = 8;
  const characters = Array.from({ length: CHAR_COUNT }, () => ({
    ix: Math.random() * GRID_W,
    iy: Math.random() * GRID_H,
    dirX: Math.random() < 0.5 ? -1 : 1,
    dirY: (Math.random() - 0.5),
    type: Math.random() < 0.5 ? 'soldier' : 'mech',
    health: 100,
    maxHealth: 100,
    lastShot: 0,
    shootInterval: 1 + Math.random() * 2,
  }));
  const projectiles = [];

  // — Center camera on ship at start —
  (function centerOn(ix, iy) {
    const c = raw(ix, iy);
    offsetX = canvas.width  / 2 - c.x * scale;
    offsetY = canvas.height / 2 - c.y * scale + canvas.height * 0.30;
  })(shipPos.ix, shipPos.iy);

  let lastTime = performance.now() / 1000;

  function draw() {
    const now = performance.now() / 1000;
    const dt  = now - lastTime;
    lastTime   = now;

    // --- Update characters ---
    characters.forEach((ch, idx) => {
      const speed = 0.5;
      const nx = ch.ix + ch.dirX * dt * speed;
      const ny = ch.iy + ch.dirY * dt * speed;

      // ensure grid bounds
      const inside = nx >= 0 && nx <= GRID_W && ny >= 0 && ny <= GRID_H;

      // obstacle check
      const obstacles = [
        ...buildings, ...objects0, ...objects1, shipPos, dogPos
      ].map(o => raw(o.ix, o.iy));
      const worldNew = raw(nx, ny);
      const blocked  = obstacles.some(o => {
        const dx = worldNew.x - o.x, dy = worldNew.y - o.y;
        return Math.hypot(dx, dy) < TILE_W * 0.5;
      });

      if (!inside || blocked) {
        ch.dirX *= -1;
        ch.dirY = (Math.random() - 0.5) || ch.dirY;
      } else {
        ch.ix = nx;
        ch.iy = ny;
      }

      // shooting
      if (now - ch.lastShot >= ch.shootInterval) {
        ch.lastShot = now;
        ch.shootInterval = 1 + Math.random() * 2;
        const targets = characters.filter((_,i) => i !== idx && _.health > 0);
        if (targets.length) {
          const tgt  = targets[Math.floor(Math.random() * targets.length)];
          const from = raw(ch.ix, ch.iy), to = raw(tgt.ix, tgt.iy);
          const dx   = to.x - from.x, dy = to.y - from.y;
          const mag  = Math.hypot(dx, dy) || 1;
          projectiles.push({
            x: from.x, y: from.y,
            vx: dx/mag * 200, vy: dy/mag * 200,
            damage: (ch.type === 'soldier' ? 20 : 35),
            targetIdx: characters.indexOf(tgt)
          });
        }
      }
    });

    // --- Update projectiles ---
    projectiles.forEach((pr, i) => {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      const tgt = characters[pr.targetIdx];
      if (tgt?.health > 0) {
        const pos = raw(tgt.ix, tgt.iy);
        if (Math.hypot(pr.x - pos.x, pr.y - pos.y) < 10) {
          tgt.health -= pr.damage;
          projectiles.splice(i, 1);
          if (tgt.health <= 0) {
            tgt.ix     = Math.random() * GRID_W;
            tgt.iy     = GRID_H - Math.random() * (GRID_H/2);
            tgt.health = tgt.maxHealth;
          }
        }
      }
      if (
        pr.x * scale + offsetX < -50 ||
        pr.x * scale + offsetX > canvas.width + 50 ||
        pr.y * scale + offsetY < -50 ||
        pr.y * scale + offsetY > canvas.height + 50
      ) {
        projectiles.splice(i, 1);
      }
    });

    // --- Render ---
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,offsetX,offsetY);

    // compute floor center
    const fc = raw(GRID_W/2, GRID_H/2);
    const fx = fc.x - marsImg.width/2;
    const fy = fc.y - marsImg.height/2;

    // clip to mars image rectangle
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, marsImg.width, marsImg.height);
    ctx.clip();

    // 1) Floor
    ctx.drawImage(marsImg, fx, fy);

    // 2) Buildings
    buildings.forEach(({ix,iy}) => {
      const p = raw(ix,iy), s = 0.15;
      ctx.drawImage(buildingImg,
        p.x - buildingImg.width/2*s,
        p.y - buildingImg.height*s,
        buildingImg.width*s,
        buildingImg.height*s
      );
    });

    // 3) Objects
    [[objectImg0, objects0],[objectImg1, objects1]].forEach(([img,arr]) => {
      arr.forEach(({ix,iy}) => {
        const p = raw(ix,iy), s = 0.10;
        ctx.drawImage(img,
          p.x - img.width/2*s,
          p.y - img.height*s,
          img.width*s,
          img.height*s
        );
      });
    });

    // 4) Dog
    {
      const p=raw(dogPos.ix,dogPos.iy), s=0.10;
      ctx.drawImage(dogImg,
        p.x - dogImg.width/2*s,
        p.y - dogImg.height*s,
        dogImg.width*s,
        dogImg.height*s
      );
    }

    // 5) Ship
    {
      const p=raw(shipPos.ix,shipPos.iy), s=0.25;
      ctx.drawImage(shipImg,
        p.x - shipImg.width/2*s,
        p.y - shipImg.height*s,
        shipImg.width*s,
        shipImg.height*s
      );
    }

    // 6) Characters & health bars
    characters.forEach(ch => {
      const p=raw(ch.ix,ch.iy), s=0.10;
      // health bar
      const barW = 40, barH = 4;
      const hx = p.x - barW/2, hy = p.y - 18;
      ctx.fillStyle = 'red';  ctx.fillRect(hx, hy, barW, barH);
      ctx.fillStyle = 'lime';
      ctx.fillRect(hx, hy, barW * (ch.health/ch.maxHealth), barH);
      // sprite
      const img = (ch.type==='soldier'? soldierImg : mechImg);
      ctx.save();
      ctx.translate(p.x, p.y);
      if (ch.dirX < 0) ctx.scale(-1,1);
      ctx.drawImage(img,
        -img.width/2*s, -img.height*s,
        img.width*s, img.height*s
      );
      ctx.restore();
    });

    // 7) Projectiles
    projectiles.forEach(pr => {
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, 3, 0, 2*Math.PI);
      ctx.fill();
    });

    // restore to disable clipping
    ctx.restore();

    requestAnimationFrame(draw);
  }

  draw();

  // — Disable zoom — fixed scale —
  canvas.addEventListener('wheel', e => e.preventDefault());

  // — Pan with drag/touch over full map —
  let dragging = false, last = { x:0, y:0 };
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
