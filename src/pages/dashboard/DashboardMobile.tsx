import { useState } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCarouselWithProgressCircle from '../../components/dashboard/StatCarouselWithProgressCircle';
import CompressedWeekCard from '../../components/dashboard/CompressedWeekCard';
import WeightChartCompact from '../../components/dashboard/WeightChartCompact';
import ArcMenu from '../../components/dashboard/ArcMenu';
import StatDetailsModal from '../../components/dashboard/StatDetailsModal';
import WeeklyTile from '../../components/dashboard/WeeklyTile';
import { AppModal } from '../../components/ui/AppModal';
import { WeekProvider } from '../../contexts/WeekContext';
import { useWeekContext } from '../../contexts/WeekContext';
import { useCarouselStats } from '../../hooks/useCarouselStats';
import { useTranslation } from '../../hooks/useTranslation';
import { useTrackingEntries } from '../../hooks/useTrackingEntries';
import { useTracking } from '../../hooks/useTracking';
import { useWeeklyTop3 } from '../../hooks/useWeeklyTop3';

/**
 * Mobile Dashboard Layout - Single screen, no vertical scrolling
 * Components:
 * - DashboardHeader: Week info + Settings
 * - StatCarouselWithProgressCircle: Main carousel with 5 stats
 * - CompressedWeekCard: Week navigation (in modal)
 * - WeightChartCompact: Weight tracking (below carousel)
 * - ArcMenu: Quick-add menu (floating button)
 * - StatDetailsModal: Stat details gateway
 */
function DashboardMobileContent() {
  const { t } = useTranslation();
  const { selectedDate } = useWeekContext();
  const stats = useCarouselStats();
  const { error: trackingError, retry: retryTracking } = useTrackingEntries();

  // Auto-save tracking data to Firebase
  useTracking();
  // Check and save weekly Top 3 snapshots
  useWeeklyTop3();

  // State for modals
  const [selectedStat, setSelectedStat] = useState(stats[0] || null);
  const [showStatDetails, setShowStatDetails] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);

  const handleCarouselClick = () => {
    setShowStatDetails(true);
  };

  const handleWeekCardClick = () => {
    setShowWeekModal(true);
  };

  const handleArcMenuSelect = (stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight') => {
    // Find the stat object from carousel stats
    const statObj = stats.find((s) => s.id === stat);
    if (statObj) {
      setSelectedStat(statObj);
      setShowStatDetails(true);
    }
  };

  return (
    <>
      {/* Error Banner */}
      {trackingError && (
        <div className="px-3 pt-2 pb-0">
          <div className="rounded-lg border border-amber-300/30 bg-amber-500/10 p-3 text-amber-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium">
                {trackingError === 'no-permission'
                  ? t('tracking.permissionDeniedMessage')
                  : t('tracking.unavailableMessage')}
              </p>
              <button
                type="button"
                onClick={retryTracking}
                className="self-start rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:border-white/40 hover:bg-white/10"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Dashboard Container */}
      <div
        className="h-screen flex flex-col gap-2 px-3 pt-2 pb-24 overflow-y-auto safe-pb safe-pt"
        data-testid="dashboard-mobile"
      >
        {/* Header */}
        <DashboardHeader onSettingsClick={() => {}} />

        {/* Week Card (Compact) - Tap to expand */}
        <div onClick={handleWeekCardClick} className="cursor-pointer">
          <CompressedWeekCard />
        </div>

        {/* Main Carousel - Tap to see details */}
        <div onClick={handleCarouselClick} className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xs">
            <StatCarouselWithProgressCircle />
          </div>
        </div>

        {/* Weight Chart */}
        <div>
          <WeightChartCompact />
        </div>
      </div>

      {/* Arc Menu (Floating) */}
      <ArcMenu onStatSelect={handleArcMenuSelect} />

      {/* Stat Details Modal (Gateway to input modals) */}
      {selectedStat && (
        <StatDetailsModal
          open={showStatDetails}
          onClose={() => setShowStatDetails(false)}
          stat={selectedStat}
          currentDate={selectedDate}
        />
      )}

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
