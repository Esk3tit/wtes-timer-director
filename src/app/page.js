// app/page.tsx - Landing page
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-8">⏱️ Esports Timer</h1>
        <p className="text-xl mb-12 max-w-2xl mx-auto">
          Professional timer management system for live esports broadcasts.
          Synchronized across all viewers with real-time updates.
        </p>

        <div className="space-x-6">
          <Link
            href="/admin"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-block"
          >
            🎮 Admin Dashboard
          </Link>

          <Link
            href="/timeline"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-block"
          >
            📺 Public Timeline
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Sync</h3>
            <p className="text-sm opacity-90">
              All viewers see the exact same countdown with sub-200ms updates
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2">Easy Control</h3>
            <p className="text-sm opacity-90">
              Quick action buttons for teams, scenes, and broadcast segments
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Queue Management</h3>
            <p className="text-sm opacity-90">
              Automatic timer progression with visual queue display
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}