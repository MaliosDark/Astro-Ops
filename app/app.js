// app/app.js
import initCanvas        from './canvasController.js';
import { setupHUD }      from './hud.js';
import { setupModal }    from './modal.js';
import { setupGame }     from './gameLogic.js';

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

window.addEventListener('load', async () => {
  const canvas = document.getElementById('game-canvas');
  await initCanvas(canvas);

  setupHUD();
  setupModal();
  setupGame(canvas);

});
