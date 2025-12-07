// app/api/timer/control/route.ts
import { NextResponse } from 'next/server';
import { tables, DATABASE_ID, TIMERS_COLLECTION } from '@/lib/appwrite';
import { resetAllTimers, completeTimerAndStartNext } from '@/lib/timer-operations';
import { logTimerPause, logTimerResume, logTimerSkip } from '@/lib/event-logger';
import { Query } from 'appwrite';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, timerId } = body;

    const allowedActions = ['pause', 'resume', 'skip', 'reset', 'complete'];
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
      case 'complete':
        // Complete an expired timer - called by client when timer hits 0
        // Requires timerId to prevent race conditions (only complete if it's the same timer)
        if (currentTimer && currentTimer.$id === timerId) {
          // Double-check it's actually expired
          const now = Date.now();
          const remainingMs = currentTimer.paused 
            ? currentTimer.endTime - currentTimer.pausedAt
            : currentTimer.endTime - now;
          
          if (remainingMs <= 0) {
            await completeTimerAndStartNext(currentTimer.$id);
          }
        }
        // If timerId doesn't match current timer, silently ignore (stale request)
        break;

      case 'pause':
        if (currentTimer && !currentTimer.paused) {
          const pausedAt = Date.now();
          await tables.updateRow({
            databaseId: DATABASE_ID,
            tableId: TIMERS_COLLECTION,
            rowId: currentTimer.$id,
            data: {
              paused: true,
              pausedAt: pausedAt
            }
          });
          // Log event for event sourcing
          await logTimerPause(currentTimer.$id, pausedAt);
        }
        break;

      case 'resume':
        if (currentTimer && currentTimer.paused) {
          // Match events complete immediately when resumed
          if (currentTimer.name === 'Match') {
            // completeTimerAndStartNext will log TIMER_COMPLETE internally
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
            // Log event for event sourcing
            await logTimerResume(currentTimer.$id, newEndTime);
          }
        }
        break;

      case 'skip':
        if (currentTimer) {
          // Log skip event
          await logTimerSkip(currentTimer.$id);
          // Use completeTimerAndStartNext to properly handle transitions
          await completeTimerAndStartNext(currentTimer.$id);
        }
        break;

      case 'reset':
        // resetAllTimers already logs the RESET_ALL event
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