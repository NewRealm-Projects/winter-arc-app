import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

function PushupTile() {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);
  const updateDayTracking = useStore((state) => state.updateDayTracking);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTracking = tracking[today];
  const totalToday = todayTracking?.pushups?.total || 0;

  const handleSave = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      updateDayTracking(today, {
        pushups: {
          total: (totalToday || 0) + amount,
        },
      });
      setInputValue('');
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl mb-2">💪</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Liegestütze
            </h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-winter-600 dark:text-winter-400">
              {totalToday}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              heute
            </div>
          </div>
        </div>

        {/* Training Plan Info */}
        {user?.pushupState && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="px-2 py-1 bg-winter-100 dark:bg-winter-900 rounded text-winter-700 dark:text-winter-300 font-medium">
              Plan: {user.pushupState.baseReps} × {user.pushupState.sets}
            </span>
          </div>
        )}
      </button>

      {/* Modal - Quick Input */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Liegestütze hinzufügen
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Wie viele Liegestütze hast du gemacht?
            </p>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Anzahl eingeben"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-winter-500 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!inputValue || parseInt(inputValue) <= 0}
                className="flex-1 px-4 py-3 bg-winter-600 text-white rounded-lg font-semibold hover:bg-winter-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setInputValue('');
                }}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PushupTile;
