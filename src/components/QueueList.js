// QueueList Component
import { useTimerState } from '@/hooks/useRealtime';
import TimerDisplay from './TimerDisplay';
import ControlPanel from './ControlPanel';

const QueueList = () => {
  const { timerState, loading } = useTimerState();
  const queue = timerState?.queue || [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">
        Timer Queue ({queue.length})
      </h3>

      {queue.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {queue.map((timer, index) => (
            <div
              key={timer.$id}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{timer.name}</div>
                  <div className="text-sm text-gray-600">
                    Duration: {formatDuration(timer.timeInSeconds)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Queued: {new Date(timer.queuedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-blue-600">
                    #{index + 1}
                  </div>
                  {index === 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      NEXT
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <div className="text-6xl mb-4">⏰</div>
          <div className="text-lg font-medium">No timers in queue</div>
          <div className="text-sm">Add a timer to get started</div>
        </div>
      )}
    </div>
  );
};

export default QueueList;