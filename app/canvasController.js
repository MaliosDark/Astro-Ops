// canvasController.js

export default async function initCanvas(canvas) {
  // — Make canvas fill the viewport and handle mobile resize —
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // — Get 2D context —
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // — Load all assets once —
  const tilesImg = new Image();
  tilesImg.src = './assets/tiles.png';   // 2×2 floor sheet
  await new Promise(res => tilesImg.onload = res);

  const shipImg = new Image();
  shipImg.src = './assets/ship.png';
  await new Promise(res => shipImg.onload = res);

  const buildingImg = new Image();
  buildingImg.src = './assets/building.png';
  await new Promise(res => buildingImg.onload = res);

  const objectImg0 = new Image();
  objectImg0.src = './assets/object.png';
  await new Promise(res => objectImg0.onload = res);

  const objectImg1 = new Image();
  objectImg1.src = './assets/object1.png';
  await new Promise(res => objectImg1.onload = res);

  // — Sprite-sheet dimensions —
  const SHEET_COLS = 2;
  const SHEET_ROWS = 2;
  const TILE_W = tilesImg.width  / SHEET_COLS;
  const TILE_H = tilesImg.height / SHEET_ROWS;

  // — Grid size —
  const GRID_W = 10;
  const GRID_H = 10;

  // — Compute map pixel size (diamond bounds) —
  const mapPixelW = (GRID_W + GRID_H) * (TILE_W / 2);
  const mapPixelH = (GRID_W + GRID_H) * (TILE_H / 2);

  // — Initial camera (pan & zoom) —
  let scale = Math.min(
    canvas.width  / (mapPixelW * 1.1),
    canvas.height / (mapPixelH * 1.1)
  );
  scale = Math.max(0.3, Math.min(scale, 1.5));

  // — Helper: world-to-screen conversion —
  function worldToScreen(ix, iy, sc, ox, oy) {
    const x = (ix - iy) * (TILE_W / 2);
    const y = (ix + iy) * (TILE_H / 2);
    return { x: x * sc + ox, y: y * sc + oy };
  }

  // — Expose iso-utils & ship state BEFORE draw() —
  window.shipPos = { ix: 5, iy: 5 };
  window.__shipInFlight = false;
  // offsetX/Y will be set below, so __iso.getOffset reads live values
  window.__iso = {
    worldToScreen: (ix, iy) => worldToScreen(ix, iy, scale, offsetX, offsetY),
    getScale:      ()   => scale,
    getOffset:     ()   => ({ x: offsetX, y: offsetY }),
    TILE_W,
    TILE_H
  };

  // — Center map on tile (5,5) initially —
  const centerScreen = { x: canvas.width / 2, y: canvas.height / 2 };
  const shipWorld    = worldToScreen(5, 5, scale, 0, 0);
  let offsetX = centerScreen.x - shipWorld.x;
  let offsetY = centerScreen.y - shipWorld.y;

  // — Touch handlers: 1-finger pan & 2-finger pinch-zoom —
  let lastTouch = [];
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    lastTouch = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));

    if (touches.length === 1 && lastTouch.length === 1) {
      offsetX += touches[0].x - lastTouch[0].x;
      offsetY += touches[0].y - lastTouch[0].y;
    } else if (touches.length === 2 && lastTouch.length === 2) {
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const lastDist = dist(lastTouch[0], lastTouch[1]);
      const newDist  = dist(touches[0], touches[1]);
      const cx = (touches[0].x + touches[1].x) / 2;
      const cy = (touches[0].y + touches[1].y) / 2;

      offsetX = (offsetX - cx) * (newDist / lastDist) + cx;
      offsetY = (offsetY - cy) * (newDist / lastDist) + cy;
      scale  *= newDist / lastDist;
      scale = Math.max(0.3, Math.min(scale, 2.5));
    }

    lastTouch = touches;
  });
  canvas.addEventListener('touchend', e => {
    if (e.touches.length === 0) lastTouch = [];
  });

  // — Starfield background setup —
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5
  }));

  // — Sample object positions on the grid —
  const buildings = [{ ix:1, iy:2 },{ ix:6, iy:1 }];
  const objects0  = [{ ix:4, iy:6 },{ ix:5, iy:2 }];
  const objects1  = [{ ix:7, iy:4 },{ ix:2, iy:8 }];

  // — Main render loop —
  function draw() {
    // 1) Starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 2) Floor tiles
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const p = worldToScreen(x, y, scale, offsetX, offsetY);
        const variant = (x + y) % (SHEET_COLS * SHEET_ROWS);
        const srcCol  = variant % SHEET_COLS;
        const srcRow  = Math.floor(variant / SHEET_COLS);

        ctx.drawImage(
          tilesImg,
          srcCol * TILE_W, srcRow * TILE_H,
          TILE_W, TILE_H,
          p.x - (TILE_W/2) * scale,
          p.y - (TILE_H/2) * scale,
          TILE_W * scale,
          TILE_H * scale
        );
      }
    }

    // 3) Buildings
    buildings.forEach(({ ix, iy }) => {
      const p  = worldToScreen(ix, iy, scale, offsetX, offsetY);
      const bs = 0.8 * scale;
      ctx.drawImage(
        buildingImg,
        0,0, buildingImg.width, buildingImg.height,
        p.x - (buildingImg.width/2)*bs,
        p.y - buildingImg.height*bs,
        buildingImg.width*bs,
        buildingImg.height*bs
      );
    });

    // 4) Objects set 0
    objects0.forEach(({ ix, iy }) => {
      const p  = worldToScreen(ix, iy, scale, offsetX, offsetY);
      const os = 0.6 * scale;
      ctx.drawImage(
        objectImg0,
        0,0, objectImg0.width, objectImg0.height,
        p.x - (objectImg0.width/2)*os,
        p.y - objectImg0.height*os,
        objectImg0.width*os,
        objectImg0.height*os
      );
    });

    // 5) Objects set 1
    objects1.forEach(({ ix, iy }) => {
      const p  = worldToScreen(ix, iy, scale, offsetX, offsetY);
      const os = 0.6 * scale;
      ctx.drawImage(
        objectImg1,
        0,0, objectImg1.width, objectImg1.height,
        p.x - (objectImg1.width/2)*os,
        p.y - objectImg1.height*os,
        objectImg1.width*os,
        objectImg1.height*os
      );
    });

    // 6) Ship at dynamic position
    if (!window.__shipInFlight) {
      const shipScale = 0.7 * scale;
      const { ix, iy } = window.shipPos;
      const shipP = worldToScreen(ix, iy, scale, offsetX, offsetY);
      ctx.drawImage(
        shipImg,
        0,0, shipImg.width, shipImg.height,
        shipP.x - (shipImg.width/2)*shipScale,
        shipP.y - shipImg.height*shipScale,
        shipImg.width*shipScale,
        shipImg.height*shipScale
      );
    }

    requestAnimationFrame(draw);
  }
  draw();

  // — Desktop input handlers —

  // Wheel zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const f = e.deltaY > 0 ? 0.85 : 1.15;
    scale = Math.max(0.3, Math.min(2.5, scale * f));
  });

  // Mouse pan
  let dragging = false;
  let lastMouse = { x:0, y:0 };
  canvas.addEventListener('mousedown', e => {
    dragging = true;
    lastMouse.x = e.clientX; lastMouse.y = e.clientY;
  });
  window.addEventListener('mousemove', e => {
    if (dragging) {
      offsetX += e.clientX - lastMouse.x;
      offsetY += e.clientY - lastMouse.y;
      lastMouse.x = e.clientX; lastMouse.y = e.clientY;
    }
  });
  window.addEventListener('mouseup', () => dragging = false);

  // — Expose for external use —
  window.canvasCtx     = ctx;
  window.worldToScreen = worldToScreen;
  window.shipImg       = shipImg;
  window.shipBaseScale = 0.7 * scale;
}
