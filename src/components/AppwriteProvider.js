// components/AppwriteProvider.tsx - Context provider for real-time updates
'use client';

import React, { createContext, useContext } from 'react';
import { useTimerState, useTimerActions } from '@/hooks/useRealtime';

const TimerContext = createContext(undefined);

export const TimerProvider = ({ children }) => {
  const { timerState, loading, error, refetch } = useTimerState();
  const {
    startTimer,
    controlTimer,
    loading: actionsLoading,
    error: actionsError,
    clearError
  } = useTimerActions();

  return (
    <TimerContext.Provider value={{
      timerState,
      loading,
      error,
      startTimer,
      controlTimer,
      actionsLoading,
      actionsError,
      clearError,
      refetch
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};