// lib/event-logger.js - Event Sourcing: Log all actions for delayed replay
import { tables, DATABASE_ID, EVENTS_COLLECTION } from '@/lib/appwrite';
import { ID } from 'appwrite';

// Event types for all possible actions
export const EventTypes = {
  // Timer events
  TIMER_START: 'TIMER_START',
  TIMER_PAUSE: 'TIMER_PAUSE',
  TIMER_RESUME: 'TIMER_RESUME',
  TIMER_COMPLETE: 'TIMER_COMPLETE',
  TIMER_SKIP: 'TIMER_SKIP',
  
  // Queue events
  QUEUE_ADD: 'QUEUE_ADD',
  QUEUE_REMOVE: 'QUEUE_REMOVE',
  QUEUE_CLEAR: 'QUEUE_CLEAR',
  
  // System events
  RESET_ALL: 'RESET_ALL',
  
  // Transition events
  TRANSITION_START: 'TRANSITION_START',
  TRANSITION_COMPLETE: 'TRANSITION_COMPLETE'
};

/**
 * Log an event to the events collection
 * @param {string} type - Event type from EventTypes
 * @param {object} payload - Event payload data
 * @returns {Promise<object>} The created event row
 */
export async function logEvent(type, payload = {}) {
  try {
    const event = await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: EVENTS_COLLECTION,
      rowId: ID.unique(),
      data: {
        type,
        payload: JSON.stringify(payload),
        timestamp: Date.now()
      }
    });
    
    console.log(`Event logged: ${type}`, payload);
    return event;
  } catch (error) {
    console.error('Failed to log event:', error);
    // Don't throw - event logging should not break the main action
    return null;
  }
}

/**
 * Helper functions for common events
 */

export async function logTimerStart(timerData) {
  return logEvent(EventTypes.TIMER_START, {
    $id: timerData.$id,
    name: timerData.name,
    timeInSeconds: timerData.timeInSeconds,
    startTime: timerData.startTime,
    endTime: timerData.endTime,
    paused: timerData.paused || false,
    pausedAt: timerData.pausedAt || null
  });
}

export async function logTimerPause(timerId, pausedAt) {
  return logEvent(EventTypes.TIMER_PAUSE, {
    timerId,
    pausedAt
  });
}

export async function logTimerResume(timerId, newEndTime) {
  return logEvent(EventTypes.TIMER_RESUME, {
    timerId,
    newEndTime,
    resumedAt: Date.now()
  });
}

export async function logTimerComplete(timerId) {
  return logEvent(EventTypes.TIMER_COMPLETE, {
    timerId,
    completedAt: Date.now()
  });
}

export async function logTimerSkip(timerId) {
  return logEvent(EventTypes.TIMER_SKIP, {
    timerId,
    skippedAt: Date.now()
  });
}

export async function logQueueAdd(queueItem) {
  return logEvent(EventTypes.QUEUE_ADD, {
    $id: queueItem.$id,
    name: queueItem.name,
    timeInSeconds: queueItem.timeInSeconds,
    position: queueItem.position
  });
}

export async function logQueueRemove(queueItemId) {
  return logEvent(EventTypes.QUEUE_REMOVE, {
    queueItemId
  });
}

export async function logQueueClear() {
  return logEvent(EventTypes.QUEUE_CLEAR, {});
}

export async function logResetAll() {
  return logEvent(EventTypes.RESET_ALL, {
    resetAt: Date.now()
  });
}

export async function logTransitionStart(duration) {
  return logEvent(EventTypes.TRANSITION_START, {
    duration,
    startTime: Date.now(),
    endTime: Date.now() + (duration * 1000)
  });
}

export async function logTransitionComplete() {
  return logEvent(EventTypes.TRANSITION_COMPLETE, {
    completedAt: Date.now()
  });
}


