import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useCarouselStats } from '../../hooks/useCarouselStats';
import { calculateBandAngles, createArcPath } from '../../utils/progressCalculation';
import { useTranslation } from '../../hooks/useTranslation';

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
    if (prefersReducedMotion) {
      setAutoRotateEnabled(false);
    }
  }, [prefersReducedMotion]);

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

  // SVG paths for progress bands
  const progressBands = stats.map((stat, index) => {
    const { startAngle, endAngle } = calculateBandAngles(index, stat.progress);
    const path = createArcPath(CENTER, CENTER, RADIUS, startAngle, endAngle);

    return {
      stat,
      path,
      index,
    };
  });

  // Handle segment click - open modal for clicked stat
  const handleSegmentClick = (index: number) => {
    if (onSegmentClick) {
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
          {/* Background circle */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.1"
          />

          {/* Progress bands (5 colored arcs) - Clickable and highlighted when active */}
          {progressBands.map((band, idx) => {
            const isActive = idx === currentIndex;
            return (
              <path
                key={`band-${idx}`}
                d={band.path}
                stroke={band.stat.color}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.8}
                style={{
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transformOrigin: `${CENTER}px ${CENTER}px`,
                  transition: 'all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                  cursor: 'pointer',
                }}
                onClick={() => handleSegmentClick(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSegmentClick(idx);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${band.stat.label} details`}
              />
            );
          })}

        </svg>

        {/* Carousel Content (centered inside circle) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
          {/* Stat Value */}
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
        </div>
      </div>

      {/* Mobile-only: Stat title below circle */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {currentStat.label}
        </p>
      </div>

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
