/**
 * PresetButton Component
 * Simple button for hydration presets
 */

import type { DrinkPreset } from '../../types';

interface PresetButtonProps {
  preset: DrinkPreset;
  onClick: () => void;
  onEdit?: () => void;
  selected?: boolean;
}

export default function PresetButton({
  preset,
  onClick,
  selected = false,
}: PresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${selected
          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
          : 'border-white/20 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
        }`}
    >
      {preset.emoji && <span className="text-2xl">{preset.emoji}</span>}
      <span>{preset.name}</span>
      <span className="text-xs opacity-60">{preset.amountMl}ml</span>
    </button>
  );
}
