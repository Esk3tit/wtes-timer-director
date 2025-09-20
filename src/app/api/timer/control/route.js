// app/api/timer/control/route.ts
import { NextResponse } from 'next/server';
import { databases, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
import { startNextFromQueue, resetAllTimers } from '@/lib/timer-operations';
import { Query } from 'appwrite';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    const allowedActions = ['pause', 'resume', 'skip', 'reset'];
    if (!allowedActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Invalid action. Must be one of: ${allowedActions.join(', ')}`
      }, { status: 400 });
    }

    const activeTimers = await databases.listDocuments(
      DATABASE_ID,
      TIMERS_COLLECTION,
      [Query.equal('status', 'active'), Query.limit(1)]
    );

    const currentTimer = activeTimers.documents[0];

    switch (action) {
      case 'pause':
        if (currentTimer && !currentTimer.paused) {
          await databases.updateDocument(
            DATABASE_ID,
            TIMERS_COLLECTION,
            currentTimer.$id,
            {
              paused: true,
              pausedAt: Date.now()
            }
          );
        }
        break;

      case 'resume':
        if (currentTimer && currentTimer.paused) {
          const now = Date.now();
          const pauseDuration = now - currentTimer.pausedAt;
          const newEndTime = currentTimer.endTime + pauseDuration;

          await databases.updateDocument(
            DATABASE_ID,
            TIMERS_COLLECTION,
            currentTimer.$id,
            {
              paused: false,
              pausedAt: null,
              endTime: newEndTime,
              remainingMs: newEndTime - now
            }
          );
        }
        break;

      case 'skip':
        if (currentTimer) {
          await databases.updateDocument(
            DATABASE_ID,
            TIMERS_COLLECTION,
            currentTimer.$id,
            { status: 'completed', completedAt: Date.now() }
          );

          await startNextFromQueue();
        }
        break;

      case 'reset':
        await resetAllTimers();
        break;
    }

    console.log(`Timer control: ${action.toUpperCase()}`);

    return NextResponse.json({
      success: true,
      message: `Timer ${action}d successfully`
    });

  } catch (error) {
    console.error('Control timer error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to control timer. Please try again.'
    }, { status: 500 });
  }
}