// hooks/useDelayedEvents.js - Event Sourcing: Replay events with a delay
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { client, DATABASE_ID, EVENTS_COLLECTION } from '@/lib/appwrite';
import { EventTypes } from '@/lib/event-logger';

/**
 * Hook that replays events with a configurable delay
 * This creates a "delayed mirror" of the admin panel actions
 * 
 * @param {number} delaySeconds - How many seconds to delay event replay
 * @returns {object} { state, loading, error, eventCount }
 */
export function useDelayedEvents(delaySeconds) {
  // Local state built from replaying events
  const [state, setState] = useState({
    currentTimer: null,
    queue: [],
    isTransitioning: false,
    transitionEndTime: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  
  // Refs to persist across renders
  const eventQueueRef = useRef([]); // Events waiting to be applied
  const appliedEventsRef = useRef(new Set()); // Track applied event IDs
  const lastFetchTimestampRef = useRef(0); // Track last fetched timestamp

  /**
   * Apply a single event to the local state
   */
  const applyEvent = useCallback((event) => {
    const { type, payload } = event;
    
    setState(prev => {
      switch (type) {
        case EventTypes.TIMER_START:
          return {
            ...prev,
            currentTimer: {
              $id: payload.$id,
              name: payload.name,
              timeInSeconds: payload.timeInSeconds,
              startTime: payload.startTime,
              endTime: payload.endTime,
              status: 'active',
              paused: payload.paused || false,
              pausedAt: payload.pausedAt || null
            },
            isTransitioning: false,
            transitionEndTime: null
          };
          
        case EventTypes.TIMER_PAUSE:
          if (!prev.currentTimer) return prev;
          return {
            ...prev,
            currentTimer: {
              ...prev.currentTimer,
              paused: true,
              pausedAt: payload.pausedAt
            }
          };
          
        case EventTypes.TIMER_RESUME:
          if (!prev.currentTimer) return prev;
          return {
            ...prev,
            currentTimer: {
              ...prev.currentTimer,
              paused: false,
              pausedAt: null,
              endTime: payload.newEndTime
            }
          };
          
        case EventTypes.TIMER_COMPLETE:
        case EventTypes.TIMER_SKIP:
          return {
            ...prev,
            currentTimer: null
          };
          
        case EventTypes.QUEUE_ADD:
          // Add to queue, maintaining position order
          const newQueue = [...prev.queue, {
            $id: payload.$id,
            name: payload.name,
            timeInSeconds: payload.timeInSeconds,
            position: payload.position
          }].sort((a, b) => a.position - b.position);
          
          return {
            ...prev,
            queue: newQueue
          };
          
        case EventTypes.QUEUE_REMOVE:
          return {
            ...prev,
            queue: prev.queue.filter(item => item.$id !== payload.queueItemId)
          };
          
        case EventTypes.QUEUE_CLEAR:
          return {
            ...prev,
            queue: []
          };
          
        case EventTypes.RESET_ALL:
          return {
            currentTimer: null,
            queue: [],
            isTransitioning: false,
            transitionEndTime: null
          };
          
        case EventTypes.TRANSITION_START:
          return {
            ...prev,
            isTransitioning: true,
            transitionEndTime: payload.endTime,
            // Create a pseudo-timer for the transition
            currentTimer: {
              $id: 'transition',
              name: '__TRANSITION__',
              timeInSeconds: payload.duration,
              startTime: payload.startTime,
              endTime: payload.endTime,
              status: 'active',
              paused: false,
              pausedAt: null
            }
          };
          
        case EventTypes.TRANSITION_COMPLETE:
          return {
            ...prev,
            isTransitioning: false,
            transitionEndTime: null
          };
          
        default:
          console.warn('Unknown event type:', type);
          return prev;
      }
    });
    
    setEventCount(count => count + 1);
  }, []);

  /**
   * Process matured events from the queue
   */
  const processEventQueue = useCallback(() => {
    if (delaySeconds <= 0) return; // No delay, events are applied immediately
    
    const now = Date.now();
    const cutoffTime = now - (delaySeconds * 1000);
    
    // Sort queue by timestamp to ensure correct order
    eventQueueRef.current.sort((a, b) => a.timestamp - b.timestamp);
    
    // Apply all events that have matured (passed the delay threshold)
    while (eventQueueRef.current.length > 0) {
      const nextEvent = eventQueueRef.current[0];
      
      if (nextEvent.timestamp <= cutoffTime) {
        // Event has matured - apply it
        eventQueueRef.current.shift();
        
        if (!appliedEventsRef.current.has(nextEvent.$id)) {
          appliedEventsRef.current.add(nextEvent.$id);
          applyEvent(nextEvent);
        }
      } else {
        // Next event hasn't matured yet, stop processing
        break;
      }
    }
  }, [delaySeconds, applyEvent]);

  /**
   * Fetch events from the API
   */
  const fetchEvents = useCallback(async () => {
    try {
      // Fetch events since last fetch (with buffer)
      const since = lastFetchTimestampRef.current;
      const response = await fetch(`/api/events?since=${since}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        for (const event of result.data) {
          // Track the latest timestamp we've seen
          if (event.timestamp > lastFetchTimestampRef.current) {
            lastFetchTimestampRef.current = event.timestamp;
          }
          
          // Skip already applied events
          if (appliedEventsRef.current.has(event.$id)) continue;
          
          if (delaySeconds <= 0) {
            // No delay - apply immediately
            appliedEventsRef.current.add(event.$id);
            applyEvent(event);
          } else {
            // Add to queue for delayed processing
            eventQueueRef.current.push(event);
          }
        }
        
        // Process any matured events
        processEventQueue();
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to fetch events');
    }
  }, [delaySeconds, applyEvent, processEventQueue]);

  /**
   * Initial load - fetch historical events
   */
  useEffect(() => {
    const loadInitialEvents = async () => {
      try {
        // Calculate how far back we need to fetch
        // We need events from (now - delay - buffer) to now
        const bufferTime = 5 * 60 * 1000; // 5 minute buffer
        const lookbackTime = (delaySeconds * 1000) + bufferTime;
        const since = Date.now() - lookbackTime;
        
        lastFetchTimestampRef.current = since;
        
        const response = await fetch(`/api/events?since=${since}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Add all events to the queue
          for (const event of result.data) {
            if (event.timestamp > lastFetchTimestampRef.current) {
              lastFetchTimestampRef.current = event.timestamp;
            }
            
            if (!appliedEventsRef.current.has(event.$id)) {
              eventQueueRef.current.push(event);
            }
          }
          
          // Process matured events immediately
          processEventQueue();
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to load initial events:', err);
        setError('Failed to load initial events');
      } finally {
        setLoading(false);
      }
    };

    loadInitialEvents();
  }, [delaySeconds, processEventQueue]);

  /**
   * Subscribe to new events via Appwrite realtime
   */
  useEffect(() => {
    if (!EVENTS_COLLECTION) {
      console.warn('EVENTS_COLLECTION not configured');
      return;
    }

    const subscription = `databases.${DATABASE_ID}.tables.${EVENTS_COLLECTION}.rows`;
    
    const unsubscribe = client.subscribe(subscription, (response) => {
      // Check if this is a create event
      if (response.events.some(e => e.includes('.create'))) {
        const event = response.payload;
        
        // Parse the payload
        const parsedEvent = {
          ...event,
          payload: JSON.parse(event.payload || '{}')
        };
        
        // Track timestamp
        if (parsedEvent.timestamp > lastFetchTimestampRef.current) {
          lastFetchTimestampRef.current = parsedEvent.timestamp;
        }
        
        // Skip if already applied
        if (appliedEventsRef.current.has(parsedEvent.$id)) return;
        
        if (delaySeconds <= 0) {
          // No delay - apply immediately
          appliedEventsRef.current.add(parsedEvent.$id);
          applyEvent(parsedEvent);
        } else {
          // Add to queue for delayed processing
          eventQueueRef.current.push(parsedEvent);
        }
      }
    });

    return () => unsubscribe();
  }, [delaySeconds, applyEvent]);

  /**
   * Interval to process matured events
   */
  useEffect(() => {
    if (delaySeconds <= 0) return; // No need for interval if no delay
    
    const interval = setInterval(processEventQueue, 100); // Check every 100ms
    return () => clearInterval(interval);
  }, [delaySeconds, processEventQueue]);

  /**
   * Periodic refetch to catch any missed events
   */
  useEffect(() => {
    const interval = setInterval(fetchEvents, 5000); // Refetch every 5 seconds
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return {
    state,
    loading,
    error,
    eventCount,
    // Expose delay info for UI
    delaySeconds,
    delayMs: delaySeconds * 1000
  };
}


