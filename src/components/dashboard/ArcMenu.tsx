import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export interface ArcMenuProps {
  onStatSelect: (
    stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight'
  ) => void;
}

/**
 * Unified Arc Menu Component
 * Half-circle (180°) menu with 5 slices (36° each) opens upward from plus button
 * Button is at the center bottom of the arc
 * Icons arranged in semicircle across the top
 */
export function ArcMenu({ onStatSelect }: ArcMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Define the 5 menu slices (ordered left to right across top)
  const SLICES = [
    { id: 'nutrition' as const, label: t('tracking.nutrition'), icon: '🥩', color: '#F59E0B' },
    { id: 'hydration' as const, label: t('tracking.water'), icon: '💧', color: '#06B6D4' },
    { id: 'weight' as const, label: t('tracking.weight'), icon: '⚖️', color: '#8B5CF6' },
    { id: 'pushup' as const, label: t('tracking.pushups'), icon: '💪', color: '#3B82F6' },
    { id: 'sports' as const, label: t('tracking.sports'), icon: '🏃', color: '#10B981' },
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

  // SVG configuration - Arc menu with button below
  const SVG_SIZE = 280;
  const CENTER_X = SVG_SIZE / 2;
  const CENTER_Y = SVG_SIZE / 2;
  const RADIUS = 100;
  const ICON_RADIUS = 75;

  // Generate slice paths for top-opening half-circle (180°)
  // Angles go from 180° (left) to 0° (right), spanning across the top
  const createSlicePath = (startAngle: number, endAngle: number): string => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = CENTER_X + RADIUS * Math.cos(startRad);
    const y1 = CENTER_Y + RADIUS * Math.sin(startRad);
    const x2 = CENTER_X + RADIUS * Math.cos(endRad);
    const y2 = CENTER_Y + RADIUS * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    // Create filled slice path (radial lines from center to arc)
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

      {/* Unified Arc Menu + Button - Fixed at bottom center */}
      <div
        ref={menuRef}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
      >
        {/* Arc SVG - positioned above the button, centered */}
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          width="280px"
          height="280px"
          className={`absolute bottom-16 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          role="menu"
          aria-label={t('common.quickAdd') || 'Quick add menu'}
          aria-hidden={!isOpen}
        >
          {/* Arc background (white/dark semicircle) */}
          <path
            d={`M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 0 ${CENTER_X + RADIUS} ${CENTER_Y}`}
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
            className="dark:fill-gray-900 dark:stroke-white/10"
          />

          {/* 5 slices (36° each, spanning 180° from 180° to 0° for top half) */}
          {SLICES.map((slice, index) => {
            const startAngle = 180 - index * 36;
            const endAngle = startAngle - 36;
            const slicePath = createSlicePath(startAngle, endAngle);
            const iconAngle = (startAngle + endAngle) / 2;
            const iconRad = (iconAngle * Math.PI) / 180;
            const iconX = CENTER_X + ICON_RADIUS * Math.cos(iconRad);
            const iconY = CENTER_Y + ICON_RADIUS * Math.sin(iconRad);

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
                  transform={`translate(${iconX}, ${iconY})`}
                  role="img"
                  aria-label={slice.label}
                  onClick={() => handleSliceClick(slice.id)}
                  className="cursor-pointer"
                >
                  <text
                    x="0"
                    y="0"
                    fontSize="24"
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

        {/* Plus Button - centered at bottom, toggles menu */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 dark:active:from-blue-800 dark:active:to-blue-900"
          aria-label={isOpen ? t('common.close') || 'Close menu' : t('common.quickAdd') || 'Quick add'}
          aria-expanded={isOpen}
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
