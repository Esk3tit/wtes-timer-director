// app/admin/page.tsx - Admin dashboard page
'use client';

import { useTimerActions } from '@/hooks/useTimerActions';
import TimerDisplay from '@/components/TimerDisplay';
import ControlPanel from '@/components/ControlPanel';
import QueueList from '@/components/QueueList';
import Link from 'next/link';

export default function AdminPage() {
  const { loading, error } = useTimerActions();

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