'use client';
import { TooltipProvider as Provider } from '@/contexts/TooltipContext';
import { WordTooltip } from '@/components/WordTooltip';

export default function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <WordTooltip />
    </Provider>
  );
}
