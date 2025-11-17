// app/admin/page.tsx - Admin dashboard page
'use client';

import { useState, useEffect } from 'react';
import { useTimerActions } from '@/hooks/useTimerActions';
import TimerDisplay from '@/components/TimerDisplay';
import ControlPanel from '@/components/ControlPanel';
import QueueList from '@/components/QueueList';
import Link from 'next/link';

export default function AdminPage() {
  const { loading, error } = useTimerActions();
  const [transitionDelay, setTransitionDelay] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);

  // Load current settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success) {
          setTransitionDelay(data.data.transitionDelay);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transitionDelay })
      });
      const data = await response.json();
      if (data.success) {
        setSettingsMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setSettingsMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSettingsSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setSettingsMessage(null), 3000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Esports Timer Admin</h1>
              <p className="text-gray-600">Professional timer management for live broadcasts</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/timeline"
                target="_blank"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                📺 Open Timeline View
              </Link>
              <Link
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
              >
                🏠 Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Notification - Fixed overlay to prevent layout shift */}
      {settingsMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg animate-in slide-in-from-top duration-300 ${
          settingsMessage.type === 'error'
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {settingsMessage.text}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Connecting to timer system...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Settings Panel */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Settings</h3>
                
                {settingsLoading ? (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Loading settings...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Transition Delay Setting */}
                    <div className="flex flex-col space-y-2">
                      <label className="font-semibold text-gray-700">
                        Global Transition Delay
                      </label>
                      <p className="text-sm text-gray-600">
                        Add a delay between events to allow for smooth transitions. Set to 0 to disable.
                      </p>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          value={transitionDelay}
                          onChange={(e) => setTransitionDelay(parseInt(e.target.value) || 0)}
                          className="border rounded px-3 py-2 w-24"
                          min="0"
                          max="60"
                          placeholder="Seconds"
                        />
                        <span className="text-gray-600">seconds</span>
                        <button
                          onClick={handleSaveSettings}
                          disabled={settingsSaving}
                          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                          {settingsSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                      
                      {/* Quick preset buttons */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Quick set:</span>
                        {[0, 2, 3, 5, 10].map(seconds => (
                          <button
                            key={seconds}
                            onClick={() => setTransitionDelay(seconds)}
                            className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm transition-colors"
                          >
                            {seconds}s
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* Current Timer Display */}
            <div className="mb-8">
              <TimerDisplay showQueue={true} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Control Panel - 2 columns */}
              <div className="lg:col-span-2">
                <ControlPanel />
              </div>

              {/* Queue Sidebar - 1 column */}
              <div>
                <QueueList />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Main Admin Dashboard
const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Esports Timer Admin</h1>
          <p className="text-gray-600 mt-2">Professional timer management for live broadcasts</p>
        </div>

        {/* Current Timer Display */}
        <div className="mb-8">
          <TimerDisplay large={false} showQueue={true} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <ControlPanel />
          </div>

          {/* Queue Sidebar - Takes up 1 column */}
          <div>
            <QueueList />
          </div>
        </div>
      </div>
    </div>
  );
};