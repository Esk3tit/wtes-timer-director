'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { client } from '@/lib/appwrite';

// Create context for timer state
const TimerStateContext = createContext(null);

// Provider component - SINGLE source of truth for real-time timer state
// Note: For delayed timeline view, use useDelayedEvents hook instead
export const TimerStateProvider = ({ children }) => {
  const [timerState, setTimerState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inflightRequest = useRef(false); // Prevent duplicate fetch requests
  const completingTimerRef = useRef(null); // Track which timer we're completing

  // Fetch state (read-only, no side effects)
  const fetchState = useCallback(async () => {
    if (inflightRequest.current) {
      return;
    }

    inflightRequest.current = true;
    
    try {
      const response = await fetch("/api/timer/state", { cache: 'no-store' });
      const result = await response.json();

      if (result.success && result.data) {
        setTimerState(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch timer state');
      }
    } catch (err) {
      setError('Network error while fetching timer state');
      console.error('Fetch state error:', err);
    } finally {
      setLoading(false);
      inflightRequest.current = false;
    }
  }, []);

  // Complete an expired timer (separate from fetching state)
  const completeTimer = useCallback(async (timerId) => {
    // Prevent duplicate completion requests for the same timer
    if (completingTimerRef.current === timerId) {
      return;
    }
    
    completingTimerRef.current = timerId;
    
    try {
      await fetch("/api/timer/control", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', timerId })
      });
      // State will be updated via realtime subscription
    } catch (err) {
      console.error('Complete timer error:', err);
    } finally {
      // Reset after a short delay to allow for state update
      setTimeout(() => {
        if (completingTimerRef.current === timerId) {
          completingTimerRef.current = null;
        }
      }, 1000);
    }
  }, []);

  // Set up real-time subscriptions (SINGLE instance)
  useEffect(() => {
    fetchState();

    // Debounced refetch to avoid request storms
    let debounceId = null;
    const triggerRefetch = () => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        fetchState();
      }, 150);
    };

    // Subscribe to timer changes
    const unsubscribeTimers = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.tables.${process.env.NEXT_PUBLIC_APPWRITE_TIMERS_COLLECTION_ID}.rows`,
      (response) => {
        console.log('Timer update:', response.events, response.payload);
        triggerRefetch();
      }
    );

    // Subscribe to queue changes
    const unsubscribeQueue = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.tables.${process.env.NEXT_PUBLIC_APPWRITE_QUEUE_COLLECTION_ID}.rows`,
      (response) => {
        console.log('Queue update:', response.events, response.payload);
        triggerRefetch();
      }
    );

    // Cleanup subscriptions
    return () => {
      if (debounceId) clearTimeout(debounceId);
      unsubscribeTimers();
      unsubscribeQueue();
    };
  }, [fetchState]);

  // Auto-check for timer completion (SINGLE interval for all components)
  useEffect(() => {
    if (!timerState?.currentTimer || timerState.currentTimer.paused) {
      return;
    }

    const timerId = timerState.currentTimer.$id;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, timerState.currentTimer.endTime - now);

      // If timer just hit 0, call complete endpoint
      if (remainingMs === 0) {
        completeTimer(timerId);
      }
    }, 100); // Check every 100ms for completion

    return () => clearInterval(interval);
  }, [timerState?.currentTimer?.paused, timerState?.currentTimer?.$id, timerState?.currentTimer?.endTime, completeTimer]);

  const value = {
    timerState,
    loading,
    error,
    refetch: fetchState
  };

  return (
    <TimerStateContext.Provider value={value}>
      {children}
    </TimerStateContext.Provider>
  );
};

// Hook to consume timer state (components use this instead of creating their own state)
export const useTimerState = () => {
  const context = useContext(TimerStateContext);
  
  if (!context) {
    throw new Error('useTimerState must be used within TimerStateProvider');
  }
  
  return context;
};