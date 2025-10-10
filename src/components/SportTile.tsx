import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import type { SportEntry, SportKey } from '../types';
import { countActiveSports, normalizeSports } from '../utils/sports';
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
  const [selectedSport, setSelectedSport] = useState<SportKey>('hiit');
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

  const [draftSports, setDraftSports] = useState<Record<SportKey, SportEntry>>(currentSports);

  const sportOptions = useMemo(
    () =>
      SPORT_OPTION_CONFIG.map((config) => ({
        ...config,
        label: t(config.labelKey),
      })),
    [t]
  );

  const activeSportOptions = useMemo(
    () => sportOptions.filter((option) => displaySports[option.key].active),
    [displaySports, sportOptions]
  );

  const openSportManager = (sport?: SportKey) => {
    const fallbackSport = sport ?? activeSportOptions[0]?.key ?? 'hiit';
    setDraftSports(normalizeSports(currentSports));
    setSelectedSport(fallbackSport);
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) {
      return;
    }

    setDraftSports(normalizeSports(currentSports));
  }, [showModal, currentSports]);

  useEffect(() => {
    if (!showModal) {
      return;
    }

    const sportData = draftSports[selectedSport as keyof typeof draftSports];
    if (selectedSport === 'rest') {
      return;
    }

    setDuration(sportData.duration ?? 60);
    setIntensity(sportData.intensity ?? 5);
  }, [showModal, selectedSport, draftSports]);

  const updateDraftSport = useCallback(
    (sport: SportKey, updates: Partial<SportEntry>) => {
      setDraftSports((prev) => ({
        ...prev,
        [sport]: {
          ...prev[sport],
          ...updates,
        },
      }));
    },
    []
  );

  const toggleSportActive = useCallback(
    (sport: SportKey, nextActive: boolean) => {
      setDraftSports((prev) => {
        const previous = prev[sport];
        const updated: SportEntry = {
          ...previous,
          active: nextActive,
        };

        if (sport === 'rest') {
          updated.duration = undefined;
          updated.intensity = undefined;
        } else if (nextActive) {
          updated.duration = previous.duration ?? 60;
          updated.intensity = previous.intensity ?? 5;
        } else {
          updated.duration = undefined;
          updated.intensity = undefined;
        }

        return {
          ...prev,
          [sport]: updated,
        };
      });
    },
    []
  );

  const saveSports = () => {
    updateDayTracking(activeDate, {
      sports: {
        ...activeTracking?.sports,
        ...draftSports,
      },
    });
    setShowModal(false);
  };

  const removeSport = () => {
    updateDraftSport(selectedSport, { active: false, duration: undefined, intensity: undefined });
  };

  const completedCount = countActiveSports(displaySports);
  const isTracked = completedCount > 0;
  const modalSport = sportOptions.find((option) => option.key === selectedSport);
  const selectedIsActive = draftSports[selectedSport]?.active ?? false;
  const hasActiveSports = activeSportOptions.length > 0;

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

      <div className="flex flex-wrap items-center gap-2 min-h-[40px]">
        {hasActiveSports ? (
          activeSportOptions.map((sport) => (
            <button
              key={sport.key}
              type="button"
              onClick={() => { openSportManager(sport.key); }}
              className="text-2xl leading-none transition-transform hover:scale-110"
              title={sport.label}
            >
              {sport.icon}
            </button>
          ))
        ) : (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {t('tracking.noSportsTracked')}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => { openSportManager(); }}
        className="mt-3 w-full rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-100 text-sm font-medium py-2 hover:bg-blue-600/30 transition-colors"
      >
        {t('tracking.manageSports')}
      </button>

      {showModal && modalSport &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in"
            style={{
              zIndex: 'var(--z-overlay)',
              backgroundColor: 'var(--wa-overlay)',
            }}
            onClick={() => { setShowModal(false); }}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-scale-fade-in"
              style={{
                zIndex: 'var(--z-modal)',
                backgroundColor: 'var(--wa-surface-elev)',
                borderRadius: 'var(--wa-radius-xl)',
                boxShadow: 'var(--wa-shadow-lg)',
                border: '1px solid var(--wa-border)',
              }}
              onClick={(e) => { e.stopPropagation(); }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {modalSport.icon} {modalSport.label}
                </h3>
                <button
                  onClick={() => { setShowModal(false); }}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
                    {t('tracking.chooseSport')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {sportOptions.map((sport) => {
                      const isSelected = sport.key === selectedSport;
                      const isActive = draftSports[sport.key]?.active ?? false;

                      return (
                        <label
                          key={sport.key}
                          className={`relative p-2 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                            isActive
                              ? 'border-emerald-400 bg-emerald-100 dark:bg-emerald-600/30 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]'
                              : isSelected
                                ? 'border-blue-400 bg-blue-100 dark:bg-blue-600/30 shadow-inner'
                                : 'border-gray-200 dark:border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                          } ${isSelected && isActive ? 'ring-1 ring-emerald-300/60' : ''}`}
                          onClick={() => { setSelectedSport(sport.key); }}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isActive}
                            onChange={(event) => {
                              toggleSportActive(sport.key, event.target.checked);
                              setSelectedSport(sport.key);
                            }}
                            onFocus={() => { setSelectedSport(sport.key); }}
                          />
                          {isActive && (
                            <div className="absolute top-1 right-1 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                              {t('tracking.trackedLabel')}
                            </div>
                          )}
                          <div className="text-xl">{sport.icon}</div>
                          <div className="text-xs text-gray-800 dark:text-white/80 font-medium">
                            {sport.label}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selectedSport === 'rest' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t('tracking.restDescription')}
                    </p>
                    <button
                      onClick={() => {
                        const nextActive = !(draftSports.rest?.active ?? false);
                        toggleSportActive('rest', nextActive);
                      }}
                      className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        selectedIsActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/30 dark:text-red-100 dark:hover:bg-red-500/40'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectedIsActive ? t('tracking.unsetRestDay') : t('tracking.setRestDay')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
                        {t('tracking.duration')} ({t('tracking.minutes')})
                      </label>
                      <div className="flex gap-2 mb-2">
                        {[30, 60, 90].map((min) => (
                          <button
                            key={min}
                            onClick={() => {
                              setDuration(min);
                              updateDraftSport(selectedSport, { duration: min, active: true });
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              duration === min
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
                            }`}
                          >
                            {min} min
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setDuration(value);
                          updateDraftSport(selectedSport, { duration: value, active: true });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 outline-none dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                        placeholder="Custom"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
                        {t('tracking.intensity')} (1-10)
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                          <button
                            key={level}
                            onClick={() => {
                              setIntensity(level);
                              updateDraftSport(selectedSport, { intensity: level, active: true });
                            }}
                            className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                              intensity === level
                                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white scale-110'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {selectedSport !== 'rest' && (draftSports[selectedSport]?.active ?? false) && (
                    <button
                      onClick={removeSport}
                      className="flex-1 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-600/30 dark:text-red-200 dark:hover:bg-red-600/50 transition-colors"
                    >
                      {t('tracking.remove')}
                    </button>
                  )}
                  <button
                    onClick={saveSports}
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
