import { useMemo, useState } from 'react';
import { format, subDays, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSwipeable } from 'react-swipeable';
import { useWeekContext } from '../../contexts/WeekContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import { AppModal } from '../ui/AppModal';
import WeightTile from '../WeightTile';

interface WeightDataPoint {
  date: string;
  day: string;
  weight: number;
}

/**
 * Compact weight chart showing 7-day or 30-day view
 * Tap to open full WeightTile, swipe to toggle range
 * Integrates with WeekContext for date selection
 */
export function WeightChartCompact() {
  const { t, language } = useTranslation();
  const { selectedDate } = useWeekContext();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [showModal, setShowModal] = useState(false);

  const tracking = useStore((state) => state.tracking);

  // Generate weight data for selected range
  const chartData = useMemo(() => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    const endDate = baseDate;

    const entries: WeightDataPoint[] = [];
    const locale = language === 'de' ? de : enUS;

    // Collect weight entries for the date range
    if (range === 'week') {
      // For week view: show one entry per day (Mon-Sun)
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

      daysInWeek.forEach((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayEntry = tracking[dateKey];
        const weight = dayEntry?.weight?.value;

        if (weight) {
          entries.push({
            date: dateKey,
            day: format(day, 'EEE', { locale }).slice(0, 1).toUpperCase(),
            weight,
          });
        }
      });
    } else {
      // For month view: show entries with data points (sparse)
      const startDate = subDays(endDate, 29); // 30 days
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const dayEntry = tracking[dateKey];
        const weight = dayEntry?.weight?.value;

        if (weight) {
          entries.push({
            date: dateKey,
            day: format(currentDate, 'd'),
            weight,
          });
        }

        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    return entries;
  }, [selectedDate, range, tracking, language]);

  // Calculate Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) {
      return [0, 100]; // Default if no data
    }

    const weights = chartData.map((d) => d.weight);
    const min = Math.floor(Math.min(...weights) / 5) * 5;
    const max = Math.ceil(Math.max(...weights) / 5) * 5;

    return [min, max];
  }, [chartData]);

  // Swipe handlers for toggling range
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (range === 'week') setRange('month');
    },
    onSwipedRight: () => {
      if (range === 'month') setRange('week');
    },
    trackMouse: false,
    delta: 125,
  });

  return (
    <>
      {/* Chart Card */}
      <div
        {...handlers}
        onClick={() => setShowModal(true)}
        className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={t('tracking.weight')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowModal(true);
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('tracking.weight')}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {range === 'week' ? '7 Days' : '30 Days'}
          </span>
        </div>

        {/* Chart */}
        <div style={{ height: '120px' }} className="w-full -mx-4 px-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="rgb(139, 92, 246)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'rgba(156, 163, 175, 0.8)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(229, 231, 235, 0.5)' }}
                  tickLine={false}
                  className="dark:text-gray-500"
                />
                <YAxis
                  domain={yAxisDomain}
                  tick={{ fill: 'rgba(156, 163, 175, 0.8)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(229, 231, 235, 0.5)' }}
                  tickLine={false}
                  width={30}
                  className="dark:text-gray-500"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'white',
                  }}
                  labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="rgb(139, 92, 246)"
                  strokeWidth={2}
                  dot={{ fill: 'rgb(139, 92, 246)', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
              {t('common.noData') || 'No weight data'}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          {range === 'week'
            ? 'Swipe for monthly view'
            : 'Swipe for weekly view'}
        </p>
      </div>

      {/* Full Weight Chart Modal */}
      <AppModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t('tracking.weight')}
        size="lg"
        footer={null}
      >
        <div className="p-4">
          <WeightTile />
        </div>
      </AppModal>
    </>
  );
}

export default WeightChartCompact;
