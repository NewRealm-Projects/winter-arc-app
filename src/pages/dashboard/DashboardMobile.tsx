import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCarouselWithProgressCircle from '../../components/dashboard/StatCarouselWithProgressCircle';
import CompressedWeekCard from '../../components/dashboard/CompressedWeekCard';
import WeightChartCompact from '../../components/dashboard/WeightChartCompact';
import ArcMenu from '../../components/dashboard/ArcMenu';
import WeeklyTile from '../../components/dashboard/WeeklyTile';
import WorkoutLogModal, { type WorkoutLogData } from '../../components/notes/WorkoutLogModal';
import PushupLogModal, { type PushupLogData } from '../../components/notes/PushupLogModal';
import DrinkLogModal, { type DrinkLogData } from '../../components/notes/DrinkLogModal';
import FoodLogModal, { type FoodLogData } from '../../components/notes/FoodLogModal';
import WeightLogModal, { type WeightLogData } from '../../components/notes/WeightLogModal';
import { AppModal } from '../../components/ui/AppModal';
import { WeekProvider } from '../../contexts/WeekContext';
import { useWeekContext } from '../../contexts/WeekContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useTrackingEntries } from '../../hooks/useTrackingEntries';
import { useTracking } from '../../hooks/useTracking';
import { useWeeklyTop3 } from '../../hooks/useWeeklyTop3';
import { useStore } from '../../store/useStore';
import { logger } from '../../utils/logger';

/**
 * Mobile Dashboard Layout - Single screen, no vertical scrolling
 * Reuses all input modals from Input page directly
 */
function DashboardMobileContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedDate } = useWeekContext();
  const { error: trackingError, retry: retryTracking } = useTrackingEntries();
  const store = useStore();

  // Auto-save tracking data to Firebase
  useTracking();
  // Check and save weekly Top 3 snapshots
  useWeeklyTop3();

  // State for modals - track which input modal is open
  const [openModal, setOpenModal] = useState<'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight' | null>(null);
  const [showWeekModal, setShowWeekModal] = useState(false);

  const handleWeekCardClick = () => {
    setShowWeekModal(true);
  };

  const handleSegmentClick = (stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight') => {
    setOpenModal(stat);
  };

  const handleArcMenuSelect = (stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight') => {
    setOpenModal(stat);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleModalClose = () => {
    setOpenModal(null);
  };

  /**
   * Save workout/sports data to tracking store
   */
  const handleWorkoutSave = async (data: WorkoutLogData) => {
    try {
      const currentSports = store.tracking[data.date]?.sports || {
        hiit: false,
        cardio: false,
        gym: false,
        schwimmen: false,
        soccer: false,
        rest: false,
      };

      store.updateDayTracking(data.date, {
        sports: {
          ...currentSports,
          [data.sport]: {
            active: true,
            duration: data.durationMin,
            intensity: data.durationMin > 0 ? 5 : 0, // Default intensity to 5/10 (moderate)
          },
        },
      });
      handleModalClose();
    } catch (error) {
      logger.error('Error saving workout:', error);
      alert(t('common.error') || 'Error saving workout');
    }
  };

  /**
   * Save pushup data to tracking store
   */
  const handlePushupSave = async (data: PushupLogData) => {
    try {
      store.updateDayTracking(data.date, {
        pushups: {
          total: data.count,
        },
      });
      handleModalClose();
    } catch (error) {
      logger.error('Error saving pushups:', error);
      alert(t('common.error') || 'Error saving pushups');
    }
  };

  /**
   * Save hydration/drink data to tracking store
   */
  const handleDrinkSave = async (data: DrinkLogData) => {
    try {
      store.updateDayTracking(data.date, {
        water: (store.tracking[data.date]?.water || 0) + data.amountMl,
      });
      handleModalClose();
    } catch (error) {
      logger.error('Error saving drink:', error);
      alert(t('common.error') || 'Error saving drink');
    }
  };

  /**
   * Save food/nutrition data to tracking store
   */
  const handleFoodSave = async (data: FoodLogData) => {
    try {
      // Calculate totals from cart items
      let totalProtein = 0;
      let totalCalories = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      data.cart.forEach((item) => {
        totalProtein += item.nutrition.proteinG || 0;
        totalCalories += item.nutrition.calories || 0;
        totalCarbs += item.nutrition.carbsG || 0;
        totalFat += item.nutrition.fatG || 0;
      });

      const currentTracking = store.tracking[data.date] || {};

      store.updateDayTracking(data.date, {
        protein: (currentTracking.protein || 0) + totalProtein,
        calories: (currentTracking.calories || 0) + totalCalories,
        carbsG: (currentTracking.carbsG || 0) + totalCarbs,
        fatG: (currentTracking.fatG || 0) + totalFat,
      });
      handleModalClose();
    } catch (error) {
      logger.error('Error saving food:', error);
      alert(t('common.error') || 'Error saving food');
    }
  };

  /**
   * Save weight data to tracking store
   */
  const handleWeightSave = async (data: WeightLogData) => {
    try {
      store.updateDayTracking(data.date, {
        weight: {
          value: data.weight,
          bodyFat: data.bodyFat,
          bmi: data.bmi,
        },
      });
      handleModalClose();
    } catch (error) {
      logger.error('Error saving weight:', error);
      alert(t('common.error') || 'Error saving weight');
    }
  };

  return (
    <>
      {/* Error Banner - Compact for mobile */}
      {trackingError && (
        <div className="fixed top-0 inset-x-0 z-[999] px-2 pt-1">
          <div className="rounded border border-amber-300/30 bg-amber-500/10 p-1.5 text-amber-100">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-medium flex-1 line-clamp-1">
                {trackingError === 'no-permission' ? 'Permission denied' : 'Service unavailable'}
              </p>
              <button
                type="button"
                onClick={retryTracking}
                className="flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase transition-colors hover:bg-white/10"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Dashboard Container - Single screen, no scrolling */}
      <div
        className="h-screen flex flex-col gap-0.5 px-3 py-1 overflow-hidden safe-pb safe-pt"
        data-testid="dashboard-mobile"
      >
        {/* Header */}
        <div className="flex-shrink-0">
          <DashboardHeader onSettingsClick={handleSettingsClick} />
        </div>

        {/* Week Card (Compact) - Tap to expand */}
        <div onClick={handleWeekCardClick} className="cursor-pointer flex-shrink-0">
          <CompressedWeekCard />
        </div>

        {/* Main Carousel - Segment click detection handled in component */}
        <div className="flex-1 flex items-center justify-center min-h-0 max-h-xs">
          <div className="w-full max-w-xs">
            <StatCarouselWithProgressCircle onSegmentClick={handleSegmentClick} />
          </div>
        </div>

        {/* Weight Chart */}
        <div className="flex-shrink-0">
          <WeightChartCompact />
        </div>
      </div>

      {/* Arc Menu (Floating) - Opens specific stat modals */}
      <ArcMenu onStatSelect={handleArcMenuSelect} />

      {/* Input Modals - Directly reuse from Input page */}
      <WorkoutLogModal
        open={openModal === 'sports'}
        onClose={handleModalClose}
        onSave={handleWorkoutSave}
        currentDate={selectedDate}
      />

      <PushupLogModal
        open={openModal === 'pushup'}
        onClose={handleModalClose}
        onSave={handlePushupSave}
        currentDate={selectedDate}
      />

      <DrinkLogModal
        open={openModal === 'hydration'}
        onClose={handleModalClose}
        onSave={handleDrinkSave}
        currentDate={selectedDate}
      />

      <FoodLogModal
        open={openModal === 'nutrition'}
        onClose={handleModalClose}
        onSave={handleFoodSave}
        currentDate={selectedDate}
      />

      <WeightLogModal
        open={openModal === 'weight'}
        onClose={handleModalClose}
        onSave={handleWeightSave}
        currentDate={selectedDate}
      />

      {/* Week Details Modal */}
      <AppModal
        open={showWeekModal}
        onClose={() => setShowWeekModal(false)}
        title={t('dashboard.weekOverview') || 'Week Overview'}
        size="lg"
        footer={null}
      >
        <div className="p-4">
          <WeeklyTile />
        </div>
      </AppModal>
    </>
  );
}

/**
 * Wrapper with WeekProvider
 */
export function DashboardMobile() {
  return (
    <WeekProvider>
      <DashboardMobileContent />
    </WeekProvider>
  );
}

export default DashboardMobile;
