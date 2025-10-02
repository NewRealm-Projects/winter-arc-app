import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { calculateStreak } from '../utils/calculations';

function WeekOverview() {
  const { t, language } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const locale = language === 'de' ? de : enUS;

  // Calculate streak
  const streak = calculateStreak(Object.keys(tracking));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTracking = tracking[dateStr];
    const isToday = isSameDay(date, today);
    const isSelected = dateStr === activeDate;

    // Check what's completed
    const hasPushups = (dayTracking?.pushups?.total || 0) > 0;
    const hasSports = Object.values(dayTracking?.sports || {}).some(Boolean);
    const hasWater = (dayTracking?.water || 0) >= 2000; // Goal: 2L
    const hasProtein = (dayTracking?.protein || 0) >= 100; // Goal: 100g
    const hasWeight = !!dayTracking?.weight?.value; // Weight entered

    const tasksCompleted = [hasPushups, hasSports, hasWater, hasProtein, hasWeight].filter(Boolean).length;
    const isCompleted = tasksCompleted >= 4; // At least 4 tasks for streak

    return {
      date,
      dateStr,
      dayName: format(date, 'EEE', { locale }),
      dayNumber: format(date, 'd'),
      isToday,
      isCompleted,
      isSelected,
      hasPushups,
      hasSports,
      hasWater,
      hasProtein,
      hasWeight,
      tasksCompleted,
    };
  });



  return (
    <div className="glass-dark touchable p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.weekOverview')}
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.tapToEdit')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-4xl">🔥</div>
          <div>
            <div className="text-3xl font-bold text-winter-600 dark:text-winter-400">
              {streak}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('dashboard.streak')}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('dashboard.streakInfo')} (4/5 {t('dashboard.tasks')})
      </div>

      {/* Week Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          let containerClasses = 'flex flex-col items-center p-2 rounded-lg transition-all border cursor-pointer';
          if (day.isSelected) {
            containerClasses += ' border-winter-500 dark:border-winter-400 bg-winter-100 dark:bg-winter-900 ring-2 ring-winter-500';
          } else if (day.isCompleted) {
            containerClasses += ' border-transparent bg-green-50 dark:bg-green-900/20';
          } else {
            containerClasses += ' border-transparent bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600';
          }

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDate(day.dateStr)}
              className={containerClasses}
            >
              <span
                className={`text-xs font-medium mb-1 ${
                  day.isSelected
                    ? 'text-winter-700 dark:text-winter-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {day.dayName}
              </span>
              <div className={`text-lg font-bold mb-1 ${
                day.isSelected
                  ? 'text-winter-600 dark:text-winter-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {day.dayNumber}
              </div>

              {/* Task indicators */}
              <div className="flex gap-0.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${day.hasPushups ? 'bg-winter-500' : 'bg-gray-300 dark:bg-gray-600'}`} title="Pushups" />
                <div className={`w-1.5 h-1.5 rounded-full ${day.hasSports ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`} title="Sport" />
                <div className={`w-1.5 h-1.5 rounded-full ${day.hasWater ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} title="Water" />
                <div className={`w-1.5 h-1.5 rounded-full ${day.hasProtein ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`} title="Protein" />
                <div className={`w-1.5 h-1.5 rounded-full ${day.hasWeight ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`} title="Weight" />
              </div>

              {/* Streak indicator */}
              {day.isCompleted && (
                <div className="text-xs mt-1">🔥</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WeekOverview;
