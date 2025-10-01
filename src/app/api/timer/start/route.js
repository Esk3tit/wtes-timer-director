// app/api/timer/start/route.ts
import { NextResponse } from 'next/server';
import { tables, DATABASE_ID, TIMERS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { startTimerNow, addToQueue, handlePriorityTimer } from '@/lib/timer-operations';

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
    const activeTimers = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TIMERS_COLLECTION,
      queries: [Query.equal('status', 'active'), Query.limit(1)]
    });

    if ((activeTimers.rows?.length || 0) === 0 || priority) {
      // Start immediately
      if (priority && (activeTimers.rows?.length || 0) > 0) {
        await handlePriorityTimer(activeTimers.rows[0]);
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