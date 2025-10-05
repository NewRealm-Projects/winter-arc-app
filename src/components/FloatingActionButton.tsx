import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateBMI } from '../utils/calculations';
import { useTranslation } from '../hooks/useTranslation';

type MenuLevel = 'main' | 'water' | 'sport' | null;
type SportKey = 'hiit' | 'cardio' | 'gym' | 'schwimmen' | 'soccer' | 'rest';

const defaultSportsState: Record<SportKey, boolean> = {
  hiit: false,
  cardio: false,
  gym: false,
  schwimmen: false,
  soccer: false,
  rest: false,
};

export default function FloatingActionButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [menuLevel, setMenuLevel] = useState<MenuLevel>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showProteinModal, setShowProteinModal] = useState(false);

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [protein, setProtein] = useState('');

  const fabRef = useRef<HTMLDivElement>(null);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);
  const selectedDate = useStore((state) => state.selectedDate);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate || todayKey;
  const activeTracking = tracking[activeDate];

  // Current tracking values
  const currentWater = activeTracking?.water || 0;
  const currentProtein = activeTracking?.protein || 0;
  const currentSports: Record<SportKey, boolean> = activeTracking?.sports
    ? { ...defaultSportsState, ...activeTracking.sports }
    : { ...defaultSportsState };

  // Toggle main menu
  const toggleMenu = () => {
    if (isOpen) {
      setIsOpen(false);
      setMenuLevel(null);
    } else {
      setIsOpen(true);
      setMenuLevel('main');
    }
  };

  // Handle water amount selection
  const handleWaterAdd = (amount: number) => {
    updateDayTracking(activeDate, {
      water: currentWater + amount,
    });
    setIsOpen(false);
    setMenuLevel(null);
  };

  // Handle sport toggle
  const handleSportToggle = (sport: SportKey) => {
    updateDayTracking(activeDate, {
      sports: {
        ...currentSports,
        [sport]: !currentSports[sport],
      },
    });
  };

  // Save weight
  const saveWeight = () => {
    const weightValue = parseFloat(weight);
    if (!isNaN(weightValue) && weightValue > 0) {
      const bmi = user?.height ? calculateBMI(weightValue, user.height) : undefined;

      updateDayTracking(activeDate, {
        weight: {
          value: weightValue,
          bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
          bmi,
        },
      });
      setWeight('');
      setBodyFat('');
      setShowWeightModal(false);
      setIsOpen(false);
      setMenuLevel(null);
    }
  };

  // Save protein
  const saveProtein = () => {
    const amount = parseInt(protein);
    if (!isNaN(amount) && amount > 0) {
      updateDayTracking(activeDate, {
        protein: currentProtein + amount,
      });
      setProtein('');
      setShowProteinModal(false);
      setIsOpen(false);
      setMenuLevel(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setMenuLevel(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sport options
  const sportOptions = [
    { key: 'hiit' as SportKey, label: t('tracking.hiit'), icon: '🔥' },
    { key: 'cardio' as SportKey, label: t('tracking.cardio'), icon: '🏃' },
    { key: 'gym' as SportKey, label: t('tracking.gym'), icon: '🏋️' },
    { key: 'schwimmen' as SportKey, label: t('tracking.swimming'), icon: '🏊' },
    { key: 'soccer' as SportKey, label: t('tracking.soccer'), icon: '⚽' },
    { key: 'rest' as SportKey, label: t('tracking.rest'), icon: '😴' },
  ];

  // Calculate arc segment positions - Half circle on LEFT side (top to bottom via left)
  const getArcPosition = (index: number, total: number) => {
    const radius = 90; // Distance from FAB center
    const startAngle = 90; // Start at top (90°)
    const endAngle = 270; // End at bottom (270°)
    const angleRange = endAngle - startAngle; // 180° semicircle on left side
    const angleStep = angleRange / (total - 1);
    const angle = startAngle + index * angleStep;
    const angleRad = (angle * Math.PI) / 180;

    const x = Math.cos(angleRad) * radius;
    const y = Math.sin(angleRad) * radius;

    return { x, y };
  };

  return (
    <>
      <div ref={fabRef} className="fixed top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 md:bottom-36 right-4 md:right-6 z-60">
        {/* Arc Segments - Main Menu */}
        {isOpen && menuLevel === 'main' && (
          <div className="absolute bottom-0 right-0">
            {[
              { icon: '💧', label: 'Water', action: () => setMenuLevel('water') },
              { icon: '🥩', label: 'Protein', action: () => setShowProteinModal(true) },
              { icon: '🏃', label: 'Sport', action: () => setMenuLevel('sport') },
              { icon: '⚖️', label: 'Weight', action: () => setShowWeightModal(true) },
            ].map((item, index) => {
              const pos = getArcPosition(index, 4);
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="absolute w-14 h-14 rounded-full bg-white/10 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center text-2xl hover:bg-white/20 transition-all duration-200 hover:scale-110 animate-pop-out"
                  style={{
                    bottom: `${-pos.y}px`,
                    right: `${-pos.x}px`,
                    animationDelay: `${index * 50}ms`,
                  }}
                  title={item.label}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>
        )}

        {/* Arc Segments - Water Submenu */}
        {isOpen && menuLevel === 'water' && (
          <div className="absolute bottom-0 right-0">
            {[
              { amount: 250, label: '250ml' },
              { amount: 500, label: '500ml' },
              { amount: 1000, label: '1L' },
            ].map((item, index) => {
              const pos = getArcPosition(index, 3);
              return (
                <button
                  key={item.amount}
                  onClick={() => handleWaterAdd(item.amount)}
                  className="absolute w-16 h-14 rounded-xl bg-blue-500/20 dark:bg-blue-500/20 backdrop-blur-md border border-blue-400/30 shadow-lg flex flex-col items-center justify-center hover:bg-blue-500/30 transition-all duration-200 hover:scale-110 animate-pop-out"
                  style={{
                    bottom: `${-pos.y}px`,
                    right: `${-pos.x}px`,
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <span className="text-xl">💧</span>
                  <span className="text-[10px] text-blue-200 font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Arc Segments - Sport Submenu */}
        {isOpen && menuLevel === 'sport' && (
          <div className="absolute bottom-0 right-0">
            {sportOptions.map((sport, index) => {
              const pos = getArcPosition(index, 6);
              const isActive = currentSports[sport.key];
              return (
                <button
                  key={sport.key}
                  onClick={() => handleSportToggle(sport.key)}
                  className={`absolute w-14 h-14 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center text-xl transition-all duration-200 hover:scale-110 animate-pop-out ${
                    isActive
                      ? 'bg-green-500/30 border-green-400/50'
                      : 'bg-white/10 border-white/20'
                  }`}
                  style={{
                    bottom: `${-pos.y}px`,
                    right: `${-pos.x}px`,
                    animationDelay: `${index * 50}ms`,
                  }}
                  title={sport.label}
                >
                  {sport.icon}
                  {isActive && <span className="absolute top-0 right-0 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={toggleMenu}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600/40 to-blue-500/40 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(59,130,246,0.5)] flex items-center justify-center text-white hover:scale-110 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(59,130,246,0.7)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className={`w-8 h-8 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Weight Input Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-70">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ⚖️ {t('tracking.weight')}
            </h3>
            <div className="space-y-3">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight (kg)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                autoFocus
              />
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="Body Fat (%)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveWeight}
                  disabled={!weight || parseFloat(weight) <= 0}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('tracking.save')}
                </button>
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    setWeight('');
                    setBodyFat('');
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('tracking.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protein Input Modal */}
      {showProteinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-70">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              🥩 {t('tracking.protein')}
            </h3>
            <div className="space-y-3">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveProtein()}
                placeholder="Protein (g)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={saveProtein}
                  disabled={!protein || parseInt(protein) <= 0}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('tracking.add')}
                </button>
                <button
                  onClick={() => {
                    setShowProteinModal(false);
                    setProtein('');
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('tracking.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
