'use client';

import { TimerProvider } from '@/components/AppwriteProvider';
import { TimerStateProvider } from '@/hooks/useRealtime';

export function Providers({ children }) {
  return (
    <TimerStateProvider>
      <TimerProvider>
        {children}
      </TimerProvider>
    </TimerStateProvider>
  );
}

