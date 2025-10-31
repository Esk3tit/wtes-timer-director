// app/api/timer/state/route.ts
import { NextResponse } from 'next/server';
import { tables, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
import { completeTimerAndStartNext } from '@/lib/timer-operations';
import { Query } from 'appwrite';

export async function GET() {
  try {
    const [activeTimers, queue] = await Promise.all([
      tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TIMERS_COLLECTION,
        queries: [Query.equal('status', 'active'), Query.limit(1)]
      }),
      tables.listRows({
        databaseId: DATABASE_ID,
        tableId: QUEUE_COLLECTION,
        queries: [Query.orderAsc('position')]
      })
    ]);

    const currentTimer = (activeTimers.rows && activeTimers.rows[0]) || null;

    // Calculate remaining time if active and not paused
    if (currentTimer && !currentTimer.paused) {
      const now = Date.now();
      const remainingMs = Math.max(0, currentTimer.endTime - now);

      // Auto-complete timer if time is up
      if (remainingMs <= 0) {
        // Complete timer and start next (with transition logic)
        await completeTimerAndStartNext(currentTimer.$id);

        // Re-fetch updated state (single pass)
        const [newActive, newQueue] = await Promise.all([
          tables.listRows({
            databaseId: DATABASE_ID,
            tableId: TIMERS_COLLECTION,
            queries: [Query.equal('status', 'active'), Query.limit(1)]
          }),
          tables.listRows({
            databaseId: DATABASE_ID,
            tableId: QUEUE_COLLECTION,
            queries: [Query.orderAsc('position')]
          })
        ]);

        const newCurrent = (newActive.rows && newActive.rows[0]) || null;

        const timerStateAfter = {
          currentTimer: newCurrent,
          queue: newQueue.rows || [],
          serverTime: Date.now()
        };

        return NextResponse.json({ success: true, data: timerStateAfter });
      }
    }

    const timerState = {
      currentTimer: currentTimer,
      queue: queue.rows || [],
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