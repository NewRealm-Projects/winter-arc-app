import { memo } from 'react';
import { AppModal, ModalSecondaryButton } from '../ui/AppModal';
import UnifiedTrainingCard from '../UnifiedTrainingCard';

interface TrainingCardModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Training Card Modal for Mobile (<481px)
 * Shows full UnifiedTrainingCard content in expandable modal
 * Triggered by TrainingCardCompact button click
 */
const TrainingCardModal = memo(function TrainingCardModal({ open, onClose }: TrainingCardModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Training Details"
      size="lg"
      footer={
        <ModalSecondaryButton onClick={onClose}>
          Close
        </ModalSecondaryButton>
      }
    >
      <div className="p-1">
        <UnifiedTrainingCard />
      </div>
    </AppModal>
  );
});

export default TrainingCardModal;
