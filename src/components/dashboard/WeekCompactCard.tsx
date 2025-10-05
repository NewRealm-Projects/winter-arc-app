import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { calculateBMI } from '../../utils/calculations';

export default function WeekCompactCard() {
  const { t, language } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);
  const user = useStore((state) => state.user);
  const updateDayTracking = useStore((state) => state.updateDayTracking);

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

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
    const hasSports = Object.values(dayTracking?.sports || {}).some(Boolean);
    const hasWater = (dayTracking?.water || 0) >= 2000;
    const hasProtein = (dayTracking?.protein || 0) >= 100;
    const hasWeight = !!dayTracking?.weight?.value;

    const tasksCompleted = [hasPushups, hasSports, hasWater, hasProtein, hasWeight].filter(Boolean).length;
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

  const totalTasksDone = weekDays.reduce((sum, day) => sum + day.tasksCompleted, 0);
  const minTasks = 3;

  // Weight tracking logic
  const activeTracking = tracking[activeDate];
  const latestWeight = activeTracking?.weight?.value ?? user?.weight ?? 0;
  const latestBMI = activeTracking?.weight?.bmi;

  const saveWeight = () => {
    const weightValue = parseFloat(weight);
    if (!isNaN(weightValue) && weightValue > 0) {
      const bmi = user?.height ? calculateBMI(weightValue, user.height) : undefined;

      updateDayTracking(activeDate, {
        weight: {
          value: weightValue,
          bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
          bmi,
        },
      });
      setWeight('');
      setBodyFat('');
    }
  };

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
        <div className="text-xs text-white/70 whitespace-nowrap flex-shrink-0">
          {t('dashboard.minTasks', { minTasks: String(minTasks), totalTasksDone: String(totalTasksDone), tasks: t('dashboard.tasks') })}
        </div>
      </div>

      {/* Week Days Chips */}
      <div className="flex flex-wrap gap-1.5 lg:gap-2">
        {weekDays.map((day) => {
          let chipClasses = 'inline-flex items-center justify-center h-9 min-w-[2.5rem] px-2 rounded-full border text-sm font-medium transition-all cursor-pointer select-none';

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
              title={`${day.label} - ${day.tasksCompleted}/5 ${t('dashboard.tasks')}`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {/* Info Text */}
      <div className="mt-3 text-xs text-white/60 text-center">
        {t('dashboard.streakInfo')} (3/5 {t('dashboard.tasks')})
      </div>

      {/* Weight Tracking Section */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <span className="text-xs font-medium text-white/70">{t('tracking.weight')}</span>
          </div>
          <div className="flex items-center gap-2">
            {latestWeight > 0 && (
              <>
                <span className="text-xs font-bold text-purple-400">{latestWeight}kg</span>
                {latestBMI && (
                  <span className="text-[10px] text-white/60">{t('tracking.bmi')}: {latestBMI}</span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
            className="flex-1 px-2 py-1 text-xs rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-1 focus:ring-purple-400 outline-none"
          />
          <input
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="KFA %"
            className="w-16 px-2 py-1 text-xs rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-1 focus:ring-purple-400 outline-none"
          />
          <button
            onClick={saveWeight}
            disabled={!weight || parseFloat(weight) <= 0}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
