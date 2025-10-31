// app/api/timer/control/route.ts
import { NextResponse } from 'next/server';
import { tables, DATABASE_ID, TIMERS_COLLECTION } from '@/lib/appwrite';
import { startNextFromQueue, resetAllTimers, completeTimerAndStartNext } from '@/lib/timer-operations';
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

    const activeTimers = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TIMERS_COLLECTION,
      queries: [Query.equal('status', 'active'), Query.limit(1)]
    });

    const currentTimer = activeTimers.rows && activeTimers.rows[0];

    switch (action) {
      case 'pause':
        if (currentTimer && !currentTimer.paused) {
          await tables.updateRow({
            databaseId: DATABASE_ID,
            tableId: TIMERS_COLLECTION,
            rowId: currentTimer.$id,
            data: {
              paused: true,
              pausedAt: Date.now()
            }
          });
        }
        break;

      case 'resume':
        if (currentTimer && currentTimer.paused) {
          // Match events complete immediately when resumed
          if (currentTimer.name === 'Match') {
            // Use completeTimerAndStartNext to properly handle transitions
            await completeTimerAndStartNext(currentTimer.$id);
          } else {
            // Normal resume: adjust endTime to account for pause duration
            const now = Date.now();
            const pauseDuration = now - currentTimer.pausedAt;
            const newEndTime = currentTimer.endTime + pauseDuration;

            await tables.updateRow({
              databaseId: DATABASE_ID,
              tableId: TIMERS_COLLECTION,
              rowId: currentTimer.$id,
              data: {
                paused: false,
                pausedAt: null,
                endTime: newEndTime
              }
            });
          }
        }
        break;

      case 'skip':
        if (currentTimer) {
          // Use completeTimerAndStartNext to properly handle transitions
          await completeTimerAndStartNext(currentTimer.$id);
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