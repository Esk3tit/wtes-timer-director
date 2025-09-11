// app/timeline/page.tsx - Public timeline view
'use client';

import { useTimer } from '@/hooks/useRealtime';
import TimerDisplay from '@/components/TimerDisplay';

export default function TimelinePage() {
  const { timerState, loading, error } = useTimer();

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
      </header>

      {/* Main Timer Display */}
      <main className="relative z-10 flex items-center justify-center px-8">
        {loading ? (
          <div className="text-center text-white">
            <div className="animate-pulse mb-8">
              <div className="h-16 bg-white/10 rounded-lg mb-4"></div>
              <div className="h-32 bg-white/10 rounded-lg"></div>
            </div>
            <p className="text-2xl opacity-75">Synchronizing timer...</p>
          </div>
        ) : (
          <div className="max-w-6xl w-full">
            <TimerDisplay large={true} showQueue={true} />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="absolute bottom-8 left-8 right-8 z-10">
        <div className="flex justify-between items-center text-white/50 text-sm">
          <div>Live esports broadcast timer</div>
          <div className="flex items-center space-x-4">
            {timerState?.queue && timerState.queue.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{timerState.queue.length} queued</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Real-time sync</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}