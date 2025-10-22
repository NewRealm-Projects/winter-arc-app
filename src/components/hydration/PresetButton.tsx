import type { DrinkPreset } from '../../types';

interface PresetButtonProps {
  preset: DrinkPreset;
  onClick: () => void;
  onEdit?: () => void;
  selected?: boolean;
}

function PresetButton({ preset, onClick, onEdit, selected = false }: PresetButtonProps) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={`w-full px-3 py-2.5 rounded-lg transition-colors text-left ${
          selected
            ? 'bg-blue-500 dark:bg-blue-600 border-2 border-blue-600 dark:border-blue-500 text-white'
            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{preset.emoji || '💧'}</span>
          <span className="text-xs font-medium truncate">{preset.name}</span>
        </div>
        <div className={`text-[10px] ${selected ? 'text-blue-100 dark:text-blue-200' : 'text-blue-500 dark:text-blue-400'}`}>
          +{preset.amountMl}ml
        </div>
      </button>

      {/* Edit button (appears on hover, only if onEdit is provided) */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-1 right-1 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
          aria-label="Edit preset"
        >
          ⚙️
        </button>
      )}
    </div>
  );
}

export default PresetButton;
