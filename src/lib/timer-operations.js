// lib/timer-operations.ts - Shared server-side timer operations
import { databases, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

// Start a timer immediately
export async function startTimerNow(name, timeInSeconds) {
  const now = Date.now();
  const endTime = now + (timeInSeconds * 1000);
  
  const timer = await databases.createDocument(
    DATABASE_ID,
    TIMERS_COLLECTION,
    ID.unique(),
    {
      name,
      timeInSeconds,
      startTime: now,
      endTime,
      remainingMs: timeInSeconds * 1000,
      status: 'active',
      paused: false
    }
  );
  
  return timer;
}

// Add timer to queue
export async function addToQueue(name, timeInSeconds) {
  // Get next position
  const lastInQueue = await databases.listDocuments(
    DATABASE_ID,
    QUEUE_COLLECTION,
    [Query.orderDesc('position'), Query.limit(1)]
  );
  
  const nextPosition = lastInQueue.documents.length > 0 
    ? lastInQueue.documents[0].position + 1 
    : 1;

  const queueItem = await databases.createDocument(
    DATABASE_ID,
    QUEUE_COLLECTION,
    ID.unique(),
    {
      name,
      timeInSeconds,
      position: nextPosition,
      queuedAt: Date.now()
    }
  );
  
  return queueItem;
}

// Start next timer from queue (SINGLE SOURCE OF TRUTH)
export async function startNextFromQueue() {
  const queue = await databases.listDocuments(
    DATABASE_ID,
    QUEUE_COLLECTION,
    [Query.orderAsc('position'), Query.limit(1)]
  );

  if (queue.documents.length > 0) {
    const nextTimer = queue.documents[0];
    
    // Start the timer
    const newTimer = await startTimerNow(nextTimer.name, nextTimer.timeInSeconds);
    
    // Remove from queue
    await databases.deleteDocument(DATABASE_ID, QUEUE_COLLECTION, nextTimer.$id);
    
    return newTimer;
  }
  
  return null;
}

// Handle priority timer (move current to queue)
export async function handlePriorityTimer(currentTimer) {
  // Move current timer to front of queue
  await databases.createDocument(
    DATABASE_ID,
    QUEUE_COLLECTION,
    ID.unique(),
    {
      name: currentTimer.name,
      timeInSeconds: Math.ceil(currentTimer.remainingMs / 1000),
      position: 0.5, // Insert at front
      queuedAt: Date.now()
    }
  );
  
  // Mark current timer as interrupted
  await databases.updateDocument(
    DATABASE_ID,
    TIMERS_COLLECTION,
    currentTimer.$id,
    { status: 'interrupted' }
  );
}

// Reset all timers and queue
export async function resetAllTimers() {
  // Cancel all active timers
  const activeTimers = await databases.listDocuments(
    DATABASE_ID,
    TIMERS_COLLECTION,
    [Query.equal('status', 'active')]
  );
  
  for (const timer of activeTimers.documents) {
    await databases.updateDocument(
      DATABASE_ID,
      TIMERS_COLLECTION,
      timer.$id,
      { status: 'cancelled' }
    );
  }
  
  // Clear queue
  const queueItems = await databases.listDocuments(DATABASE_ID, QUEUE_COLLECTION);
  for (const item of queueItems.documents) {
    await databases.deleteDocument(DATABASE_ID, QUEUE_COLLECTION, item.$id);
  }
}

// Get current active timer
export async function getCurrentActiveTimer() {
  const activeTimers = await databases.listDocuments(
    DATABASE_ID,
    TIMERS_COLLECTION,
    [Query.equal('status', 'active'), Query.limit(1)]
  );
  
  return activeTimers.documents[0] || null;
}

// Update timer remaining time
export async function updateTimerRemainingTime(timerId, remainingMs) {
  await databases.updateDocument(
    DATABASE_ID,
    TIMERS_COLLECTION,
    timerId,
    { remainingMs }
  );
}

// Complete timer and start next
export async function completeTimerAndStartNext(timerId) {
  // Mark timer as completed
  await databases.updateDocument(
    DATABASE_ID,
    TIMERS_COLLECTION,
    timerId,
    { 
      status: 'completed', 
      completedAt: Date.now() 
    }
  );
  
  // Start next timer from queue
  return await startNextFromQueue();
}