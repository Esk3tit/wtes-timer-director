'use client';

import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/appwrite';

export const useTimerState = () => {
  const [timerState, setTimerState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial state
  const fetchState = useCallback(async () => {
    try {
      const response = await fetch('/api/timer/state');
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
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    fetchState();

    // Subscribe to timer changes
    const unsubscribeTimers = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_TIMERS_COLLECTION_ID}.documents`,
      (response) => {
        console.log('Timer update:', response.events, response.payload);

        // Refetch state when any timer document changes
        fetchState();
      }
    );

    // Subscribe to queue changes
    const unsubscribeQueue = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_QUEUE_COLLECTION_ID}.documents`,
      (response) => {
        console.log('Queue update:', response.events, response.payload);

        // Refetch state when queue changes
        fetchState();
      }
    );

    // Cleanup subscriptions
    return () => {
      unsubscribeTimers();
      unsubscribeQueue();
    };
  }, [fetchState]);

  // Auto-update remaining time for smooth countdown
  useEffect(() => {
    if (!timerState?.currentTimer || timerState.currentTimer.paused) {
      return;
    }

    const interval = setInterval(() => {
      setTimerState(prevState => {
        if (!prevState?.currentTimer || prevState.currentTimer.paused) {
          return prevState;
        }

        const now = Date.now();
        const remainingMs = Math.max(0, prevState.currentTimer.endTime - now);

        return {
          ...prevState,
          currentTimer: {
            ...prevState.currentTimer,
            remainingMs
          },
          serverTime: now
        };
      });
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [timerState?.currentTimer?.paused, timerState?.currentTimer?.$id]);

  return { timerState, loading, error, refetch: fetchState };
};