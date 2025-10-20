// ControlPanel Component
import { useState } from 'react';
import { formatDuration } from '@/utils/formatTime';
import { useTimerActions } from '@/hooks/useTimerActions';
import { useTimerState } from '@/hooks/useRealtime';

const ControlPanel = () => {
  const { startTimer, controlTimer, loading } = useTimerActions();
  const { timerState } = useTimerState();
  const [customTime, setCustomTime] = useState(30);
  const [notification, setNotification] = useState(null);
  const [adDurations, setAdDurations] = useState({
    'Hercules': 5,
    'Thrustmaster': 5,
    'Tank AD': 5,
    'Heli AD': 5,
  });

  const currentTimer = timerState?.currentTimer;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartTimer = async (name, timeInSeconds = customTime) => {
    try {
      await startTimer(name, timeInSeconds);
      showNotification(`${name} queued successfully`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleControl = async (action) => {
    try {
      await controlTimer(action);
      showNotification(`Timer ${action}ed successfully`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleAdDurationChange = (adName, duration) => {
    setAdDurations(prev => ({
      ...prev,
      [adName]: parseInt(duration) || 0
    }));
  };

  return (
    <div className="space-y-6">
      {/* Notification - Fixed overlay to prevent layout shift */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg animate-in slide-in-from-top duration-300 ${notification.type === 'error'
          ? 'bg-red-100 text-red-700 border border-red-300'
          : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Custom Timer */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Custom Timer</h3>
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="number"
            value={customTime}
            onChange={(e) => setCustomTime(parseInt(e.target.value) || 0)}
            className="border rounded px-3 py-2 w-24"
            min="0"
            placeholder="Seconds"
          />
          <span className="text-gray-600">seconds</span>
          <button
            onClick={() => handleStartTimer('Custom Timer')}
            disabled={loading || customTime <= 0}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Custom'}
          </button>
        </div>

        {/* Preset Times */}
        <div className="grid grid-cols-4 gap-2">
          {[15, 30, 60, 120, 180, 300, 600, 900].map(seconds => (
            <button
              key={seconds}
              onClick={() => setCustomTime(seconds)}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-sm transition-colors"
            >
              {formatDuration(seconds)}
            </button>
          ))}
        </div>
      </div>

      {/* Team Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Teams</h3>
        <div className="grid grid-cols-4 gap-2">
          {['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H'].map(team => (
            <button
              key={team}
              onClick={() => handleStartTimer(team)}
              disabled={loading}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm transition-colors"
            >
              {team}
            </button>
          ))}
        </div>
      </div>

      {/* Broadcast Scenes */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Broadcast Scenes</h3>
        <div className="grid grid-cols-3 gap-2">
          {['Leaderboard', 'BRB', 'Maps', 'Interview', 'Lineup', 'Team vs Team'].map(scene => (
            <button
              key={scene}
              onClick={() => handleStartTimer(scene)}
              disabled={loading}
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 disabled:opacity-50 text-sm transition-colors"
            >
              {scene}
            </button>
          ))}
        </div>
      </div>

      {/* Special Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Special Actions</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {['Hercules', 'Thrustmaster', 'Tank AD', 'Heli AD'].map((name) => (
            <div key={name} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={adDurations[name]}
                  onChange={(e) => handleAdDurationChange(name, e.target.value)}
                  className="border rounded px-2 py-1 w-16 text-sm"
                  min="1"
                  placeholder="sec"
                />
                <span className="text-xs text-gray-600">seconds</span>
              </div>
              <button
                onClick={() => handleStartTimer(name, adDurations[name])}
                disabled={loading || adDurations[name] <= 0}
                className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 disabled:opacity-50 text-sm transition-colors w-full"
              >
                {name}
              </button>
            </div>
          ))}
        </div>

        {/* Match Button (Auto-Pause) */}
        <button
          onClick={() => handleStartTimer('Match', 1)}
          disabled={loading}
          className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold w-full transition-colors"
        >
          🏆 MATCH (Auto-Pause)
        </button>
      </div>

      {/* Timer Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Timer Controls</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleControl('pause')}
            disabled={loading || !currentTimer || currentTimer.paused}
            className="bg-yellow-500 text-white px-6 py-3 rounded hover:bg-yellow-600 disabled:opacity-50 font-semibold transition-colors"
          >
            ⏸️ Pause
          </button>
          <button
            onClick={() => handleControl('resume')}
            disabled={loading || !currentTimer || !currentTimer.paused}
            className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 disabled:opacity-50 font-semibold transition-colors"
          >
            ▶️ Resume
          </button>
          <button
            onClick={() => handleControl('skip')}
            disabled={loading || !currentTimer}
            className="bg-orange-500 text-white px-6 py-3 rounded hover:bg-orange-600 disabled:opacity-50 font-semibold transition-colors"
          >
            ⏭️ Skip Current
          </button>
          <button
            onClick={() => handleControl('reset')}
            disabled={loading}
            className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 disabled:opacity-50 font-semibold transition-colors"
          >
            🔄 Reset All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;