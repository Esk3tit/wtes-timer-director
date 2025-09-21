// lib/timer-operations.ts - Shared server-side timer operations (TablesDB)
import { tables, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

// Start a timer immediately
export async function startTimerNow(name, timeInSeconds) {
  const now = Date.now();
  const endTime = now + (timeInSeconds * 1000);
  
  const timer = await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: ID.unique(),
    data: {
      name,
      timeInSeconds,
      startTime: now,
      endTime,
      remainingMs: timeInSeconds * 1000,
      status: 'active',
      paused: false
    }
  });
  
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
  
  return queueItem;
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
    
    // Start the timer
    const newTimer = await startTimerNow(nextTimer.name, nextTimer.timeInSeconds);
    
    // Remove from queue
    await tables.deleteRow({ databaseId: DATABASE_ID, tableId: QUEUE_COLLECTION, rowId: nextTimer.$id });
    
    return newTimer;
  }
  
  return null;
}

// Handle priority timer (move current to queue)
export async function handlePriorityTimer(currentTimer) {
  // Move current timer to front of queue
  await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: QUEUE_COLLECTION,
    rowId: ID.unique(),
    data: {
      name: currentTimer.name,
      timeInSeconds: Math.ceil(currentTimer.remainingMs / 1000),
      position: 0.5,
      queuedAt: Date.now()
    }
  });
  
  // Mark current timer as interrupted
  await tables.updateRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: currentTimer.$id,
    data: { status: 'interrupted' }
  });
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

// Update timer remaining time
export async function updateTimerRemainingTime(timerId, remainingMs) {
  await tables.updateRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: timerId,
    data: { remainingMs }
  });
}

// Complete timer and start next
export async function completeTimerAndStartNext(timerId) {
  // Mark timer as completed
  await tables.updateRow({
    databaseId: DATABASE_ID,
    tableId: TIMERS_COLLECTION,
    rowId: timerId,
    data: { status: 'completed', completedAt: Date.now() }
  });
  
  // Start next timer from queue
  return await startNextFromQueue();
}