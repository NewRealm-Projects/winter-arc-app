import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

export default function CheckInButton() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        navigate('/tracking');
      }}
      className="group relative flex h-[88px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-winter-500 via-winter-600 to-winter-700 px-4 text-white shadow-[0_8px_24px_rgba(14,116,144,0.3)] transition-all duration-200 hover:from-winter-400 hover:via-winter-500 hover:to-winter-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-winter-600 sm:h-[76px] lg:h-[88px]"
      aria-label={t('dashboard.trainingLoadCheckIn')}
    >
      <span className="relative z-10 flex flex-col items-center gap-1 text-sm font-semibold">
        <span className="text-lg">📝</span>
        <span>{t('dashboard.trainingLoadCheckIn')}</span>
      </span>
      <div className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </button>
  );
}
