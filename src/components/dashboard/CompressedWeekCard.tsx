import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useWeekContext } from '../../contexts/WeekContext';
import { useTranslation } from '../../hooks/useTranslation';
import { AppModal } from '../ui/AppModal';
import WeeklyTile from './WeeklyTile';

/**
 * Compressed week card showing 7 day circles with current date highlighted
 * Tap to expand full week details in modal
 */
export function CompressedWeekCard() {
  const { t, language } = useTranslation();
  const { selectedDate, setSelectedDate } = useWeekContext();
  const [showModal, setShowModal] = useState(false);

  const locale = language === 'de' ? de : enUS;

  // Parse selected date
  const currentDate = parseISO(selectedDate);

  // Get week start and end
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Format week range (e.g., "Oct 13 - Oct 19")
  const weekRange = `${format(weekStart, 'MMM d', { locale })} - ${format(weekEnd, 'MMM d', { locale })}`;

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  return (
    <>
      {/* Week Card */}
      <div
        className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowModal(true);
          }
        }}
      >
        {/* Header: Week range + year */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('dashboard.weekOverview')}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {weekRange}
          </span>
        </div>

        {/* Day circles (7 columns) */}
        <div className="grid grid-cols-7 gap-1">
          {daysInWeek.map((day) => {
            const isSelected = format(day, 'yyyy-MM-dd') === selectedDate;
            const dayLabel = format(day, 'EEE', { locale }).slice(0, 1).toUpperCase(); // M, T, W, T, F, S, S
            const dayNum = format(day, 'd');

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayClick(day);
                }}
                className={`
                  flex flex-col items-center justify-center gap-0 py-1.5 px-1 rounded-lg
                  transition-all duration-200 text-xs font-medium
                  ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                aria-label={format(day, 'EEEE, MMM d', { locale })}
                type="button"
              >
                <span className="text-0.5xs opacity-75">{dayLabel}</span>
                <span>{dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Hint text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {t('dashboard.tapToEdit')}
        </p>
      </div>

      {/* Week Details Modal */}
      <AppModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t('dashboard.weekOverview')}
        subtitle={weekRange}
        size="lg"
        footer={null}
      >
        {/* Full WeeklyTile inside modal */}
        <div className="p-4">
          <WeeklyTile />
        </div>
      </AppModal>
    </>
  );
}

export default CompressedWeekCard;
