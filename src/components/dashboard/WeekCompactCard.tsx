import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { countActiveSports } from '../../utils/sports';

export default function WeekCompactCard() {
  const { t, language } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const locale = language === 'de' ? de : enUS;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTracking = tracking[dateStr];
    const isToday = isSameDay(date, today);
    const isSelected = dateStr === activeDate;

    // Check what's completed
    const hasPushups = (dayTracking?.pushups?.total || 0) > 0;
    const hasSports = countActiveSports(dayTracking?.sports) > 0;
    const hasWater = (dayTracking?.water || 0) >= 2000;
    const hasProtein = (dayTracking?.protein || 0) >= 100;

    const tasksCompleted = [hasPushups, hasSports, hasWater, hasProtein].filter(Boolean).length;
    const isDone = tasksCompleted >= 3;

    return {
      label: format(date, 'EEE', { locale }),
      date: dateStr,
      isToday,
      done: isDone,
      tasksCompleted,
      isSelected,
    };
  });

  return (
    <div className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] p-4 lg:p-5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-xl font-semibold text-white mb-0.5">
            {t('dashboard.weekOverview')}
          </h2>
          <p className="text-xs text-white/70">
            {t('dashboard.tapToEdit')}
          </p>
        </div>
      </div>

      {/* Week Days Chips - Grid Layout (7 equal columns) */}
      <div className="grid grid-cols-7 gap-1 lg:gap-1.5">
        {weekDays.map((day) => {
          let chipClasses = 'flex items-center justify-center h-9 rounded-full border text-xs sm:text-sm font-medium transition-all cursor-pointer select-none';

          if (day.done) {
            // Completed: glow effect
            chipClasses += ' bg-emerald-500/20 border-emerald-400/70 text-emerald-100 shadow-[inset_0_0_14px_rgba(16,185,129,0.45)]';
          } else if (day.tasksCompleted > 0) {
            // Partial: amber ring
            chipClasses += ' bg-white/6 border-amber-400/60 text-amber-200';
          } else {
            // Empty
            chipClasses += ' bg-white/6 border-white/10 text-white/60';
          }

          if (day.isToday) {
            // Today: accent ring
            chipClasses += ' ring-2 ring-sky-400/70 ring-offset-2 ring-offset-transparent';
          }

          if (day.isSelected) {
            chipClasses += ' scale-105';
          }

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={chipClasses}
              title={`${day.label} - ${day.tasksCompleted}/4 ${t('dashboard.tasks')}`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
