import { Settings } from 'lucide-react';
import { useWeekContext } from '../../contexts/WeekContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useTranslation } from '../../hooks/useTranslation';

interface DashboardHeaderProps {
  onSettingsClick: () => void;
}

/**
 * Dashboard header with week information and settings button
 * Replaces bottom navigation access to settings on mobile
 */
export function DashboardHeader({ onSettingsClick }: DashboardHeaderProps) {
  const { t, language } = useTranslation();
  const { selectedDate } = useWeekContext();

  const locale = language === 'de' ? de : enUS;

  // Get week range
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekRange = `${format(weekStart, 'MMM d', { locale })} - ${format(weekEnd, 'MMM d', { locale })}`;
  const weekNum = format(selectedDate, 'w', { locale });

  return (
    <div className="flex items-center justify-between py-1 px-0 border-b border-gray-200 dark:border-white/10">
      {/* Left: Week info */}
      <div className="flex flex-col gap-0">
        <h1 className="text-sm font-bold text-gray-900 dark:text-white">
          {t('dashboard.weekNumberTitle', { week: weekNum })}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {weekRange}
        </p>
      </div>

      {/* Right: Settings button */}
      <button
        onClick={onSettingsClick}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10"
        aria-label={t('nav.settings')}
        type="button"
        title={t('nav.settings')}
      >
        <Settings size={20} className="stroke-current" />
      </button>
    </div>
  );
}

export default DashboardHeader;
