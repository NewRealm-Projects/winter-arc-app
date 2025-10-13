import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { calculateBMI } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedTracking, useCombinedDailyTracking } from '../hooks/useCombinedTracking';

function WeightTile() {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [range, setRange] = useState<'week' | 'month' | 'all'>('week');

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const combinedTracking = useCombinedTracking();

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
  const combinedDaily = useCombinedDailyTracking(activeDate);
  const displayDayLabel = isToday
    ? t('tracking.today')
    : format(new Date(activeDate), 'dd.MM.');

  const saveWeight = () => {
    const weightValue = parseFloat(weight);
    if (!isNaN(weightValue) && weightValue > 0) {
      const bmi = user?.height
        ? calculateBMI(weightValue, user.height)
        : undefined;

      updateDayTracking(activeDate, {
        weight: {
          value: weightValue,
          bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
          bmi,
        },
      });
      setWeight('');
      setBodyFat('');
      setShowInput(false);
    }
  };

  const chartData = useMemo(() => {
    const entries: { dateKey: string; weight: number; bodyFat?: number }[] = [];

    const referenceDate = new Date(activeDate);
    const rangeToDays: Record<'week' | 'month', number> = {
      week: 7,
      month: 30,
    };

    const days = range === 'all' ? null : rangeToDays[range];
    const oldestDateInRange = days ? format(subDays(referenceDate, days - 1), 'yyyy-MM-dd') : null;

    const isWithinRange = (dateKey: string) => {
      if (dateKey > activeDate) {
        return false;
      }
      if (!oldestDateInRange) {
        return true;
      }
      return dateKey >= oldestDateInRange;
    };

    if (user?.weight && user?.createdAt) {
      try {
        let createdAtDate: Date;

        if (typeof user.createdAt === 'string') {
          createdAtDate = new Date(user.createdAt);
        } else if (user.createdAt instanceof Date) {
          createdAtDate = user.createdAt;
        } else if (typeof user.createdAt === 'object' && user.createdAt !== null && 'seconds' in user.createdAt) {
          createdAtDate = new Date((user.createdAt as { seconds: number }).seconds * 1000);
        } else {
          createdAtDate = new Date(user.createdAt as string | number | Date);
        }

        if (!isNaN(createdAtDate.getTime())) {
          const createdDateKey = format(createdAtDate, 'yyyy-MM-dd');
          if (isWithinRange(createdDateKey)) {
            entries.push({
              dateKey: createdDateKey,
              weight: user.weight,
              bodyFat: user.bodyFat,
            });
          }
        }
      } catch (error) {
        console.error('❌ Error parsing onboarding date:', error, 'createdAt:', user.createdAt);
      }
    }

    Object.entries(combinedTracking).forEach(([dateKey, dayTracking]) => {
      if (!dayTracking.weight?.value) {
        return;
      }
      if (!isWithinRange(dateKey)) {
        return;
      }
      entries.push({
        dateKey,
        weight: dayTracking.weight.value,
        bodyFat: dayTracking.weight.bodyFat,
      });
    });

    entries.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());

    const dateFormat = range === 'all' ? 'dd.MM.yy' : 'dd.MM';

    return entries.map((entry) => ({
      date: format(new Date(entry.dateKey), dateFormat),
      weight: entry.weight,
      bodyFat: entry.bodyFat,
    }));
  }, [activeDate, combinedTracking, range, user?.bodyFat, user?.createdAt, user?.weight]);

  const latestWeight = combinedDaily?.weight?.value ?? activeTracking?.weight?.value ?? user?.weight ?? 0;
  const latestBMI = activeTracking?.weight?.bmi ?? combinedDaily?.weight?.bmi;
  const isTracked = Boolean(combinedDaily?.weight?.value ?? activeTracking?.weight?.value);

  return (
    <div className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xl">⚖️</div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('tracking.weight')}
          </h3>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">{displayDayLabel}</div>
        </div>
      </div>

      {/* Combined Chart - Weight & Body Fat */}
      {chartData.length > 0 ? (
        <>
          <div className="mb-1.5">
            <div className="flex items-center gap-3 mb-1 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('tracking.weight')}</span>
              </div>
              {chartData.some(d => d.bodyFat) && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('tracking.bodyFat')}</span>
                </div>
              )}
            </div>
            <div className="h-20 responsive-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis
                    yAxisId="weight"
                    stroke="#9333ea"
                    style={{ fontSize: '10px' }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  {chartData.some(d => d.bodyFat) && (
                    <YAxis
                      yAxisId="bodyFat"
                      orientation="right"
                      stroke="#f97316"
                      style={{ fontSize: '10px' }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    yAxisId="weight"
                    type="monotone"
                    dataKey="weight"
                    stroke="#9333ea"
                    strokeWidth={1.5}
                    dot={{ fill: '#9333ea', r: 3 }}
                    name="Weight (kg)"
                  />
                  {chartData.some(d => d.bodyFat) && (
                    <Line
                      yAxisId="bodyFat"
                      type="monotone"
                      dataKey="bodyFat"
                      stroke="#f97316"
                      strokeWidth={1.5}
                      dot={{ fill: '#f97316', r: 3 }}
                      name="Body Fat (%)"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1.5 mb-1.5">
            {[
              { value: 'week' as const, label: t('tracking.week') },
              { value: 'month' as const, label: t('tracking.month') },
              { value: 'all' as const, label: t('tracking.allTime') },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => { setRange(option.value); }}
                className={`flex-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  range === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mb-1.5 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Noch keine Gewichtsdaten vorhanden
          </p>
        </div>
      )}

      <div className="mt-3 mb-2 text-center">
        <div className="text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {t('tracking.weight')}
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {latestWeight}kg
          </div>
          {activeTracking?.weight?.value && (
            <button
              onClick={() => {
                if (activeTracking?.weight) {
                  setWeight(activeTracking.weight.value.toString());
                  setBodyFat(activeTracking.weight.bodyFat?.toString() || '');
                  setShowInput(true);
                }
              }}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              title={t('tracking.edit')}
            >
              ✏️
            </button>
          )}
        </div>
        {latestBMI && (
          <div className="text-[11px] text-gray-600 dark:text-gray-400">
            {t('tracking.bmi')}: {latestBMI}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="text-center">
        <button
          onClick={() => { setShowInput(true); }}
          className="w-full px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors font-medium"
        >
          {t('tracking.addWeight')}
        </button>
      </div>

      {/* Weight Modal */}
      {showInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ⚖️ {t('tracking.weight')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('tracking.setExactAmount')}
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); }}
                placeholder="Gewicht (kg)"
                className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                autoFocus
              />
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => { setBodyFat(e.target.value); }}
                placeholder="KFA (%)"
                className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveWeight}
                disabled={!weight || parseFloat(weight) <= 0}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('tracking.save')}
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setWeight('');
                  setBodyFat('');
                }}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('tracking.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeightTile;
