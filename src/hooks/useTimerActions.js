'use client';

import { useState, useCallback } from 'react';

export const useTimerActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (
    endpoint,
    method = 'POST',
    body
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/timer/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startTimer = useCallback(async (
    name,
    timeInSeconds,
    priority = false
  ) => {
    return apiCall('start', 'POST', { name, timeInSeconds, priority });
  }, [apiCall]);

  const controlTimer = useCallback(async (
    action
  ) => {
    return apiCall('control', 'POST', { action });
  }, [apiCall]);

  return {
    startTimer,
    controlTimer,
    loading,
    error,
    clearError: () => setError(null)
  };
};