import type { ReactElement } from 'react';
import PushupTile from '../components/PushupTile';
import SportTile from '../components/SportTile';
import WaterTile from '../components/WaterTile';
import ProteinTile from '../components/ProteinTile';
import WeightTile from '../components/WeightTile';
import TrainingLoadTile from '../components/TrainingLoadTile';
import { useTracking } from '../hooks/useTracking';
import { useWeeklyTop3 } from '../hooks/useWeeklyTop3';
import { useStore } from '../store/useStore';
import { WeekProvider } from '../contexts/WeekContext';
import WeeklyTile from '../components/dashboard/WeeklyTile';

function DashboardPage() {
  const user = useStore((state) => state.user);

  // Auto-save tracking data to Firebase
  useTracking();
  // Check and save weekly Top 3 snapshots
  useWeeklyTop3();

  // Get enabled activities (default: all activities)
  const enabledActivities = user?.enabledActivities || ['pushups', 'sports', 'water', 'protein'];

  return (
    <WeekProvider>
      <div className="min-h-screen-mobile safe-pt pb-20 overflow-y-auto viewport-safe" data-testid="dashboard-page">
        {/* Content */}
        <div className="mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 lg:px-0 max-h-[calc(100vh-5rem)] viewport-safe">
          <div
            className="flex flex-col gap-3 md:gap-4"
            data-testid="dashboard-content-sections"
          >
            <div className="animate-fade-in-up">
              <WeeklyTile />
            </div>
            {/* Training Load Tile */}
            <div className="animate-fade-in-up delay-150">
              <TrainingLoadTile />
            </div>

            {/* Tracking Tiles - Dynamically rendered based on enabled activities */}
            <div className="mobile-stack animate-fade-in-up delay-200">
              {/* Render tiles in pairs for tile-grid-2 layout */}
              {(() => {
                const tiles: ReactElement[] = [];
                if (enabledActivities.includes('pushups')) tiles.push(<PushupTile key="pushups" />);
                if (enabledActivities.includes('sports')) tiles.push(<SportTile key="sports" />);
                if (enabledActivities.includes('water')) tiles.push(<WaterTile key="water" />);
                if (enabledActivities.includes('protein')) tiles.push(<ProteinTile key="protein" />);

                // Group tiles into pairs for tile-grid-2 layout
                const tileGroups: ReactElement[] = [];
                for (let i = 0; i < tiles.length; i += 2) {
                  const group = tiles.slice(i, i + 2);
                  tileGroups.push(
                    <div key={`group-${i}`} className="tile-grid-2">
                      {group}
                    </div>
                  );
                }
                return tileGroups;
              })()}
            </div>

            <div className="animate-fade-in-up delay-300">
              <WeightTile />
            </div>
          </div>
        </div>
      </div>
    </WeekProvider>
  );
}

export default DashboardPage;
