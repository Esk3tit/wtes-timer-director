import { useState, useEffect } from 'react';
import { useTimerState } from '@/hooks/useRealtime';
import { formatTime, formatDuration } from '@/utils/formatTime';

const TimerDisplay = ({ large = false, showQueue = false }) => {
  const { timerState, loading } = useTimerState();
  const [, setTick] = useState(0);

  // Trigger re-renders for smooth countdown
  useEffect(() => {
    if (!timerState?.currentTimer || timerState.currentTimer.paused) {
      return;
    }

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [timerState?.currentTimer?.paused, timerState?.currentTimer?.$id]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${large ? 'h-64' : 'h-32'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentTimer = timerState?.currentTimer;
  const queue = timerState?.queue || [];
  
  // Check if current timer is a transition
  const isTransition = currentTimer?.name === '__TRANSITION__';
  
  // Derive remainingMs from endTime (single source of truth)
  // When paused, calculate from pausedAt; otherwise from current time
  const remainingMs = currentTimer
    ? currentTimer.paused
      ? Math.max(0, currentTimer.endTime - currentTimer.pausedAt)
      : Math.max(0, currentTimer.endTime - Date.now())
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow-lg ${large ? 'p-12' : 'p-8'}`}>
      <div className="text-center">
        {currentTimer ? (
          <>
            {isTransition ? (
              // Transition timer - subtle indicator
              <>
                <div className="flex items-center justify-center mb-4 space-x-2">
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full animation-delay-200"></div>
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full animation-delay-400"></div>
                </div>
                <h2 className={`font-semibold mb-4 text-blue-600 ${large ? 'text-3xl' : 'text-xl'}`}>
                  Transitioning to Next Event
                </h2>
                <div className={`font-mono text-blue-500 mb-4 ${large ? 'text-6xl' : 'text-4xl'}`}>
                  {formatTime(remainingMs)}
                </div>
                {queue.length > 0 && (
                  <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg inline-block">
                    <span className="text-sm">Next: </span>
                    <span className="font-semibold">{queue[0].name}</span>
                    <span className="text-sm"> ({formatDuration(queue[0].timeInSeconds)})</span>
                  </div>
                )}
              </>
            ) : (
              // Regular timer
              <>
                <h2 className={`font-bold mb-4 text-gray-900 ${large ? 'text-4xl' : 'text-2xl'}`}>
                  {currentTimer.name}
                </h2>
                <div className={`font-mono text-red-600 mb-4 ${large ? 'text-8xl' : 'text-5xl'}`}>
                  {formatTime(remainingMs)}
                </div>
                <div className="flex justify-center items-center space-x-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Started: {new Date(currentTimer.startTime).toLocaleTimeString()}
                  </span>
                  {currentTimer.paused && (
                    <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold">
                      PAUSED
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className={`text-gray-500 mb-4 ${large ? 'text-4xl' : 'text-2xl'}`}>
              No Active Timer
            </h2>
            <div className={`font-mono text-gray-400 mb-4 ${large ? 'text-8xl' : 'text-5xl'}`}>
              00:00:00
            </div>
            <p className="text-gray-500">Ready to start your next timer</p>
          </>
        )}
      </div>

      {showQueue && queue.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Next: {queue[0].name} ({formatDuration(queue[0].timeInSeconds)})
          </h3>
          {queue.length > 1 && (
            <p className="text-sm text-gray-600 text-center">
              +{queue.length - 1} more in queue
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;