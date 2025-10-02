import { Link } from 'react-router-dom';
import PushupTile from '../components/PushupTile';
import SportTile from '../components/SportTile';
import WaterTile from '../components/WaterTile';
import ProteinTile from '../components/ProteinTile';
import WeightTile from '../components/WeightTile';
import { useTracking } from '../hooks/useTracking';

function TrackingPage() {
  // Auto-save tracking data to Firebase
  useTracking();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      {/* Header */}
      <div className="bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Heute tracken ✍️</h1>
            <Link
              to="/tracking/history"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              📋 Historie
            </Link>
          </div>
          <p className="text-winter-100">
            Trage deine heutigen Fortschritte ein
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20 space-y-4">
        {/* Pushups */}
        <PushupTile />

        {/* Sport */}
        <SportTile />

        {/* Water & Protein Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WaterTile />
          <ProteinTile />
        </div>

        {/* Weight */}
        <WeightTile />
      </div>
    </div>
  );
}

export default TrackingPage;
