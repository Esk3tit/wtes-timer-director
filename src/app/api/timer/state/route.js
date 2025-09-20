// app/api/timer/state/route.ts
import { NextResponse } from 'next/server';
import { databases, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
import { startNextFromQueue } from '@/lib/timer-operations';
import { Query } from 'appwrite';

export async function GET(request) {
  try {
    const [activeTimers, queue] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        TIMERS_COLLECTION,
        [Query.equal('status', 'active'), Query.limit(1)]
      ),
      databases.listDocuments(
        DATABASE_ID,
        QUEUE_COLLECTION,
        [Query.orderAsc('position')]
      )
    ]);

    const currentTimer = activeTimers.documents[0] || null;

    // Calculate remaining time if active and not paused
    if (currentTimer && !currentTimer.paused) {
      const now = Date.now();
      const remainingMs = Math.max(0, currentTimer.endTime - now);

      // Update remaining time in database for real-time sync
      if (remainingMs !== currentTimer.remainingMs) {
        await databases.updateDocument(
          DATABASE_ID,
          TIMERS_COLLECTION,
          currentTimer.$id,
          { remainingMs }
        );
        currentTimer.remainingMs = remainingMs;
      }

      // Auto-complete timer if time is up
      if (remainingMs <= 0) {
        await databases.updateDocument(
          DATABASE_ID,
          TIMERS_COLLECTION,
          currentTimer.$id,
          { status: 'completed', completedAt: Date.now() }
        );

        // Start next timer
        await startNextFromQueue();

        // Return updated state
        return GET(request);
      }
    }

    const timerState = {
      currentTimer: currentTimer,
      queue: queue.documents,
      serverTime: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: timerState
    });

  } catch (error) {
    console.error('Get timer state error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get timer state'
    }, { status: 500 });
  }
}