import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '../ui/AppModal';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';

export interface WeightLogData {
  weight: number; // kg
  bodyFat?: number; // %
  bmi?: number;
  note?: string;
  date: string;
}

interface WeightLogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: WeightLogData) => Promise<void>;
  currentDate?: string;
}

function WeightLogModal({ open, onClose, onSave, currentDate }: WeightLogModalProps) {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);

  const [weight, setWeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = currentDate || todayKey;

  // Calculate BMI if height is available
  const bmi = useMemo(() => {
    const weightKg = Number(weight);
    if (!user?.height || !Number.isFinite(weightKg) || weightKg <= 0) {
      return undefined;
    }

    const heightM = user.height / 100;
    const calculatedBmi = weightKg / (heightM * heightM);
    return Math.round(calculatedBmi * 10) / 10;
  }, [weight, user?.height]);

  const canSave = useMemo(() => {
    const weightNum = Number(weight);
    return Number.isFinite(weightNum) && weightNum > 0 && weightNum <= 300;
  }, [weight]);

  const handleSave = async () => {
    if (!canSave) return;

    const weightNum = Number(weight);
    const bodyFatNum = bodyFat ? Number(bodyFat) : undefined;

    // Validate body fat percentage
    if (bodyFatNum !== undefined && (bodyFatNum < 0 || bodyFatNum > 100)) {
      alert(t('quickLog.weightModal.bodyFatValidation'));
      return;
    }

    setSaving(true);
    try {
      await onSave({
        weight: weightNum,
        bodyFat: bodyFatNum,
        bmi,
        note: note.trim() || undefined,
        date: activeDate,
      });

      // Reset form
      setWeight('');
      setBodyFat('');
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error saving weight log:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      // Reset form
      setWeight('');
      setBodyFat('');
      setNote('');
      onClose();
    }
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t('quickLog.weightModal.title')}
      icon={<span className="text-2xl">⚖️</span>}
      size="sm"
      preventCloseOnBackdrop={saving}
      footer={
        <>
          <ModalSecondaryButton onClick={handleClose} disabled={saving}>
            {t('common.actions.cancel')}
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={!canSave || saving}>
            {saving ? t('common.saving') : t('common.actions.save')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Weight Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.weightModal.weight')} (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="75.0"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
        </div>

        {/* Body Fat Input (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.weightModal.bodyFat')} (%)
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {t('common.optional')}
            </span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="15.5"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* BMI Display */}
        {bmi !== undefined && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quickLog.weightModal.bmi')}
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {bmi}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {bmi < 18.5 && t('quickLog.weightModal.bmiUnderweight')}
              {bmi >= 18.5 && bmi < 25 && t('quickLog.weightModal.bmiNormal')}
              {bmi >= 25 && bmi < 30 && t('quickLog.weightModal.bmiOverweight')}
              {bmi >= 30 && t('quickLog.weightModal.bmiObese')}
            </div>
          </div>
        )}

        {user && !user.height && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <div className="text-xs text-gray-700 dark:text-gray-300">
              {t('quickLog.weightModal.heightNotSet')}
            </div>
          </div>
        )}

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('quickLog.optionalNote')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('quickLog.notePlaceholder')}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={200}
          />
        </div>
      </div>
    </AppModal>
  );
}

export default WeightLogModal;
