import { useTranslation } from '../../hooks/useTranslation';

interface StreakMiniCardProps {
  days: number;
}

export default function StreakMiniCard({ days }: StreakMiniCardProps) {
  const { t } = useTranslation();

  return (
    <div className="relative w-full rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] p-4 h-[88px] sm:h-[76px] lg:h-[88px] flex items-center gap-3 transition-all duration-200 hover:bg-white/8">
      {/* Fire Icon */}
      <div className="text-4xl flex-shrink-0">
        🔥
      </div>

      {/* Streak Info */}
      <div className="flex flex-col justify-center min-w-0">
        <div className={`text-3xl font-bold leading-none mb-1 ${days > 0 ? 'text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.5)]' : 'text-white/60'}`}>
          {days}
        </div>
        <div className="text-xs text-white/70 font-medium whitespace-nowrap">
          {t('dashboard.streakDays')}
        </div>
      </div>

      {/* Active Glow Effect */}
      {days > 0 && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
