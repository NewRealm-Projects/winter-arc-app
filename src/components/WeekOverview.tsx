import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useStore } from '../store/useStore';

function WeekOverview() {
  const tracking = useStore((state) => state.tracking);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTracking = tracking[dateStr];
    const isToday = isSameDay(date, today);
    const isCompleted = dayTracking?.completed || false;

    return {
      date,
      dateStr,
      dayName: format(date, 'EEE', { locale: de }),
      dayNumber: format(date, 'd'),
      isToday,
      isCompleted,
    };
  });

  const completedDays = weekDays.filter((day) => day.isCompleted).length;
  const progressPercent = (completedDays / 7) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Diese Woche
        </h2>
        <div className="text-sm font-medium text-winter-600 dark:text-winter-400">
          {completedDays} / 7 Tage
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-winter-500 to-winter-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {Math.round(progressPercent)}% abgeschlossen
        </div>
      </div>

      {/* Week Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day.dateStr}
            className={`flex flex-col items-center p-3 rounded-lg transition-all ${
              day.isToday
                ? 'bg-winter-100 dark:bg-winter-900 ring-2 ring-winter-500'
                : day.isCompleted
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}
          >
            <span
              className={`text-xs font-medium mb-2 ${
                day.isToday
                  ? 'text-winter-700 dark:text-winter-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {day.dayName}
            </span>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                day.isCompleted
                  ? 'bg-green-500 text-white'
                  : day.isToday
                  ? 'bg-winter-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}
            >
              {day.isCompleted ? '✓' : day.dayNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeekOverview;
