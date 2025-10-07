import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import type { SportEntry, SportKey } from '../types';
import { countActiveSports, normalizeSports, toSportEntry } from '../utils/sports';
import { getTileClasses, designTokens } from '../theme/tokens';
import { useCombinedDailyTracking } from '../hooks/useCombinedTracking';

const SPORT_OPTION_CONFIG: Array<{ key: SportKey; labelKey: string; icon: string }> = [
  { key: 'hiit', labelKey: 'tracking.hiit', icon: '🔥' },
  { key: 'cardio', labelKey: 'tracking.cardio', icon: '🏃' },
  { key: 'gym', labelKey: 'tracking.gym', icon: '🏋️' },
  { key: 'schwimmen', labelKey: 'tracking.swimming', icon: '🏊' },
  { key: 'soccer', labelKey: 'tracking.soccer', icon: '⚽' },
  { key: 'rest', labelKey: 'tracking.rest', icon: '😴' },
];

function SportTile() {
  const { t } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const [showModal, setShowModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportKey | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [intensity, setIntensity] = useState<number>(5);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];
  const combinedDaily = useCombinedDailyTracking(activeDate);
  const currentSports: Record<SportKey, SportEntry> = useMemo(
    () => normalizeSports(activeTracking?.sports),
    [activeTracking?.sports]
  );
  const displaySports: Record<SportKey, SportEntry> = useMemo(
    () => normalizeSports(combinedDaily?.sports),
    [combinedDaily?.sports]
  );

  const toggleRest = (sport: SportKey) => {
    const previous = toSportEntry(activeTracking?.sports?.[sport] ? activeTracking.sports[sport] : currentSports[sport]);

    updateDayTracking(activeDate, {
      sports: {
        ...activeTracking?.sports,
        [sport]: {
          ...previous,
          active: !previous.active,
        },
      },
    });
  };

  const openSportModal = (sport: SportKey) => {
    if (sport === 'rest') {
      toggleRest(sport);
      return;
    }

    setSelectedSport(sport);
    const sportData = currentSports[sport];
    setDuration(sportData.duration ?? 60);
    setIntensity(sportData.intensity ?? 5);
    setShowModal(true);
  };

  const saveSport = () => {
    if (!selectedSport) return;

    updateDayTracking(activeDate, {
      sports: {
        ...activeTracking?.sports,
        [selectedSport]: {
          active: true,
          duration,
          intensity,
        },
      },
    });
    setShowModal(false);
    setSelectedSport(null);
  };

  const removeSport = () => {
    if (!selectedSport) return;

    updateDayTracking(activeDate, {
      sports: {
        ...activeTracking?.sports,
        [selectedSport]: { active: false },
      },
    });
    setShowModal(false);
    setSelectedSport(null);
  };

  const sportOptions = useMemo(
    () =>
      SPORT_OPTION_CONFIG.map((config) => ({
        ...config,
        label: t(config.labelKey),
      })),
    [t]
  );

  const completedCount = countActiveSports(displaySports);
  const isTracked = completedCount > 0;
  const modalSport = sportOptions.find((option) => option.key === selectedSport);

  return (
    <div
      className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} text-white`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">🏃</div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('tracking.sport')}
          </h3>
        </div>
        <div className="text-sm font-bold text-winter-600 dark:text-winter-400">
          {completedCount}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        {sportOptions.map((sport) => {
          const isChecked = displaySports[sport.key].active || false;

          return (
            <button
              key={sport.key}
              type="button"
              onClick={() => { openSportModal(sport.key); }}
              className={`p-2 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                isChecked
                  ? 'bg-blue-600/20 dark:bg-blue-600/30 border-2 border-blue-400 shadow-inner'
                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              title={sport.label}
            >
              <div className="text-xl">{sport.icon}</div>
              <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                {sport.label}
              </div>
            </button>
          );
        })}
      </div>

      {showModal && selectedSport && modalSport &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => { setShowModal(false); }}
          >
            <div
              className="rounded-2xl bg-slate-800/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 w-full max-w-sm"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {modalSport.icon} {modalSport.label}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/70 mb-2">
                    {t('tracking.duration')} ({t('tracking.minutes')})
                  </label>
                  <div className="flex gap-2 mb-2">
                    {[30, 60, 90].map((min) => (
                      <button
                        key={min}
                        onClick={() => { setDuration(min); }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          duration === min
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {min} min
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => { setDuration(Number(e.target.value)); }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-400 outline-none"
                    placeholder="Custom"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/70 mb-2">
                    {t('tracking.intensity')} (1-10)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <button
                        key={level}
                        onClick={() => { setIntensity(level); }}
                        className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                          intensity === level
                            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white scale-110'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {currentSports[selectedSport].active && (
                    <button
                      onClick={removeSport}
                      className="flex-1 px-4 py-2 text-sm bg-red-600/30 text-red-200 rounded-lg hover:bg-red-600/50 transition-colors"
                    >
                      {t('tracking.remove')}
                    </button>
                  )}
                  <button
                    onClick={saveSport}
                    className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('tracking.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default SportTile;
