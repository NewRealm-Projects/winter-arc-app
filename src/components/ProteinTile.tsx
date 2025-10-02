import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateProteinGoal } from '../utils/calculations';

function ProteinTile() {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTracking = tracking[today];
  const currentProtein = todayTracking?.protein || 0;

  const proteinGoal = user?.weight ? calculateProteinGoal(user.weight) : 150;

  const addProtein = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      updateDayTracking(today, {
        protein: currentProtein + amount,
      });
      setInputValue('');
      setShowInput(false);
    }
  };

  const progress = Math.min((currentProtein / proteinGoal) * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl mb-2">🥩</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Protein
          </h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {currentProtein}g
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            von {proteinGoal}g
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Input */}
      {showInput ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Gramm"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            autoFocus
          />
          <button
            onClick={addProtein}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            +
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setInputValue('');
            }}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full px-4 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium"
        >
          Protein hinzufügen
        </button>
      )}
    </div>
  );
}

export default ProteinTile;
