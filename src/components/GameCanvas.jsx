import React, { forwardRef } from 'react';

const GameCanvas = forwardRef((props, ref) => {
  return (
    <canvas
      ref={ref}
      id="game-canvas"
      style={{
        display: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        touchAction: 'none',
        imageRendering: 'pixelated'
      }}
    />
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;