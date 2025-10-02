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
      const response = await fetch("/api/timer/state" , { cache: 'no-store' });
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

  // Auto-check for timer completion (for smooth countdown, derive remainingMs in components)
  useEffect(() => {
    if (!timerState?.currentTimer || timerState.currentTimer.paused) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, timerState.currentTimer.endTime - now);

      // If timer just hit 0, trigger API call to complete and start next
      if (remainingMs === 0) {
        fetchState(); // This will call the API which handles completion and starting next timer
      }
    }, 100); // Check every 100ms for completion

    return () => clearInterval(interval);
  }, [timerState?.currentTimer?.paused, timerState?.currentTimer?.$id, timerState?.currentTimer?.endTime, fetchState]);

  return { timerState, loading, error, refetch: fetchState };
};