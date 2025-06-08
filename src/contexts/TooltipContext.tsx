import React, { createContext, useContext, useState } from 'react';

interface TooltipState {
  word: string;
  coords: { x: number; yAbove: number; yBelow: number };
  originalLang: string;
  visible: boolean;
}

interface TooltipContextValue {
  tooltip: TooltipState | null;
  showTooltip: (state: TooltipState) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextValue>({
  tooltip: null,
  showTooltip: () => {},
  hideTooltip: () => {},
});

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const showTooltip = (state: TooltipState) => setTooltip({ ...state, visible: true });
  const hideTooltip = () => setTooltip(null);

  return (
    <TooltipContext.Provider value={{ tooltip, showTooltip, hideTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltipContext = () => useContext(TooltipContext);
