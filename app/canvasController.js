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

  await Promise.all([
    new Promise(r => marsImg.onload     = r),
    new Promise(r => shipImg.onload     = r),
    new Promise(r => dogImg.onload      = r),
    new Promise(r => buildingImg.onload = r),
    new Promise(r => objectImg0.onload  = r),
    new Promise(r => objectImg1.onload  = r),
  ]);

  // — Isometric tile size —
  const TILE_W = 64, TILE_H = 32;

  // — Derive grid dimensions so the diamond fits the floor image —
  const totalCells = Math.round((2 * marsImg.width) / TILE_W);
  const GRID_W     = Math.floor(totalCells / 2);
  const GRID_H     = GRID_W;

  // — Raw world-space conversion —
  function raw(ix, iy) {
    return {
      x: (ix - iy) * (TILE_W / 2),
      y: (ix + iy) * (TILE_H / 2)
    };
  }

  // — Compute world bounds (for clamping) —
  const corners = [
    raw(0,       0      ),
    raw(GRID_W,  0      ),
    raw(GRID_W,  GRID_H ),
    raw(0,       GRID_H ),
  ];
  const xs = corners.map(c => c.x), ys = corners.map(c => c.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const maxX = Math.max(...xs), maxY = Math.max(...ys);

  // — Camera state: pan & zoom —
  let scale   = 1.5;      // start fully zoomed-in
  let offsetX = 0;
  let offsetY = 0;

  // — Only allow one zoom-out —
  let zoomedOutUsed = false;

  // — Clamp pan so floor always covers viewport, with extra vertical freedom —
  function clampOffset() {
    const minOffsetX = canvas.width  - maxX * scale;
    const maxOffsetX = -minX * scale;
    offsetX = Math.min(maxOffsetX, Math.max(minOffsetX, offsetX));

    // vertical: allow grid to rise up to 30% above center
    const topLimit    = canvas.height * 0.3;
    const bottomLimit = canvas.height - maxY * scale;
    offsetY = Math.min(topLimit, Math.max(bottomLimit, offsetY));
  }

  // — Helper to pick a random cell in the lower half —
  function randLowerCell() {
    return {
      ix: Math.floor(Math.random() * (GRID_W - 1)) + 1,
      iy: Math.floor(Math.random() * (GRID_H / 2)) + Math.ceil(GRID_H / 2)
    };
  }

  // — Scatter sprites —
  const buildings = Array.from({ length: 5 }, randLowerCell);
  const objects0  = Array.from({ length: 7 }, randLowerCell);
  const objects1  = Array.from({ length: 7 }, randLowerCell);

  // — Ship fixed at center of grid —
  const shipPos = {
    ix: Math.floor(GRID_W / 2),
    iy: Math.floor(GRID_H / 2)
  };
  const dogPos = randLowerCell();

  // — Center camera on ship, then drop grid 30% down —
  (function centerOn(ix, iy) {
    const c = raw(ix, iy);
    offsetX = canvas.width  / 2 - c.x * scale;
    offsetY = canvas.height / 2 - c.y * scale + canvas.height * 0.30;
    clampOffset();
  })(shipPos.ix, shipPos.iy);

  // — Draw loop —
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.setTransform(scale,0,0,scale,offsetX,offsetY);

    // 1) **Floor** — draw the diamond centered under the grid
    const centerCell = raw(GRID_W/2, GRID_H/2);
    const floorX = centerCell.x - marsImg.width/2;
    const floorY = centerCell.y - marsImg.height/2;
    ctx.drawImage(marsImg, floorX, floorY);

    // 2) Buildings
    buildings.forEach(({ix,iy}) => {
      const p = raw(ix,iy), s = 0.15;
      ctx.drawImage(
        buildingImg,
        p.x - buildingImg.width/2*s,
        p.y - buildingImg.height*s,
        buildingImg.width  * s,
        buildingImg.height * s
      );
    });

    // 3) Object0
    objects0.forEach(({ix,iy}) => {
      const p = raw(ix,iy), s = 0.10;
      ctx.drawImage(
        objectImg0,
        p.x - objectImg0.width/2*s,
        p.y - objectImg0.height*s,
        objectImg0.width  * s,
        objectImg0.height * s
      );
    });

    // 4) Object1
    objects1.forEach(({ix,iy}) => {
      const p = raw(ix,iy), s = 0.10;
      ctx.drawImage(
        objectImg1,
        p.x - objectImg1.width/2*s,
        p.y - objectImg1.height*s,
        objectImg1.width  * s,
        objectImg1.height * s
      );
    });

    // 5) Dog
    {
      const p = raw(dogPos.ix,dogPos.iy), s = 0.10;
      ctx.drawImage(
        dogImg,
        p.x - dogImg.width/2*s,
        p.y - dogImg.height*s,
        dogImg.width  * s,
        dogImg.height * s
      );
    }

    // 6) Ship
    {
      const p = raw(shipPos.ix,shipPos.iy), s = 0.25;
      ctx.drawImage(
        shipImg,
        p.x - shipImg.width/2*s,
        p.y - shipImg.height*s,
        shipImg.width  * s,
        shipImg.height * s
      );
    }

    requestAnimationFrame(draw);
  }
  draw();

  // — Zoom handler (only one zoom-out allowed) —
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomIn  = e.deltaY < 0;
    const zoomOut = !zoomIn;
    if (zoomOut && zoomedOutUsed) return;
    if (zoomOut) zoomedOutUsed = true;

    const factor = zoomIn ? 1.1 : 0.9;
    scale = Math.max(0.8, Math.min(1.5, scale * factor));

    // Re-center on ship
    const c = raw(shipPos.ix, shipPos.iy);
    offsetX = canvas.width  / 2 - c.x * scale;
    offsetY = canvas.height / 2 - c.y * scale + canvas.height * 0.30;
    clampOffset();
  });

  // — Pan with drag (mouse or touch) —
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
    clampOffset();
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
    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    offsetX += tx - last.x;
    offsetY += ty - last.y;
    last.x = tx; last.y = ty;
    clampOffset();
    e.preventDefault();
  });
  canvas.addEventListener('touchend', () => {
    dragging = false;
  });
}
