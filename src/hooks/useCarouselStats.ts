import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CarouselStat } from '../components/dashboard/StatCarousel';

/**
 * Hook to transform Zustand store data into carousel stat format
 * Calculates progress (0-100) for each of 5 stats
 *
 * Stats:
 * - Sports: active sport sessions (count per day)
 * - Pushup: pushups done vs max (reps)
 * - Hydration: water consumed vs goal (liters)
 * - Nutrition: protein consumed vs goal (grams)
 * - Weight: current weight (kg)
 */
export function useCarouselStats(): CarouselStat[] {
  const tracking = useStore((state) => state.tracking);
  const selectedDate = useStore((state) => state.selectedDate);
  const user = useStore((state) => state.user);

  return useMemo(() => {
    const dayTracking = tracking[selectedDate];

    if (!dayTracking || !user) {
      return [];
    }

    // Calculate progress for each stat (0-100)
    const calculateSportsProgress = (): number => {
      // Count active sports (any sport with active: true)
      let activeSports = 0;
      const totalSports = 5; // hiit, cardio, gym, swimming, soccer (rest doesn't count)

      if (dayTracking.sports) {
        const sportKeys = ['hiit', 'cardio', 'gym', 'schwimmen', 'soccer'] as const;
        sportKeys.forEach((sport) => {
          const sportEntry = dayTracking.sports[sport];
          if (typeof sportEntry === 'object' && sportEntry?.active) {
            activeSports++;
          } else if (sportEntry === true) {
            activeSports++;
          }
        });
      }

      return (activeSports / totalSports) * 100;
    };

    const calculatePushupProgress = (): number => {
      const total = dayTracking.pushups?.total || 0;
      const goal = user.maxPushups || 100;
      return Math.min((total / goal) * 100, 100);
    };

    const calculateHydrationProgress = (): number => {
      const waterLiters = (dayTracking.water || 0) / 1000; // Convert ml to liters
      const goal = user.hydrationGoalLiters || 3;
      return Math.min((waterLiters / goal) * 100, 100);
    };

    const calculateNutritionProgress = (): number => {
      const protein = dayTracking.protein || 0;
      const goal = user.proteinGoalGrams || (user.weight * 2); // 2g per kg bodyweight
      return Math.min((protein / goal) * 100, 100);
    };

    const calculateWeightProgress = (): number => {
      // Weight is just the current value, no progress calculation
      // 50kg = 50%, 100kg = 100%, etc (scale to user's weight)
      const weight = dayTracking.weight?.value || user.weight || 0;
      return weight > 0 ? Math.min((weight / 100) * 100, 100) : 0;
    };

    const stats: CarouselStat[] = [
      {
        id: 'sports',
        icon: '🏋️',
        label: 'Sports',
        value: dayTracking.sports
          ? Object.values(dayTracking.sports).filter((s) => typeof s === 'object' ? s?.active : s === true).length
          : 0,
        progress: calculateSportsProgress(),
        color: '#10B981', // Green-500
      },
      {
        id: 'pushup',
        icon: '💪',
        label: 'Pushups',
        value: `${dayTracking.pushups?.total || 0} / ${user.maxPushups}`,
        progress: calculatePushupProgress(),
        color: '#3B82F6', // Blue-500
      },
      {
        id: 'hydration',
        icon: '💧',
        label: 'Hydration',
        value: `${((dayTracking.water || 0) / 1000).toFixed(1)} L`,
        progress: calculateHydrationProgress(),
        color: '#06B6D4', // Cyan-500
      },
      {
        id: 'nutrition',
        icon: '🍗',
        label: 'Nutrition',
        value: `${dayTracking.protein || 0} g`,
        progress: calculateNutritionProgress(),
        color: '#F59E0B', // Amber-500
      },
      {
        id: 'weight',
        icon: '⚖️',
        label: 'Weight',
        value: `${dayTracking.weight?.value || user.weight} kg`,
        progress: calculateWeightProgress(),
        color: '#8B5CF6', // Purple-500
      },
    ];

    return stats;
  }, [tracking, selectedDate, user]);
}
