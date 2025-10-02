import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

function PushupTile() {
  const [showModal, setShowModal] = useState(false);
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTracking = tracking[today];
  const totalToday = todayTracking?.pushups?.total || 0;

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

      {/* Modal - Coming Soon */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Liegestütze tracken
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Schnelleingabe und Trainingsmodus kommen bald!
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-3 bg-winter-600 text-white rounded-lg font-semibold hover:bg-winter-700 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default PushupTile;
