import { useState } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCarouselWithProgressCircle from '../../components/dashboard/StatCarouselWithProgressCircle';
import CompressedWeekCard from '../../components/dashboard/CompressedWeekCard';
import WeightChartCompact from '../../components/dashboard/WeightChartCompact';
import ArcMenu from '../../components/dashboard/ArcMenu';
import WeeklyTile from '../../components/dashboard/WeeklyTile';
import WorkoutLogModal from '../../components/notes/WorkoutLogModal';
import PushupLogModal from '../../components/notes/PushupLogModal';
import DrinkLogModal from '../../components/notes/DrinkLogModal';
import FoodLogModal from '../../components/notes/FoodLogModal';
import WeightLogModal from '../../components/notes/WeightLogModal';
import { AppModal } from '../../components/ui/AppModal';
import { WeekProvider } from '../../contexts/WeekContext';
import { useWeekContext } from '../../contexts/WeekContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useTrackingEntries } from '../../hooks/useTrackingEntries';
import { useTracking } from '../../hooks/useTracking';
import { useWeeklyTop3 } from '../../hooks/useWeeklyTop3';

/**
 * Mobile Dashboard Layout - Single screen, no vertical scrolling
 * Reuses all input modals from Input page directly
 */
function DashboardMobileContent() {
  const { t } = useTranslation();
  const { selectedDate } = useWeekContext();
  const { error: trackingError, retry: retryTracking } = useTrackingEntries();

  // Auto-save tracking data to Firebase
  useTracking();
  // Check and save weekly Top 3 snapshots
  useWeeklyTop3();

  // State for modals - track which input modal is open
  const [openModal, setOpenModal] = useState<'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight' | null>(null);
  const [showWeekModal, setShowWeekModal] = useState(false);

  const handleCarouselClick = () => {
    setOpenModal('sports');
  };

  const handleWeekCardClick = () => {
    setShowWeekModal(true);
  };

  const handleArcMenuSelect = (stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight') => {
    setOpenModal(stat);
  };

  const handleModalClose = () => {
    setOpenModal(null);
  };

  const handleDummySave = async () => {
    // Modals handle their own data saving
    handleModalClose();
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
        className="h-screen flex flex-col gap-1 px-3 py-1 overflow-hidden safe-pb safe-pt"
        data-testid="dashboard-mobile"
      >
        {/* Header */}
        <div className="flex-shrink-0">
          <DashboardHeader onSettingsClick={() => {}} />
        </div>

        {/* Week Card (Compact) - Tap to expand */}
        <div onClick={handleWeekCardClick} className="cursor-pointer flex-shrink-0">
          <CompressedWeekCard />
        </div>

        {/* Main Carousel - Tap to open sports modal - Takes remaining space */}
        <div onClick={handleCarouselClick} className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full max-w-xs">
            <StatCarouselWithProgressCircle />
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
        onSave={handleDummySave}
        currentDate={selectedDate}
      />

      <PushupLogModal
        open={openModal === 'pushup'}
        onClose={handleModalClose}
        onSave={handleDummySave}
        currentDate={selectedDate}
      />

      <DrinkLogModal
        open={openModal === 'hydration'}
        onClose={handleModalClose}
        onSave={handleDummySave}
        currentDate={selectedDate}
      />

      <FoodLogModal
        open={openModal === 'nutrition'}
        onClose={handleModalClose}
        onSave={handleDummySave}
        currentDate={selectedDate}
      />

      <WeightLogModal
        open={openModal === 'weight'}
        onClose={handleModalClose}
        onSave={handleDummySave}
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
