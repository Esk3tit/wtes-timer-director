# wtes-timer-director

War Thunder eSports Timeline Director app for casters and stream management.

Built with Next.js and Appwrite.

## Features

- **Real-time Timer Management**: Start, pause, resume, and skip timers
- **Queue System**: Queue up multiple events with automatic transitions
- **Match Button**: Special event type that pauses until manually resumed
- **Broadcast Delay (Event Sourcing)**: Timeline view shows events with a configurable delay (default 3 minutes) to sync with Twitch stream delay
- **Admin Panel**: Full control over timers and settings
- **Director Timeline**: Display-optimized view for OBS/streaming

## Architecture: Event Sourcing

The broadcast delay feature uses **Event Sourcing** - every action in the admin panel is logged as an immutable event. The timeline view replays these events with a delay, creating a perfect mirror of what happened X minutes ago.

This ensures:
- **Complete fidelity**: Every action (start, pause, resume, reset) is preserved
- **Accurate timing**: The timeline shows exactly what the admin did, delayed
- **No lost actions**: Even rapid changes are captured and replayed

## Setup

### Prerequisites

- Node.js 18+
- Appwrite Cloud account (or self-hosted Appwrite)

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_TIMERS_COLLECTION_ID=timers
NEXT_PUBLIC_APPWRITE_QUEUE_COLLECTION_ID=queue
NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID=settings
NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=events
NEXT_PUBLIC_APPWRITE_DEV_KEY=your-dev-key (optional)
```

### Appwrite Collections

You need these collections in your Appwrite database:

1. **timers** - Active and completed timers
2. **queue** - Timer queue
3. **settings** - App settings (transition delay, broadcast delay)
4. **events** - Event log for event sourcing (broadcast delay)

#### Setting up the Events Collection

Create a table named `events` in your Appwrite database with:
- `type` (string, 50 chars, required) - Event type
- `payload` (string, 10000 chars, required) - JSON payload
- `timestamp` (integer, required) - Unix timestamp in ms
- Create an index on `timestamp` for efficient queries
- Set permissions to allow read/write for all

### Installation

```bash
npm install
npm run dev
```

## Usage

### Admin Panel (`/admin`)

- Start timers manually or queue them
- Configure transition delay (gap between events)
- Configure broadcast delay (timeline sync delay)
- Pause/resume/skip current timer
- Reset everything

### Director Timeline (`/timeline`)

- Opens in a separate window for OBS
- Shows events with the configured broadcast delay
- Displays broadcast delay indicator
- Perfect for syncing with Twitch stream delay

## How Broadcast Delay Works

1. **Admin makes action** → Event logged with timestamp
2. **Timeline receives event** → Added to local queue
3. **After delay passes** → Event applied to timeline state
4. **Result**: Timeline mirrors admin exactly, but delayed

Example: If broadcast delay is 3 minutes (180s), when admin starts a timer at 12:00:00, the timeline will show it starting at 12:03:00.

## Event Types

- `TIMER_START` - Timer started
- `TIMER_PAUSE` - Timer paused
- `TIMER_RESUME` - Timer resumed
- `TIMER_COMPLETE` - Timer completed naturally
- `TIMER_SKIP` - Timer skipped
- `QUEUE_ADD` - Item added to queue
- `QUEUE_REMOVE` - Item removed from queue
- `QUEUE_CLEAR` - Queue cleared
- `RESET_ALL` - Everything reset
- `TRANSITION_START` - Transition timer started
- `TRANSITION_COMPLETE` - Transition completed

## License

See LICENSE file.
