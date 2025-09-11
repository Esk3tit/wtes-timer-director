// app/api/timer/start/route.ts
import { NextResponse } from 'next/server';
import { databases, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, timeInSeconds, priority = false } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Timer name is required and must be a non-empty string'
      }, { status: 400 });
    }

    if (!timeInSeconds || typeof timeInSeconds !== 'number' || timeInSeconds < 0) {
      return NextResponse.json({
        success: false,
        error: 'Time must be a non-negative number in seconds'
      }, { status: 400 });
    }

    if (timeInSeconds > 7200) { // 2 hours max
      return NextResponse.json({
        success: false,
        error: 'Timer cannot exceed 2 hours (7200 seconds)'
      }, { status: 400 });
    }

    // Check for active timer
    const activeTimers = await databases.listDocuments(
      DATABASE_ID,
      TIMERS_COLLECTION,
      [Query.equal('status', 'active'), Query.limit(1)]
    );

    if (activeTimers.documents.length === 0 || priority) {
      // Start immediately
      if (priority && activeTimers.documents.length > 0) {
        await handlePriorityTimer(activeTimers.documents[0]);
      }

      await startTimerNow(name, timeInSeconds);
    } else {
      // Add to queue
      await addToQueue(name, timeInSeconds);
    }

    // Log for monitoring
    console.log(`Timer action: ${priority ? 'PRIORITY START' : 'START/QUEUE'} - ${name} (${timeInSeconds}s)`);

    return NextResponse.json({
      success: true,
      message: priority ? 'Timer started with priority' : 'Timer started/queued successfully'
    });

  } catch (error) {
    console.error('Start timer error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error. Please try again.'
    }, { status: 500 });
  }
}

// Helper functions
async function startTimerNow(name, timeInSeconds) {
  const now = Date.now();
  const endTime = now + (timeInSeconds * 1000);

  await databases.createDocument(
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
      paused: false,
      createdAt: now
    }
  );
}

async function addToQueue(name, timeInSeconds) {
  // Get next position
  const lastInQueue = await databases.listDocuments(
    DATABASE_ID,
    QUEUE_COLLECTION,
    [Query.orderDesc('position'), Query.limit(1)]
  );

  const nextPosition = lastInQueue.documents.length > 0
    ? lastInQueue.documents[0].position + 1
    : 1;

  await databases.createDocument(
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
}

async function handlePriorityTimer(currentTimer) {
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