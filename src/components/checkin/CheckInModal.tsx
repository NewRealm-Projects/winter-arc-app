/**
 * CheckInModal Component
 * Modal for training check-ins
 */

import { AppModal } from '../ui/AppModal';

interface CheckInModalProps {
  dateKey: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: unknown) => void;
}

export default function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  return (
    <AppModal open={isOpen} onClose={onClose} title="Check-In" icon={<span>📝</span>}>
      <div className="p-4 text-center text-white/60">
        <p>Check-In Feature coming soon...</p>
      </div>
    </AppModal>
  );
}
