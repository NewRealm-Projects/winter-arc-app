import { useState } from 'react';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useTranslation } from '../../hooks/useTranslation';
import type { CarouselStat } from '../../hooks/useCarouselStats';
import WorkoutLogModal from '../notes/WorkoutLogModal';
import PushupLogModal from '../notes/PushupLogModal';
import DrinkLogModal from '../notes/DrinkLogModal';
import FoodLogModal from '../notes/FoodLogModal';
import WeightLogModal from '../notes/WeightLogModal';

interface StatDetailsModalProps {
  open: boolean;
  onClose: () => void;
  stat?: CarouselStat;
  currentDate?: string;
}

/**
 * Gateway modal shown when carousel stat is tapped.
 * Displays stat details and routes to appropriate input modal.
 */
export function StatDetailsModal({ open, onClose, stat, currentDate }: StatDetailsModalProps) {
  const { t } = useTranslation();
  const [activeInputModal, setActiveInputModal] = useState<
    'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight' | null
  >(null);

  if (!stat) {
    return null;
  }

  const handleAddOrEdit = () => {
    // Route to appropriate input modal based on stat type
    setActiveInputModal(stat.id);
  };

  return (
    <>
      {/* Stat Details Modal */}
      <AppModal
        open={open}
        onClose={onClose}
        title={stat.label}
        size="md"
        footer={
          <>
            <ModalSecondaryButton onClick={onClose}>
              {t('common.close') || 'Close'}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleAddOrEdit}>
              {t('common.addOrEdit') || 'Add / Edit'}
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {/* Stat Icon & Value */}
          <div className="flex items-center justify-center py-4">
            <div className="text-6xl mr-6">{stat.icon}</div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('common.progress') || 'Progress'}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {stat.progress}%
              </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${stat.progress}%`, backgroundColor: stat.color }}
              />
            </div>
          </div>

          {/* Stat-specific info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {getStatDescription(stat.id, t)}
            </p>
          </div>
        </div>
      </AppModal>

      {/* Input Modals - Route based on activeInputModal */}
      {activeInputModal === 'sports' && (
        <WorkoutLogModal
          open={true}
          onClose={() => {
            setActiveInputModal(null);
            onClose();
          }}
          onSave={async () => {
            setActiveInputModal(null);
            onClose();
          }}
          currentDate={currentDate}
        />
      )}

      {activeInputModal === 'pushup' && (
        <PushupLogModal
          open={true}
          onClose={() => {
            setActiveInputModal(null);
            onClose();
          }}
          onSave={async () => {
            setActiveInputModal(null);
            onClose();
          }}
          currentDate={currentDate}
        />
      )}

      {activeInputModal === 'hydration' && (
        <DrinkLogModal
          open={true}
          onClose={() => {
            setActiveInputModal(null);
            onClose();
          }}
          onSave={async () => {
            setActiveInputModal(null);
            onClose();
          }}
          currentDate={currentDate}
        />
      )}

      {activeInputModal === 'nutrition' && (
        <FoodLogModal
          open={true}
          onClose={() => {
            setActiveInputModal(null);
            onClose();
          }}
          onSave={async () => {
            setActiveInputModal(null);
            onClose();
          }}
          currentDate={currentDate}
        />
      )}

      {activeInputModal === 'weight' && (
        <WeightLogModal
          open={true}
          onClose={() => {
            setActiveInputModal(null);
            onClose();
          }}
          onSave={async () => {
            setActiveInputModal(null);
            onClose();
          }}
          currentDate={currentDate}
        />
      )}
    </>
  );
}

/**
 * Get stat-specific description for details modal
 */
function getStatDescription(
  statId: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight',
  t: (key: string) => string
): string {
  const descriptions: Record<typeof statId, string> = {
    sports: t('tracking.sportsDescription') || 'Log your daily sports activity',
    pushup: t('tracking.pushupDescription') || 'Track your pushup progress',
    hydration: t('tracking.hydrationDescription') || 'Log your daily water intake',
    nutrition: t('tracking.nutritionDescription') || 'Track your nutrition and calories',
    weight: t('tracking.weightDescription') || 'Log your weight and body metrics',
  };
  return descriptions[statId];
}

export default StatDetailsModal;
