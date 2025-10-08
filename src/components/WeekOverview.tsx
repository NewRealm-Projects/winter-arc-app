import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { calculateStreak } from '../utils/calculations';
import { STREAK_COMPLETION_THRESHOLD } from '../constants/streak';
import { countActiveSports } from '../utils/sports';
import { useCombinedTracking } from '../hooks/useCombinedTracking';

function WeekOverview() {
  const { t, language } = useTranslation();
  const combinedTracking = useCombinedTracking();
  const user = useStore((state) => state.user);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const locale = language === 'de' ? de : enUS;

  const enabledActivities = user?.enabledActivities || ['pushups', 'sports', 'water', 'protein'];

  const totalTasks = enabledActivities.length + 1; // +1 for weight
  const requiredTasks = Math.max(1, Math.ceil(totalTasks * (STREAK_COMPLETION_THRESHOLD / 100)));

  const streak = calculateStreak(combinedTracking, enabledActivities);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTracking = Object.prototype.hasOwnProperty.call(combinedTracking, dateStr)
      ? combinedTracking[dateStr]
      : undefined;
    const isToday = isSameDay(date, today);
    const isSelected = dateStr === activeDate;

    const completedList: string[] = [];

    const hasPushups = enabledActivities.includes('pushups') && (dayTracking?.pushups?.total ?? 0) > 0;
    const hasSports = enabledActivities.includes('sports') && countActiveSports(dayTracking?.sports) > 0;
    const hasWater = enabledActivities.includes('water') && (dayTracking?.water ?? 0) >= 2000;
    const hasProtein = enabledActivities.includes('protein') && (dayTracking?.protein ?? 0) >= 100;
    const hasWeight = typeof dayTracking?.weight?.value === 'number';

    if (hasPushups) completedList.push('pushups');
    if (hasSports) completedList.push('sports');
    if (hasWater) completedList.push('water');
    if (hasProtein) completedList.push('protein');
    if (hasWeight) completedList.push('weight');

    const tasksCompleted = completedList.length;
    const isCompleted = tasksCompleted >= requiredTasks;
    const isPartial = tasksCompleted > 0 && tasksCompleted < requiredTasks;

    return {
      date,
      dateStr,
      dayName: format(date, 'EEE', { locale }),
      dayNumber: format(date, 'd'),
      isToday,
      isCompleted,
      isPartial,
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
    <div className="glass-dark touchable p-6 text-white" data-testid="week-compact-card">
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
        {t('dashboard.streakInfo')} ({requiredTasks}/{totalTasks} {t('dashboard.tasks')})
      </div>

      {/* Week Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => {
          // Circle styling based on status
          let circleClasses =
            'rounded-full flex items-center justify-center font-bold transition-all cursor-pointer w-[clamp(2.25rem,8vw,3.5rem)] h-[clamp(2.25rem,8vw,3.5rem)] text-[clamp(0.75rem,1.6vw,1rem)]';

          if (day.isCompleted) {
            circleClasses += ' bg-emerald-500 text-white shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]';
          } else if (day.isPartial) {
            circleClasses += ' ring-2 ring-amber-400 text-amber-200 bg-slate-700/40';
          } else {
            circleClasses += ' bg-slate-700/40 text-slate-400';
          }

          if (day.isToday) {
            circleClasses += ' ring-2 ring-sky-400';
          }

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDate(day.dateStr)}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 md:text-xs">
                {day.dayName}
              </span>
              <div className={circleClasses}>
                {day.dayNumber}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WeekOverview;
