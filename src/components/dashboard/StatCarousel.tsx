import { memo, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import CarouselItem from './CarouselItem';

export interface CarouselStat {
  id: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight';
  icon: string; // emoji
  label: string;
  value: string | number;
  progress: number; // 0-100 (maps to 0-20% of circle)
  color: string;
  onTap?: () => void;
}

interface StatCarouselProps {
  stats: CarouselStat[];
  autoRotateInterval?: number; // Default: 4000ms
  isLoading?: boolean;
}

/**
 * Stat Carousel Component (Mobile)
 * Displays one stat at a time with auto-rotation and swipe gestures
 *
 * Features:
 * - Auto-rotates every 4 seconds
 * - Pauses on user interaction (swipe, tap)
 * - Resumes after 10 seconds of inactivity
 * - Swipe threshold: 125px (1/3 of 375px viewport)
 * - Pagination dots (5 for 5 stats)
 * - Smooth 60fps animations (CSS transforms)
 */
const StatCarousel = memo(function StatCarousel({
  stats,
  autoRotateInterval = 4000,
  isLoading = false,
}: StatCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotation timer
  useEffect(() => {
    if (isPaused || stats.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % stats.length);
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [isPaused, autoRotateInterval, stats.length]);

  // Pause rotation on user interaction
  const pauseRotation = () => {
    setIsPaused(true);

    // Clear existing timeout if any
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    // Resume after 10 seconds
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      pauseTimeoutRef.current = null;
    }, 10000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  // Swipe handlers: 125px threshold (1/3 of 375px viewport)
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      pauseRotation();
      setActiveIndex((prev) => (prev + 1) % stats.length);
    },
    onSwipedRight: () => {
      pauseRotation();
      setActiveIndex((prev) => (prev - 1 + stats.length) % stats.length);
    },
    delta: 125, // 1/3 of 375px screen width
    preventScrollOnSwipe: true,
    trackMouse: true, // For desktop testing
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        pauseRotation();
        setActiveIndex((prev) => (prev + 1) % stats.length);
      } else if (e.key === 'ArrowLeft') {
        pauseRotation();
        setActiveIndex((prev) => (prev - 1 + stats.length) % stats.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stats.length]);

  if (stats.length === 0) {
    return <div className="w-full h-64 bg-[var(--card-bg)] rounded-xl" />;
  }

  return (
    <div
      {...handlers}
      className="w-full touch-pan-y"
      data-testid="stat-carousel"
      role="region"
      aria-label="Statistics carousel"
      aria-live="polite"
    >
      {/* Carousel Container */}
      <div className="relative w-full h-64 overflow-hidden rounded-xl">
        {/* Carousel Items */}
        {stats.map((stat, index) => {
          const isActive = index === activeIndex;
          const offset = (index - activeIndex) * 100;

          return (
            <div
              key={stat.id}
              style={{
                transform: `translateX(${offset}%)`,
                opacity: isActive ? 1 : 0,
                transition: 'all 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className="absolute inset-0 w-full h-full"
              aria-hidden={!isActive}
            >
              {isLoading ? (
                <div className="w-full h-full bg-gradient-to-r from-[var(--card-bg)] via-gray-300 dark:via-gray-600 to-[var(--card-bg)] animate-pulse" />
              ) : (
                <CarouselItem
                  stat={stat}
                  isActive={isActive}
                  onTap={() => {
                    pauseRotation();
                    stat.onTap?.();
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div
        className="flex justify-center gap-2 mt-3"
        role="tablist"
        aria-label="Carousel page indicator"
      >
        {stats.map((stat, index) => (
          <button
            key={stat.id}
            onClick={() => {
              pauseRotation();
              setActiveIndex(index);
            }}
            className={`h-2 rounded-full transition-all duration-200 ${
              index === activeIndex
                ? 'w-6 bg-[var(--text-primary)]'
                : 'w-2 bg-[var(--text-tertiary)]'
            }`}
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`${stat.label} (${index + 1} of ${stats.length})`}
            data-testid={`carousel-dot-${index}`}
          />
        ))}
      </div>

      {/* Stat Indicator */}
      <div className="text-center mt-2 text-xs text-[var(--text-tertiary)]">
        {activeIndex + 1} / {stats.length}
      </div>
    </div>
  );
});

export default StatCarousel;
