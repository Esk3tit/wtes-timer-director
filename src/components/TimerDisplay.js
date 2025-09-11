// TimerDisplay Component
import { useTimerState } from '@/hooks/useRealtime';

const TimerDisplay = ({ large = false, showQueue = false }) => {
  const { timerState, loading } = useTimerState();

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${large ? 'h-64' : 'h-32'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentTimer = timerState?.currentTimer;
  const queue = timerState?.queue || [];

  return (
    <div className={`bg-white rounded-lg shadow-lg ${large ? 'p-12' : 'p-8'}`}>
      <div className="text-center">
        {currentTimer ? (
          <>
            <h2 className={`font-bold mb-4 text-gray-900 ${large ? 'text-4xl' : 'text-2xl'}`}>
              {currentTimer.name}
            </h2>
            <div className={`font-mono text-red-600 mb-4 ${large ? 'text-8xl' : 'text-5xl'}`}>
              {formatTime(currentTimer.remainingMs)}
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