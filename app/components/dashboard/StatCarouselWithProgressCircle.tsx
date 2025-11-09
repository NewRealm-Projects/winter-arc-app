import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useCarouselStats } from '../../hooks/useCarouselStats';
import { createArcPath } from '../../utils/progressCalculation';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';
import { useWeekContext } from '../../contexts/WeekContext';

const CIRCLE_SIZE = 240; // SVG viewBox size
const CENTER = CIRCLE_SIZE / 2; // Center of circle
const RADIUS = 90; // Outer radius for bands
const AUTO_ROTATE_INTERVAL = 4000; // ms
const PAUSE_AFTER_INTERACTION = 10000; // ms
const SWIPE_THRESHOLD = 125; // px (1/3 of viewport width ~375px)

export interface StatCarouselWithProgressCircleProps {
  onSegmentClick?: (stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight') => void;
}

/**
 * Unified carousel + progress circle component
 * Displays 5 stats in a circular carousel with dynamic progress bands
 * SVG circle as wrapper, carousel content inside
 * Progress bands are clickable and active segment is highlighted
 */
export function StatCarouselWithProgressCircle({ onSegmentClick }: StatCarouselWithProgressCircleProps) {
  const { t } = useTranslation();
  const stats = useCarouselStats();
  const { selectedDate } = useWeekContext();
  const tracking = useStore((state) => state.tracking[selectedDate]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(true);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Disable auto-rotate if prefers-reduced-motion
  useEffect(() => {
    if (prefersReducedMotion && autoRotateEnabled) {
      // Use microtask to avoid synchronous setState
      Promise.resolve().then(() => setAutoRotateEnabled(false));
    }
  }, [prefersReducedMotion, autoRotateEnabled]);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotateEnabled) return;

    const scheduleNextRotation = () => {
      autoRotateTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % stats.length);
        scheduleNextRotation();
      }, AUTO_ROTATE_INTERVAL);
    };

    scheduleNextRotation();

    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
    };
  }, [autoRotateEnabled, stats.length]);

  // Pause auto-rotation on user interaction
  const pauseAutoRotate = useCallback(() => {
    setAutoRotateEnabled(false);

    // Clear existing pause timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    // Re-enable after pause duration
    pauseTimeoutRef.current = setTimeout(() => {
      if (!prefersReducedMotion) {
        setAutoRotateEnabled(true);
      }
    }, PAUSE_AFTER_INTERACTION);
  }, [prefersReducedMotion]);

  // Handle swipe gestures
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((prev) => (prev + 1) % stats.length);
      pauseAutoRotate();
    },
    onSwipedRight: () => {
      setCurrentIndex((prev) => (prev - 1 + stats.length) % stats.length);
      pauseAutoRotate();
    },
    trackMouse: false,
    trackTouch: true,
    delta: SWIPE_THRESHOLD,
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if container is focused or user intent is clear
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + stats.length) % stats.length);
        pauseAutoRotate();
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % stats.length);
        pauseAutoRotate();
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Trigger stat details (would open modal - handled by parent)
        e.preventDefault();
      } else if (e.key === 'Escape') {
        // Close any open modals (handled by parent)
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stats.length, pauseAutoRotate]);

  const currentStat = stats[currentIndex];

  // Calculate continuous progress from all stats (real tracking data)
  const progressSegments = useMemo(() => {
    const statGoals = {
      sports: 5000, // min
      pushup: 50,   // reps
      hydration: 3000, // ml
      nutrition: 180,  // g
      weight: 80,   // kg (for comparison, using as-is)
    };

    return [
      {
        id: 'sports' as const,
        label: 'Sports',
        value: (tracking?.sports && typeof tracking.sports === 'object' && 'cardio' in tracking.sports)
          ? (tracking.sports.cardio && typeof tracking.sports.cardio === 'object' && 'duration' in tracking.sports.cardio)
            ? (tracking.sports.cardio as unknown as Record<string, number | boolean>).duration || 0
            : 0
          : 0,
        goal: statGoals.sports,
        color: '#10B981',
      },
      {
        id: 'pushup' as const,
        label: 'Pushup',
        value: tracking?.pushups?.total || 0,
        goal: statGoals.pushup,
        color: '#3B82F6',
      },
      {
        id: 'nutrition' as const,
        label: 'Nutrition',
        value: tracking?.protein || 0,
        goal: statGoals.nutrition,
        color: '#F59E0B',
      },
      {
        id: 'hydration' as const,
        label: 'Hydration',
        value: tracking?.water || 0,
        goal: statGoals.hydration,
        color: '#06B6D4',
      },
      {
        id: 'weight' as const,
        label: 'Weight',
        value: tracking?.weight?.value || 0,
        goal: statGoals.weight,
        color: '#8B5CF6',
      },
    ].map((segment) => {
      const numValue = typeof segment.value === 'number' ? segment.value : 0;
      const progress = Math.min(numValue / segment.goal, 1) * 100;
      const degrees = (progress / 100) * 72; // Allocate portion of 72° based on progress
      return { ...segment, progress, degrees };
    });
  }, [tracking]);

  // Calculate total progress degrees (sum of all stat degrees)
  const totalProgressDegrees = useMemo(() => {
    return progressSegments.reduce((sum, seg) => sum + seg.degrees, 0);
  }, [progressSegments]);

  // Create continuous arc path from 90° (top) clockwise through totalProgressDegrees
  const continuousArcPath = useMemo(() => {
    const startAngle = 90;
    const endAngle = (90 + totalProgressDegrees) % 360;
    if (totalProgressDegrees === 0) {
      return ''; // No progress yet
    }
    return createArcPath(CENTER, CENTER, RADIUS, startAngle, endAngle);
  }, [totalProgressDegrees]);

  // Create SVG gradient with colors for each segment
  const createGradientStops = useMemo(() => {
    let currentDegree = 0;
    const stops = progressSegments.map((segment) => {
      const startPercent = (currentDegree / totalProgressDegrees) * 100;
      const endPercent = ((currentDegree + segment.degrees) / totalProgressDegrees) * 100;
      currentDegree += segment.degrees;
      return {
        segment,
        startPercent: Math.max(0, startPercent),
        endPercent: Math.min(100, endPercent),
      };
    });
    return stops;
  }, [progressSegments, totalProgressDegrees]);

  // Handle segment click - open modal for clicked stat
  const handleSegmentClick = (index: number) => {
    if (onSegmentClick && stats[index]) {
      onSegmentClick(stats[index].id as 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight');
    }
  };

  return (
    <div
      {...handlers}
      className="flex flex-col items-center gap-6 cursor-grab active:cursor-grabbing"
      role="region"
      aria-label={t('tracking.statistics')}
      tabIndex={0}
    >
      {/* SVG Progress Circle with Carousel Inside */}
      <div className="relative w-80 h-80 mx-auto">
        <svg
          viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
          className="w-full h-full drop-shadow-lg"
          aria-hidden="true"
        >
          <defs>
            {/* SVG Gradient with colors for each stat segment */}
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {createGradientStops.map((stop, idx) => (
                <stop
                  key={`stop-${idx}`}
                  offset={`${stop.startPercent}%`}
                  stopColor={stop.segment.color}
                  stopOpacity="1"
                />
              ))}
              {(() => {
                const lastStop = createGradientStops[createGradientStops.length - 1];
                return lastStop ? (
                  <stop
                    offset="100%"
                    stopColor={lastStop.segment.color}
                    stopOpacity="1"
                  />
                ) : null;
              })()}
            </linearGradient>
          </defs>

          {/* Background circle (remaining progress shown as faded) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            opacity="0.1"
          />

          {/* Continuous progress arc with multi-color gradient */}
          {continuousArcPath && (
            <path
              d={continuousArcPath}
              stroke="url(#progressGradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              style={{
                transition: 'all 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              aria-label={`Overall progress: ${Math.round((totalProgressDegrees / 360) * 100)}%`}
            />
          )}

          {/* Stat segment markers and interactive regions */}
          {progressSegments.map((segment, idx) => {
            // Calculate the start and end angles for this stat's allocation (72° each)
            const segmentStartAngle = 90 + (idx * 72);
            const segmentEndAngle = segmentStartAngle + 72;
            const segmentPath = createArcPath(CENTER, CENTER, RADIUS + 15, segmentStartAngle, segmentEndAngle);
            const isCurrentStat = idx === currentIndex;

            return (
              <path
                key={`segment-${idx}`}
                d={segmentPath}
                stroke="transparent"
                strokeWidth="24"
                fill="none"
                className="cursor-pointer"
                onClick={() => handleSegmentClick(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSegmentClick(idx);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${segment.label}: ${Math.round(segment.progress)}%`}
                style={{
                  opacity: isCurrentStat ? 0.3 : 0.1,
                  transition: 'opacity 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              />
            );
          })}
        </svg>

        {/* Carousel Content (centered inside circle) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
          {/* Stat Value */}
          {currentStat && (
            <>
              <div className="text-center">
                <p className="text-sm font-medium opacity-75 mb-1">
                  {currentStat.label}
                </p>
                <p className="text-2xl font-bold">
                  {currentStat.value}
                </p>
              </div>

              {/* Progress percentage */}
              <div className="text-xs font-semibold opacity-60">
                {currentStat.progress}% {t('common.complete')}
              </div>

              {/* Swipe hint (mobile only) */}
              <div className="text-xs opacity-40 text-center mt-2">
                {t('common.swipeOrArrows')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile-only: Stat title below circle */}
      {currentStat && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentStat.label}
          </p>
        </div>
      )}

      {/* Keyboard navigation hint (optional, can be removed) */}
      {!prefersReducedMotion && (
        <div className="text-xs opacity-50 text-center">
          {t('common.useArrowKeys')}
        </div>
      )}
    </div>
  );
}

export default StatCarouselWithProgressCircle;
