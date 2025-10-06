import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { calculateBMI } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';
import { glassCardClasses, designTokens } from '../theme/tokens';

function WeightTile() {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [days, setDays] = useState(7);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const isToday = activeDate === todayKey;
  const activeTracking = tracking[activeDate];
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

  // Generate chart data
  const chartData = [];

  // Use selected date as reference point for the graph
  const referenceDate = new Date(activeDate);

  // Add onboarding weight as the first data point if available and within the date range
  if (user?.weight && user?.createdAt) {
    try {
      // Handle different date formats from Firestore
      let createdAtDate: Date;

      if (typeof user.createdAt === 'string') {
        createdAtDate = new Date(user.createdAt);
      } else if (user.createdAt instanceof Date) {
        createdAtDate = user.createdAt;
      } else if (typeof user.createdAt === 'object' && 'seconds' in user.createdAt) {
        // Firestore Timestamp object
  createdAtDate = new Date((user.createdAt as { seconds: number }).seconds * 1000);
      } else {
        // Try to convert to Date
  createdAtDate = new Date(user.createdAt as string | number | Date);
      }

      // Validate the date
      if (!isNaN(createdAtDate.getTime())) {
        const createdDate = format(createdAtDate, 'yyyy-MM-dd');
        const oldestDateInRange = format(subDays(referenceDate, days - 1), 'yyyy-MM-dd');

        // Include onboarding weight if it's within the selected date range
        if (createdDate >= oldestDateInRange && createdDate <= activeDate) {
          chartData.push({
            date: format(createdAtDate, 'dd.MM'),
            weight: user.weight,
            bodyFat: user.bodyFat,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error parsing onboarding date:', error, 'createdAt:', user.createdAt);
    }
  }

  // Add tracked weights
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(referenceDate, i), 'yyyy-MM-dd');
    const dayTracking = tracking[date];
    if (dayTracking?.weight) {
      chartData.push({
        date: format(new Date(date), 'dd.MM'),
        weight: dayTracking.weight.value,
        bodyFat: dayTracking.weight.bodyFat,
      });
    }
  }

  // Sort by date to ensure proper chronological order
  chartData.sort((a, b) => {
    const [dayA, monthA] = a.date.split('.');
    const [dayB, monthB] = b.date.split('.');
    return new Date(2024, parseInt(monthA) - 1, parseInt(dayA)).getTime() -
           new Date(2024, parseInt(monthB) - 1, parseInt(dayB)).getTime();
  });

  const latestWeight = activeTracking?.weight?.value ?? user?.weight ?? 0;
  const latestBMI = activeTracking?.weight?.bmi;

  return (
    <div className={`${glassCardClasses} ${designTokens.padding.compact} text-white`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">⚖️</div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('tracking.weight')}
            </h3>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">{displayDayLabel}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {latestWeight}kg
          </div>
          {latestBMI && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('tracking.bmi')}: {latestBMI}
            </div>
          )}
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
              { days: 7, label: t('tracking.week') },
              { days: 30, label: t('tracking.month') },
              { days: 90, label: t('tracking.allTime') },
            ].map((range) => (
              <button
                key={range.days}
                onClick={() => setDays(range.days)}
                className={`flex-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  days === range.days
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range.label}
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

      {/* Input */}
      <div className="text-center">
        {showInput ? (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Gewicht (kg)"
                className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                autoFocus
              />
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="KFA (%)"
                className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={saveWeight}
                className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Speichern
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setWeight('');
                  setBodyFat('');
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors font-medium"
          >
            {t('tracking.addWeight')}
          </button>
        )}
      </div>
    </div>
  );
}

export default WeightTile;
