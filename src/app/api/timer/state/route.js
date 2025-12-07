// app/api/timer/state/route.ts
// GET: Returns current real-time timer state (read-only, no side effects)
// Note: Timeline uses event sourcing via /api/events for delayed replay
import { NextResponse } from 'next/server';
import { tables, DATABASE_ID, TIMERS_COLLECTION, QUEUE_COLLECTION } from '@/lib/appwrite';
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

    return NextResponse.json({
      success: true,
      data: {
        currentTimer,
        queue: queue.rows || [],
        serverTime: Date.now()
      }
    });

  } catch (error) {
    console.error('Get timer state error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get timer state'
    }, { status: 500 });
  }
}