// src/utils/raidAnimations.js
// Animaciones especiales para raids con transiciones cinematográficas

import { animateShipLaunch, animateShipReturn } from './shipAnimator.js';
import websocketService from '../services/websocketService.js';
import websocketService from '../services/websocketService.js';
import ENV from '../config/environment.js';

/**
 * Crear overlay de transición para raids
 */
function createTransitionOverlay() {
  let overlay = document.getElementById('__raidTransitionOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = '__raidTransitionOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #000;
      opacity: 0;
      z-index: 9999;
      pointer-events: none;
      transition: opacity 0.8s ease-in-out;
      display: none;
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

/**
 * Crear overlay de texto para mostrar información del raid
 */
function createRaidTextOverlay() {
  let textOverlay = document.getElementById('__raidTextOverlay');
  if (!textOverlay) {
    textOverlay = document.createElement('div');
    textOverlay.id = '__raidTextOverlay';
    textOverlay.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #0cf;
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      text-align: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
      pointer-events: none;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    document.body.appendChild(textOverlay);
  }
  return textOverlay;
}

/**
 * Animar nave volando fuera del mapa
 */
async function animateShipFlyOffMap() {
  const shipOverlay = document.getElementById('__shipOverlay');
  if (!shipOverlay) return;

  // Hacer que la nave vuele hacia la esquina superior derecha
  const targetX = window.innerWidth + 200;
  const targetY = -200;

  shipOverlay.style.transition = 'left 2s ease-in, top 2s ease-in, transform 2s ease-in';
  shipOverlay.style.left = `${targetX}px`;
  shipOverlay.style.top = `${targetY}px`;
  shipOverlay.style.transform = 'translate(-50%, -50%) rotate(-45deg) scale(0.5)';

  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Animar nave llegando desde fuera del mapa
 */
async function animateShipArriveFromOffMap() {
  const shipOverlay = document.getElementById('__shipOverlay');
  if (!shipOverlay) return;

  // Posición inicial fuera del mapa (esquina superior izquierda)
  const startX = -200;
  const startY = -200;
  
  // Posición final en el centro del mapa
  const endX = window.innerWidth / 2;
  const endY = window.innerHeight / 2;

  // Configurar posición inicial
  shipOverlay.style.transition = 'none';
  shipOverlay.style.left = `${startX}px`;
  shipOverlay.style.top = `${startY}px`;
  shipOverlay.style.transform = 'translate(-50%, -50%) rotate(45deg) scale(0.5)';
  shipOverlay.style.display = 'block';

  await new Promise(resolve => setTimeout(resolve, 100));

  // Animar llegada
  shipOverlay.style.transition = 'left 2s ease-out, top 2s ease-out, transform 2s ease-out';
  shipOverlay.style.left = `${endX}px`;
  shipOverlay.style.top = `${endY}px`;
  shipOverlay.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(1)';

  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Mostrar texto de raid con efectos
 */
async function showRaidText(text, duration = 2000) {
  const textOverlay = createRaidTextOverlay();
  
  textOverlay.textContent = text;
  textOverlay.style.opacity = '1';
  
  await new Promise(resolve => setTimeout(resolve, duration));
  
  textOverlay.style.opacity = '0';
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Fade in/out del overlay de transición
 */
async function fadeTransition(fadeIn = true, duration = 800) {
  const overlay = createTransitionOverlay();
  
  if (fadeIn) {
    overlay.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 50));
    overlay.style.opacity = '1';
  } else {
    overlay.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, duration));
    overlay.style.display = 'none';
  }
  
  await new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * Simular batalla de raid con efectos visuales
 */
async function simulateRaidBattle(targetInfo = {}) {
  const battleTexts = [
    'ENGAGING ENEMY FORCES...',
    `ATTACKING ${targetInfo.type || 'TARGET'} MISSION...`,
    `ATTACKING ${targetInfo.type || 'TARGET'} MISSION...`,
    'BATTLE IN PROGRESS...',
    'OVERRIDING SECURITY SYSTEMS...',
    'OVERRIDING SECURITY SYSTEMS...',
    'SECURING TARGET...',
    'EXTRACTING RESOURCES...'
  ];

  for (const text of battleTexts) {
    await showRaidText(text, 1500);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Crear transición completa de raid con todas las animaciones
 */
export async function createRaidTransition(raidLogicCallback) {
  try {
    if (ENV.DEBUG_MODE) {
      console.log('🚀 Starting raid transition sequence');
    }

    // 1. Lanzar nave desde base
    if (window.AstroUI) {
      window.AstroUI.setStatus('Launching raid mission...');
    }
    
    await animateShipLaunch();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Nave vuela fuera del mapa
    if (window.AstroUI) {
      window.AstroUI.setStatus('Traveling to target location...');
    }
    
    await animateShipFlyOffMap();

    // 3. Fade to black
    await fadeTransition(true);
    
    // 4. Mostrar texto de ubicación
    await showRaidText('ARRIVING AT TARGET LOCATION', 2000);

    // 5. Nave llega desde fuera del mapa (nuevo escenario)
    await animateShipArriveFromOffMap();

    // 6. Fade out para mostrar el "nuevo" escenario
    await fadeTransition(false);

    // 7. Mostrar texto de inicio de raid
    if (window.AstroUI) {
      window.AstroUI.setStatus('Initiating raid sequence...');
    }
    
    await showRaidText('RAID INITIATED', 1500);

    // 8. Simular batalla
    await simulateRaidBattle();

    // 8.5. Notify other players of the raid in progress
    websocketService.send('raid_in_progress', {
      timestamp: Date.now(),
      status: 'extracting'
    });
    // 8.5. Notify other players of the raid in progress
    websocketService.send('raid_in_progress', {
      timestamp: Date.now(),
      status: 'extracting'
    });
    // 9. Ejecutar lógica del raid (llamada al servidor)
    let raidResult;
    try {
      raidResult = await raidLogicCallback();
      await showRaidText('RAID SUCCESSFUL!', 2000);
    } catch (error) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Raid logic failed:', error);
      }
      await showRaidText('RAID FAILED!', 2000);
      // Don't throw error here - we still need to animate return
      raidResult = { error: error.message };
    }

    // 10. Nave vuela fuera del mapa de vuelta
    if (window.AstroUI) {
      window.AstroUI.setStatus('Returning to base...');
    }
    
    await animateShipFlyOffMap();

    // 11. Fade to black para transición de vuelta
    await fadeTransition(true);
    
    await showRaidText('RETURNING TO BASE', 2000);

    // 12. Fade out para mostrar base original
    await fadeTransition(false);

    // 13. Animar regreso a base
    await animateShipReturn();

    if (ENV.DEBUG_MODE) {
      console.log('✅ Raid transition sequence completed');
    }

    // If there was an error in the raid logic, throw it now after animations are complete
    if (raidResult && raidResult.error) {
      throw new Error(raidResult.error);
    }

    return raidResult;
  } catch (error) {
    if (ENV.DEBUG_MODE) {
      console.error('❌ Raid transition error:', error);
    }
    
    // ALWAYS ensure ship returns home, even on error
    try {
      // Clean up any overlays
      await fadeTransition(false, 400);
      
      // Make sure ship returns
      if (window.__shipInFlight) {
        await animateShipReturn();
      }
    } catch (returnError) {
      if (ENV.DEBUG_MODE) {
        console.error('❌ Error during return animation:', returnError);
      }
      // Force ship to return to base position
      window.__shipInFlight = false;
      if (window.shipPos) {
        window.shipPos = { ix: 5, iy: 5 };
      }
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Limpiar overlays de transición
 */
export function cleanupRaidTransition() {
  const overlay = document.getElementById('__raidTransitionOverlay');
  const textOverlay = document.getElementById('__raidTextOverlay');
  
  if (overlay) {
    overlay.remove();
  }
  
  if (textOverlay) {
    textOverlay.remove();
  }
}