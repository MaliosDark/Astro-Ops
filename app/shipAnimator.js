// app/shipAnimator.js

// simple promise-based delay
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ensure a single absolute-positioned ship <img> overlay
function getShipOverlay() {
  let el = document.getElementById('__shipOverlay');
  if (!el) {
    el = document.createElement('img');
    el.id = '__shipOverlay';
    el.src = './assets/ship.png';
    Object.assign(el.style, {
      position:      'absolute',
      width:         `${window.__iso.TILE_W * window.__iso.getScale()}px`,
      height:        'auto',
      pointerEvents: 'none',
      transform:     'translate(-50%, -50%)',
      transition:    'none',
      zIndex:        2500, // above modal (2000) but below status (3000)
    });
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Lift off: tilt and raise the ship.
 */
export async function animateShipLaunch() {
  const el   = getShipOverlay();
  const home = window.__iso.worldToScreen(5, 5);
  el.style.left       = `${home.x}px`;
  el.style.top        = `${home.y}px`;
  el.style.display    = 'block';
  el.style.transition = 'none';
  await delay(20);
  el.style.transition = 'transform 0.5s ease-in, top 0.5s ease-in';
  el.style.transform  = 'translate(-50%, -150%) rotate(-20deg)';
  window.__shipInFlight = true;
  await delay(500);
}

/**
 * Fly to a mission target (either by name or index).
 */
export async function animateRaidTo(target) {
  const el = getShipOverlay();

  // map mission keys → world coords
  const coordsMap = {
    MiningRun:    [4, 6],
    BlackMarket:  [7, 4],
    ArtifactHunt: [2, 8],
  };
  let ix, iy;
  if (typeof target === 'string' && coordsMap[target]) {
    [ix, iy] = coordsMap[target];
  } else {
    const list = Object.values(coordsMap);
    const idx  = (typeof target === 'number' ? target : 0) % list.length;
    [ix, iy]   = list[idx];
  }

  const dest = window.__iso.worldToScreen(ix, iy);
  el.style.transition = 'left 1s ease-in-out, top 1s ease-in-out, transform 1s ease-in-out';
  el.style.left       = `${dest.x}px`;
  el.style.top        = `${dest.y}px`;
  el.style.transform  = 'translate(-50%, -50%) rotate(0deg)';
  // tell canvasController not to redraw the docked ship
  window.shipPos      = { ix, iy };
  await delay(1000);
}

/**
 * Return home: tilt and fly back, then hide overlay.
 */
export async function animateShipReturn() {
  const el   = getShipOverlay();
  const home = window.__iso.worldToScreen(5, 5);

  // tilt nose down
  el.style.transition = 'transform 0.5s ease-in';
  el.style.transform  = 'translate(-50%, -50%) rotate(20deg)';
  await delay(300);

  // fly back
  el.style.transition = 'left 1s ease-in-out, top 1s ease-in-out, transform 1s ease-in-out';
  el.style.left       = `${home.x}px`;
  el.style.top        = `${home.y}px`;
  el.style.transform  = 'translate(-50%, -50%) rotate(0deg)';
  await delay(1000);

  // now hide the overlay and mark flight complete
  el.style.display       = 'none';
  window.__shipInFlight  = false;
  window.shipPos         = { ix: 5, iy: 5 };
}

/**
 * A helper to test the full travel sequence.
 */
export async function testTravel() {
  if (typeof window.closeModal === 'function') {
    window.closeModal();
  }
  await animateShipLaunch();
  await animateRaidTo(0);
  await animateShipReturn();
}
