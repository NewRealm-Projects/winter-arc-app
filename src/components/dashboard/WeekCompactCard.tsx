import { useState } from 'react';
import { createPortal } from 'react-dom';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { calculateBMI } from '../../utils/calculations';
import { countActiveSports } from '../../utils/sports';

export default function WeekCompactCard() {
  const { t, language } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);
  const user = useStore((state) => state.user);
  const updateDayTracking = useStore((state) => state.updateDayTracking);

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);

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
      setShowWeightModal(false);
    }
  };

  // Get week weight data for graph
  const weekWeightData = weekDays.map((day) => {
    const dayTracking = tracking[day.date];
    return {
      day: day.label,
      weight: dayTracking?.weight?.value || null,
      bodyFat: dayTracking?.weight?.bodyFat || null,
    };
  });

  // Calculate min/max for scaling
  const weights = weekWeightData.map(d => d.weight).filter((w): w is number => w !== null);
  const bodyFats = weekWeightData.map(d => d.bodyFat).filter((bf): bf is number => bf !== null);

  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100;
  const minBodyFat = bodyFats.length > 0 ? Math.min(...bodyFats) : 0;
  const maxBodyFat = bodyFats.length > 0 ? Math.max(...bodyFats) : 30;

  // SVG dimensions
  const graphWidth = 280;
  const graphHeight = 90;
  const padding = 10;

  // Helper function to create smooth Bézier curve
  const createSmoothCurve = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const prev = i > 0 ? points[i - 1] : current;
      const nextNext = i < points.length - 2 ? points[i + 2] : next;

      // Calculate control points for smooth cubic Bézier curve
      const tension = 0.25; // Smoothing factor (0 = straight lines, 1 = very curvy)
      const cp1x = current.x + (next.x - prev.x) * tension;
      const cp1y = current.y + (next.y - prev.y) * tension;
      const cp2x = next.x - (nextNext.x - current.x) * tension;
      const cp2y = next.y - (nextNext.y - current.y) * tension;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }

    return path;
  };

  // Create SVG path for weight line
  const createWeightPath = () => {
    if (weights.length === 0) return '';

    const columnWidth = (graphWidth - padding * 2) / 7;
    const points = weekWeightData
      .map((d, i) => {
        if (d.weight === null) return null;
        const x = padding + (i + 0.5) * columnWidth;
        const y = graphHeight - padding - ((d.weight - minWeight) / (maxWeight - minWeight || 1)) * (graphHeight - padding * 2);
        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    return createSmoothCurve(points);
  };

  // Create SVG path for body fat line
  const createBodyFatPath = () => {
    if (bodyFats.length === 0) return '';

    const columnWidth = (graphWidth - padding * 2) / 7;
    const points = weekWeightData
      .map((d, i) => {
        if (d.bodyFat === null) return null;
        const x = padding + (i + 0.5) * columnWidth;
        const y = graphHeight - padding - ((d.bodyFat - minBodyFat) / (maxBodyFat - minBodyFat || 1)) * (graphHeight - padding * 2);
        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    return createSmoothCurve(points);
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
              title={`${day.label} - ${day.tasksCompleted}/5 ${t('dashboard.tasks')}`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {/* Weight & Body Fat Line Graph - Merged below week days */}
      <div className="mt-3 relative">
        {weights.length > 0 || bodyFats.length > 0 ? (
          <svg
            width="100%"
            height={graphHeight}
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            <line x1={padding} y1={padding} x2={graphWidth - padding} y2={padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1={padding} y1={graphHeight / 2} x2={graphWidth - padding} y2={graphHeight / 2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,2" />
            <line x1={padding} y1={graphHeight - padding} x2={graphWidth - padding} y2={graphHeight - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* Weight line (purple) */}
            {weights.length > 0 && (
              <>
                <path
                  d={createWeightPath()}
                  fill="none"
                  stroke="url(#weightGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Weight data points */}
                {weekWeightData.map((d, i) => {
                  if (!d.weight) return null;
                  const columnWidth = (graphWidth - padding * 2) / 7;
                  const x = padding + (i + 0.5) * columnWidth;
                  const y = graphHeight - padding - ((d.weight - minWeight) / (maxWeight - minWeight || 1)) * (graphHeight - padding * 2);
                  return (
                    <circle key={`w-${i}`} cx={x} cy={y} r="3.5" fill="#a78bfa" stroke="#ffffff" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                      <title>{d.weight}kg</title>
                    </circle>
                  );
                })}
              </>
            )}

            {/* Body Fat line (orange) */}
            {bodyFats.length > 0 && (
              <>
                <path
                  d={createBodyFatPath()}
                  fill="none"
                  stroke="url(#bodyFatGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4,3"
                />
                {/* Body Fat data points */}
                {weekWeightData.map((d, i) => {
                  if (!d.bodyFat) return null;
                  const columnWidth = (graphWidth - padding * 2) / 7;
                  const x = padding + (i + 0.5) * columnWidth;
                  const y = graphHeight - padding - ((d.bodyFat - minBodyFat) / (maxBodyFat - minBodyFat || 1)) * (graphHeight - padding * 2);
                  return (
                    <circle key={`bf-${i}`} cx={x} cy={y} r="3" fill="#fb923c" stroke="#ffffff" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                      <title>{d.bodyFat}% KFA</title>
                    </circle>
                  );
                })}
              </>
            )}

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="weightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="bodyFatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#fdba74" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <div className="h-16 flex items-center justify-center text-xs text-white/40">
            Noch keine Gewichtsdaten
          </div>
        )}

        {/* Legend */}
        {(weights.length > 0 || bodyFats.length > 0) && (
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
            {weights.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-400 rounded-full"></div>
                <span className="text-white/60">Gewicht</span>
              </div>
            )}
            {bodyFats.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-orange-400 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(to right, #fb923c 0, #fb923c 3px, transparent 3px, transparent 6px)' }}></div>
                <span className="text-white/60">KFA %</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weight Tracking Section */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
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
            <button
              onClick={() => setShowWeightModal(true)}
              className="px-2 py-1 text-[10px] bg-purple-600/30 text-purple-200 rounded-md hover:bg-purple-600/50 transition-colors"
            >
              {latestWeight > 0 ? '✏️' : '+ ⚖️'}
            </button>
          </div>
        </div>
      </div>

      {/* Weight Input Modal - Rendered via Portal */}
      {showWeightModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowWeightModal(false)}>
          <div className="rounded-2xl bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">⚖️ {t('tracking.weight')}</h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="z.B. 75.5"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-400 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">Körperfettanteil % (optional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="z.B. 15.5"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveWeight}
                  disabled={!weight || parseFloat(weight) <= 0}
                  className="flex-1 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
