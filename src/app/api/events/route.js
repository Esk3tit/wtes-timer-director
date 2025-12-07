// app/api/events/route.js - API endpoint for fetching events
import { NextResponse } from 'next/server';
import { tables, DATABASE_ID, EVENTS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';

/**
 * GET - Fetch events since a given timestamp
 * Query params:
 *   - since: timestamp to fetch events after (default: 0)
 *   - limit: max number of events to return (default: 1000)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = parseInt(searchParams.get('since')) || 0;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 1000, 1000);

    const events = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: EVENTS_COLLECTION,
      queries: [
        Query.greaterThan('timestamp', since),
        Query.orderAsc('timestamp'),
        Query.limit(limit)
      ]
    });

    // Parse the JSON payload for each event
    const parsedEvents = (events.rows || []).map(event => ({
      ...event,
      payload: JSON.parse(event.payload || '{}')
    }));

    return NextResponse.json({
      success: true,
      data: parsedEvents,
      count: parsedEvents.length
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch events'
    }, { status: 500 });
  }
}

/**
 * DELETE - Clear old events (cleanup endpoint)
 * Query params:
 *   - before: timestamp to delete events before
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const before = parseInt(searchParams.get('before'));

    if (!before) {
      return NextResponse.json({
        success: false,
        error: 'Missing "before" timestamp parameter'
      }, { status: 400 });
    }

    // Delete events older than the specified timestamp
    await tables.deleteRows({
      databaseId: DATABASE_ID,
      tableId: EVENTS_COLLECTION,
      queries: [Query.lessThan('timestamp', before)]
    });

    return NextResponse.json({
      success: true,
      message: `Deleted events before ${new Date(before).toISOString()}`
    });
  } catch (error) {
    console.error('Delete events error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete events'
    }, { status: 500 });
  }
}


