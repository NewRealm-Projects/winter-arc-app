import { useStore } from '../store/useStore';
import PushupTile from '../components/PushupTile';
import SportTile from '../components/SportTile';
import WaterTile from '../components/WaterTile';
import ProteinTile from '../components/ProteinTile';
import WeightTile from '../components/WeightTile';
import StreakMiniCard from '../components/dashboard/StreakMiniCard';
import WeatherCard from '../components/dashboard/WeatherCard';
import WeekCompactCard from '../components/dashboard/WeekCompactCard';
import { useState, useEffect } from 'react';
import { getWeatherForAachen } from '../services/weatherService';
import { calculateStreak } from '../utils/calculations';
import { useTracking } from '../hooks/useTracking';
import { useWeeklyTop3 } from '../hooks/useWeeklyTop3';

type WeatherCondition = "sunny" | "cloudy" | "rain" | "snow" | "partly";

function DashboardPage() {
  const tracking = useStore((state) => state.tracking);

  // Auto-save tracking data to Firebase
  useTracking();
  // Check and save weekly Top 3 snapshots
  useWeeklyTop3();

  const [weather, setWeather] = useState<{ tempC: number; condition: WeatherCondition; location: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Calculate streak
  const streak = calculateStreak(tracking);









  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      try {
        const weatherData = await getWeatherForAachen();
        if (weatherData) {
          // Map weather description to condition
          let condition: WeatherCondition = "partly";
          const desc = weatherData.weatherDescription.toLowerCase();
          if (desc.includes('clear')) condition = 'sunny';
          else if (desc.includes('cloud')) condition = 'cloudy';
          else if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) condition = 'rain';
          else if (desc.includes('snow')) condition = 'snow';
          else if (desc.includes('partly') || desc.includes('fog')) condition = 'partly';

          setWeather({
            tempC: weatherData.temperature,
            condition,
            location: 'Aachen',
          });
        }
      } catch (error) {
        console.error('Error loading weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    };
    loadWeather();
  }, []);

  return (
    <div className="min-h-screen-mobile safe-pt pb-20 overflow-y-auto viewport-safe">
      {/* Content */}
      <div className="mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 lg:px-0 max-h-[calc(100vh-5rem)] viewport-safe">
        {/* Top Grid: Streak + Weather - Always side-by-side */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4 mb-3 animate-fade-in-up">
          {/* Streak Card */}
          <div>
            <StreakMiniCard days={streak} />
          </div>

          {/* Weather Card */}
          <div>
            {weatherLoading ? (
              <WeatherCard tempC={0} condition="partly" loading={true} />
            ) : weather ? (
              <WeatherCard
                tempC={weather.tempC}
                condition={weather.condition}
                location={weather.location}
              />
            ) : (
              <WeatherCard tempC={11} condition="partly" location="Aachen" />
            )}
          </div>
        </div>

        {/* Week Compact Card */}
        <div className="tile-grid-2 mb-3 animate-fade-in-up delay-100">
          <WeekCompactCard />
        </div>

        {/* Tracking Tiles */}
        <div className="mobile-stack animate-fade-in-up delay-300">
          {/* Pushups & Sport Side by Side on desktop */}
          <div className="tile-grid-2">
            <PushupTile />
            <SportTile />
          </div>

          {/* Water & Protein Grid */}
          <div className="tile-grid-2">
            <WaterTile />
            <ProteinTile />
          </div>

          {/* Weight Tile */}
          <WeightTile />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
