import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { polarToCartesian } from '../../utils/progressCalculation';

export interface ArcMenuProps {
  onStatSelect: (
    stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight'
  ) => void;
}

/**
 * Half-circle (180°) menu with 5 slices (36° each)
 * Slides up from bottom on tap, plus button rotates 45°
 * Handles click, keyboard (Escape), and backdrop dismissal
 */
export function ArcMenu({ onStatSelect }: ArcMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Define the 5 menu slices
  const SLICES = [
    { id: 'sports' as const, label: t('tracking.sports'), icon: '🏃', color: '#10B981' },
    { id: 'pushup' as const, label: t('tracking.pushups'), icon: '💪', color: '#3B82F6' },
    { id: 'hydration' as const, label: t('tracking.water'), icon: '💧', color: '#06B6D4' },
    { id: 'nutrition' as const, label: t('tracking.nutrition'), icon: '🥩', color: '#F59E0B' },
    { id: 'weight' as const, label: t('tracking.weight'), icon: '⚖️', color: '#8B5CF6' },
  ];

  // Handle slice click
  const handleSliceClick = (statId: typeof SLICES[0]['id']) => {
    onStatSelect(statId);
    setIsOpen(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  // Handle keyboard (Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // SVG configuration
  const SVG_WIDTH = 200;
  const SVG_HEIGHT = 100;
  const CENTER_X = SVG_WIDTH / 2;
  const CENTER_Y = SVG_HEIGHT;
  const RADIUS = 90;
  const ICON_RADIUS = 60;

  // Generate slice paths for half-circle (180°)
  const createSlicePath = (startAngle: number, endAngle: number): string => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = CENTER_X + RADIUS * Math.cos(startRad);
    const y1 = CENTER_Y + RADIUS * Math.sin(startRad);
    const x2 = CENTER_X + RADIUS * Math.cos(endRad);
    const y2 = CENTER_Y + RADIUS * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    // Create filled slice path (includes radial lines to center)
    return `M ${CENTER_X} ${CENTER_Y} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <>
      {/* Backdrop - visible when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={handleBackdropClick}
          role="button"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Plus Button Container */}
      <div
        ref={menuRef}
        className="fixed bottom-6 right-6 z-40 flex flex-col items-center"
      >
        {/* Menu SVG (hidden when closed, slides up when open) */}
        <div
          className={`mb-4 transition-all duration-300 ease-out ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
          }`}
          aria-hidden={!isOpen}
        >
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            width="200"
            height="100"
            className="drop-shadow-lg"
            role="menu"
            aria-label={t('common.quickAdd') || 'Quick add menu'}
          >
            {/* Arc background */}
            <path
              d={`M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`}
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="1"
              className="dark:fill-gray-900 dark:stroke-white/10"
            />

            {/* 5 slices (36° each for 180° total) */}
            {SLICES.map((slice, index) => {
              const startAngle = index * 36;
              const endAngle = (index + 1) * 36;
              const slicePath = createSlicePath(startAngle, endAngle);

              return (
                <g key={slice.id}>
                  {/* Slice path (clickable) */}
                  <path
                    d={slicePath}
                    fill={slice.color}
                    opacity="0.9"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => handleSliceClick(slice.id)}
                    role="menuitem"
                    tabIndex={0}
                    aria-label={slice.label}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSliceClick(slice.id);
                      }
                    }}
                  />

                  {/* Icon on slice */}
                  <g
                    transform={`translate(${CENTER_X + polarToCartesian(index * 36 + 18, ICON_RADIUS).x}, ${CENTER_Y + polarToCartesian(index * 36 + 18, ICON_RADIUS).y})`}
                    role="img"
                    aria-label={slice.label}
                    onClick={() => handleSliceClick(slice.id)}
                    className="cursor-pointer"
                  >
                    <text
                      x="0"
                      y="0"
                      fontSize="20"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="select-none pointer-events-none"
                    >
                      {slice.icon}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Plus Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 dark:active:from-blue-800 dark:active:to-blue-900`}
          aria-label={isOpen ? t('common.close') || 'Close menu' : t('common.quickAdd') || 'Quick add'}
          aria-expanded={isOpen}
          aria-controls="arc-menu-svg"
          tabIndex={0}
        >
          <Plus
            size={24}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </>
  );
}

export default ArcMenu;
