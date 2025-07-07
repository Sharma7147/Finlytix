import React from 'react';

export function ScrollArea({ children, className = "", style = {} }) {
  return (
    <div
      className={`overflow-y-auto max-h-[500px] p-2 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
