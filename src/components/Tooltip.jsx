import React from 'react';

const Tooltip = ({ tooltip }) => {
  if (!tooltip.visible) return null;

  return (
    <div 
      className="tooltip"
      style={{
        visibility: 'visible',
        top: tooltip.y,
        left: tooltip.x
      }}
    >
      {tooltip.text}
    </div>
  );
};

export default Tooltip;