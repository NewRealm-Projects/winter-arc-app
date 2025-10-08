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
                  onClick={() => { setShowModal(false); }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/70 mb-2">
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
                              ? 'border-emerald-400 bg-emerald-600/30 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]'
                              : isSelected
                                ? 'border-blue-400 bg-blue-600/30 shadow-inner'
                                : 'border-transparent bg-white/5 hover:bg-white/10'
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
                            <div className="absolute top-1 right-1 text-[10px] uppercase tracking-wide text-emerald-200">
                              {t('tracking.trackedLabel')}
                            </div>
                          )}
                          <div className="text-xl">{sport.icon}</div>
                          <div className="text-xs text-white/80 font-medium">
                            {sport.label}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selectedSport === 'rest' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-white/70">
                      {t('tracking.restDescription')}
                    </p>
                    <button
                      onClick={() => {
                        const nextActive = !(draftSports.rest?.active ?? false);
                        toggleSportActive('rest', nextActive);
                      }}
                      className={`w-full px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        selectedIsActive
                          ? 'bg-red-500/30 text-red-100 hover:bg-red-500/40'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectedIsActive ? t('tracking.unsetRestDay') : t('tracking.setRestDay')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-white/70 mb-2">
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
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setDuration(value);
                          updateDraftSport(selectedSport, { duration: value, active: true });
                        }}
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
                            onClick={() => {
                              setIntensity(level);
                              updateDraftSport(selectedSport, { intensity: level, active: true });
                            }}
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
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {selectedSport !== 'rest' && (draftSports[selectedSport]?.active ?? false) && (
                    <button
                      onClick={removeSport}
                      className="flex-1 px-4 py-2 text-sm bg-red-600/30 text-red-200 rounded-lg hover:bg-red-600/50 transition-colors"
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
