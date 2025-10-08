import { useTranslation } from '../../hooks/useTranslation';

type WeatherCondition = "sunny" | "cloudy" | "rain" | "snow" | "partly";

interface WeatherCardProps {
  tempC: number;
  condition: WeatherCondition;
  location?: string;
  loading?: boolean;
}

const weatherIcons: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  snow: '❄️',
  partly: '⛅',
};

export default function WeatherCard({ tempC, condition, location = "Aachen", loading = false }: WeatherCardProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div
        className="relative w-full rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] p-4 h-[88px] sm:h-[76px] lg:h-[88px] flex items-center justify-center"
        data-testid="weather-card-skeleton"
      >
        <div className="animate-pulse flex items-center gap-3 w-full">
          <div className="w-10 h-10 bg-white/10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-white/10 rounded w-16" />
            <div className="h-3 bg-white/10 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] p-4 h-[88px] sm:h-[76px] lg:h-[88px] flex items-center gap-3 transition-all duration-200 hover:bg-white/8"
      data-testid="weather-card"
    >
      {/* Weather Icon */}
      <div className="text-4xl flex-shrink-0">
        {weatherIcons[condition]}
      </div>

      {/* Weather Info */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="text-2xl lg:text-3xl font-bold text-white leading-none mb-1">
          {tempC}°C
        </div>
        <div className="text-xs text-white/70 font-medium truncate">
          {t(`weather.${condition}`)}
        </div>
      </div>

      {/* Location */}
      {location && (
        <div className="hidden lg:flex text-xs text-white/50 font-medium items-center gap-1">
          <span>📍</span>
          <span className="truncate max-w-[80px]">{location}</span>
        </div>
      )}
    </div>
  );
}
