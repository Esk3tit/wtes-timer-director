// lib/timer-operations.ts - Shared server-side timer operations (TablesDB)
import { tables, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { getTransitionDelay } from '@/lib/settings-operations';
import { 
  logTimerStart, 
  logTimerComplete, 
  logQueueAdd, 
  logQueueRemove, 
  logResetAll, 
  logTransitionStart,
  logTransitionComplete
} from '@/lib/event-logger';

// Special name for transition timers
const TRANSITION_TIMER_NAME = '__TRANSITION__';

// Start a timer immediately
export async function startTimerNow(name, timeInSeconds) {
  const now = Date.now();
  const endTime = now + (timeInSeconds * 1000);
  
  // Auto-pause Match events (blocking event until manually resumed)
  const isMatch = name === 'Match';
  
  const timer = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: ID.unique(),
    data: {
      name,
      timeInSeconds,
      startTime: now,
      endTime,
      status: 'active',
      paused: isMatch,
      pausedAt: isMatch ? now : null
    }
  });
  
  // Log event for event sourcing
  await logTimerStart(timer);
  
  return timer;
}

// Add timer to queue
export async function addToQueue(name, timeInSeconds) {
  // Get next position
  const lastInQueue = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: QUEUE_COLLECTION,
    queries: [Query.orderDesc('position'), Query.limit(1)]
  });
  
  const nextPosition = lastInQueue.rows?.length > 0 
    ? lastInQueue.rows[0].position + 1 
    : 1;

  const queueItem = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: QUEUE_COLLECTION,
    rowId: ID.unique(),
    data: {
      name,
      timeInSeconds,
      position: nextPosition,
      queuedAt: Date.now()
    }
  });
  
  // Log event for event sourcing
  await logQueueAdd(queueItem);
  
  return queueItem;
}

// Start a transition timer (internal use only)
async function startTransitionTimer(duration) {
  const now = Date.now();
  const endTime = now + (duration * 1000);
  
  const timer = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: ID.unique(),
    data: {
      name: TRANSITION_TIMER_NAME,
      timeInSeconds: duration,
      startTime: now,
      endTime,
      status: 'active',
      paused: false,
      pausedAt: null
    }
  });
  
  // Log event for event sourcing
  await logTransitionStart(duration);
  
  return timer;
}

// Start next timer from queue (SINGLE SOURCE OF TRUTH)
export async function startNextFromQueue() {
  const queue = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: QUEUE_COLLECTION,
    queries: [Query.orderAsc('position'), Query.limit(1)]
  });

  if (queue.rows?.length > 0) {
    const nextTimer = queue.rows[0];
    
    // Remove from queue first (log event)
    await tables.deleteRow({ databaseId: DATABASE_ID, tableId: QUEUE_COLLECTION, rowId: nextTimer.$id });
    await logQueueRemove(nextTimer.$id);
    
    // Start the timer (this will also log the timer start event)
    const newTimer = await startTimerNow(nextTimer.name, nextTimer.timeInSeconds);
    
    return newTimer;
  }
  
  return null;
}

// Reset all timers and queue
export async function resetAllTimers() {
  // Cancel all active timers
  const activeTimers = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    queries: [Query.equal('status', 'active')]
  });
  
  for (const timer of (activeTimers.rows || [])) {
    await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TIMERS_COLLECTION,
      rowId: timer.$id,
      data: { status: 'cancelled' }
    });
  }
  
  // Clear queue
  const queueItems = await tables.listRows({ databaseId: DATABASE_ID, tableId: QUEUE_COLLECTION });
  for (const item of (queueItems.rows || [])) {
    await tables.deleteRow({ databaseId: DATABASE_ID, tableId: QUEUE_COLLECTION, rowId: item.$id });
  }
  
  // Log event for event sourcing (single reset event covers everything)
  await logResetAll();
}

// Get current active timer
export async function getCurrentActiveTimer() {
  const activeTimers = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    queries: [Query.equal('status', 'active'), Query.limit(1)]
  });
  return (activeTimers.rows && activeTimers.rows[0]) || null;
}

// Complete timer and start next (with transition delay if configured)
export async function completeTimerAndStartNext(timerId) {
  // Get the timer being completed to check if it's a transition
  const completingTimer = await tables.getRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: timerId
  });

  // Mark timer as completed
  await tables.updateRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: timerId,
    data: { status: 'completed', completedAt: Date.now() }
  });
  
  // If the completed timer was a transition, log and start the actual next timer
  if (completingTimer.name === TRANSITION_TIMER_NAME) {
    await logTransitionComplete();
    return await startNextFromQueue();
  }
  
  // Log the timer completion event
  await logTimerComplete(timerId);
  
  // For normal timers, check if we should insert a transition delay
  const transitionDelay = await getTransitionDelay();
  
  // Check if there's something in the queue to transition to
  const queue = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: QUEUE_COLLECTION,
    queries: [Query.orderAsc('position'), Query.limit(1)]
  });
  
  const hasNextTimer = queue.rows && queue.rows.length > 0;
  
  // If transition delay is enabled and there's a next timer, start transition
  if (transitionDelay > 0 && hasNextTimer) {
    return await startTransitionTimer(transitionDelay);
  }
  
  // Otherwise, start next timer directly (or nothing if queue is empty)
  return await startNextFromQueue();
}