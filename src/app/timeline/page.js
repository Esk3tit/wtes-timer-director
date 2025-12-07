// app/timeline/page.tsx - Public timeline view with Event Sourcing
'use client';

import { useState, useEffect } from 'react';
import { useDelayedEvents } from '@/hooks/useDelayedEvents';
import DelayedTimerDisplay from '@/components/DelayedTimerDisplay';

// Inner component that uses the delayed event state
function TimelineContent({ broadcastDelay }) {
  const { state, loading, error, eventCount } = useDelayedEvents(broadcastDelay);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-8xl mb-8">📡</div>
          <h2 className="text-4xl font-bold mb-4">Connection Lost</h2>
          <p className="text-xl opacity-75 mb-8">Unable to connect to timer system</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 font-semibold"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 text-center pt-12 pb-8">
        <h1 className="text-7xl font-bold text-white mb-4 tracking-wider">
          DIRECTOR TIMELINE
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        
        {/* Broadcast Delay Indicator */}
        {broadcastDelay > 0 && (
          <div className="mt-6 inline-flex items-center space-x-3 bg-orange-500/20 border border-orange-500/40 text-orange-300 px-6 py-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Broadcast Delay Active:</span>
            </div>
            <span className="text-xl font-bold">
              {Math.floor(broadcastDelay / 60)}:{(broadcastDelay % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-sm opacity-75">(Event Sourcing)</span>
          </div>
        )}
      </header>

      {/* Main Timer Display */}
      <main className="relative z-10 flex items-center justify-center px-8">
        {loading ? (
          <div className="text-center text-white">
            <div className="animate-pulse mb-8">
              <div className="h-16 bg-white/10 rounded-lg mb-4"></div>
              <div className="h-32 bg-white/10 rounded-lg"></div>
            </div>
            <p className="text-2xl opacity-75">Loading events...</p>
          </div>
        ) : (
          <div className="max-w-6xl w-full">
            <DelayedTimerDisplay state={state} large={true} showQueue={true} />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="absolute bottom-8 left-8 right-8 z-10">
        <div className="flex justify-between items-center text-white/50 text-sm">
          <div>
            {broadcastDelay > 0 ? (
              <span>Event sourcing: replaying actions with {broadcastDelay}s delay</span>
            ) : (
              <span>Live esports broadcast timer (no delay)</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {state?.queue && state.queue.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{state.queue.length} queued</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>{eventCount} events processed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>{broadcastDelay > 0 ? `${broadcastDelay}s delay` : 'Real-time'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main page component that loads settings
export default function TimelinePage() {
  const [broadcastDelay, setBroadcastDelay] = useState(180); // Default to 3 minutes
  const [delayLoading, setDelayLoading] = useState(true);

  // Load broadcast delay setting on mount
  useEffect(() => {
    const loadBroadcastDelay = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.data.broadcastDelay !== undefined) {
          setBroadcastDelay(data.data.broadcastDelay);
        }
      } catch (error) {
        console.error('Failed to load broadcast delay:', error);
      } finally {
        setDelayLoading(false);
      }
    };
    loadBroadcastDelay();
  }, []);

  if (delayLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading timeline configuration...</p>
        </div>
      </div>
    );
  }

  return <TimelineContent broadcastDelay={broadcastDelay} />;
}
