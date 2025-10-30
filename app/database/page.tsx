'use client';

import { useState, useEffect } from 'react';

interface DatabaseStatus {
  status: string;
  database: string;
  migrations: string;
  timestamp: string;
  error?: string;
  details?: string;
}

export default function DatabasePage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/db/test');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        status: 'error',
        database: 'failed',
        migrations: 'failed',
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch database status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-winter-900 to-winter-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Database Migration Status</h1>

        <div className="bg-winter-800 rounded-lg p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Vercel Postgres Connection</h2>
            <button
              onClick={testDatabase}
              disabled={loading}
              className="bg-winter-600 hover:bg-winter-500 disabled:bg-winter-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {status && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-winter-700 p-4 rounded-lg">
                  <h3 className="text-winter-200 text-sm font-medium">Status</h3>
                  <p className={`text-lg font-semibold ${status.status === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {status.status}
                  </p>
                </div>

                <div className="bg-winter-700 p-4 rounded-lg">
                  <h3 className="text-winter-200 text-sm font-medium">Database</h3>
                  <p className={`text-lg font-semibold ${status.database === 'connected' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {status.database}
                  </p>
                </div>

                <div className="bg-winter-700 p-4 rounded-lg">
                  <h3 className="text-winter-200 text-sm font-medium">Migrations</h3>
                  <p className={`text-lg font-semibold ${status.migrations === 'completed' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {status.migrations}
                  </p>
                </div>
              </div>

              <div className="bg-winter-700 p-4 rounded-lg">
                <h3 className="text-winter-200 text-sm font-medium mb-2">Last Checked</h3>
                <p className="text-white">{new Date(status.timestamp).toLocaleString()}</p>
              </div>

              {status.error && (
                <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
                  <h3 className="text-red-200 text-sm font-medium mb-2">Error</h3>
                  <p className="text-red-100">{status.error}</p>
                  {status.details && (
                    <p className="text-red-200 text-sm mt-2">{status.details}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 border-t border-winter-600 pt-6">
            <h3 className="text-xl font-semibold text-white mb-4">Migration Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-winter-200">✅ Next.js 15 App Router</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-winter-200">✅ Tailwind CSS Winter Theme</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${status?.database === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                <span className="text-winter-200">🔄 Database Connection</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${status?.migrations === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                <span className="text-winter-200">🔄 Schema Migrations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-winter-400">⏳ Data Migration from Firebase</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-winter-400">⏳ Google OAuth Integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
