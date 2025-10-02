import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

function HistoryPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const tracking = useStore((state) => state.tracking);
  const setTracking = useStore((state) => state.setTracking);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const locale = language === 'de' ? de : enUS;

  // Sort tracking entries by date (newest first)
  const sortedEntries = Object.entries(tracking).sort(
    ([dateA], [dateB]) => dateB.localeCompare(dateA)
  );

  const handleDelete = (date: string) => {
    const newTracking = { ...tracking };
    delete newTracking[date];
    setTracking(newTracking);
    setDeleteConfirm(null);
  };

  return (
  <div className="min-h-screen glass-dark safe-area-inset-top">
      {/* Header */}
  <div className="glass-dark text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
          >
            ← {t('tracking.back')}
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">📋 {t('tracking.historyTitle')}</h1>
            <p className="text-winter-100">
              {t('tracking.historySubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20">
        {sortedEntries.length === 0 ? (
          <div className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('tracking.noEntries')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('tracking.trackFirst')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map(([date, entry]) => {
              const dateObj = parseISO(date);
              const formattedDate = format(dateObj, 'EEE, dd. MMM yyyy', {
                locale,
              });

              return (
                <div
                  key={date}
                  className="glass dark:glass-dark rounded-[20px] hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formattedDate}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {date}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(date)}
                      className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                    >
                      {t('tracking.delete')}
                    </button>
                  </div>

                  {/* Tracking Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {entry.pushups && (
                      <div className="bg-winter-50 dark:bg-winter-900/20 rounded-lg p-3">
                        <div className="text-2xl mb-1">💪</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {entry.pushups.total || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('tracking.pushups')}
                        </div>
                      </div>
                    )}

                    {entry.sports && (Object.values(entry.sports).some(Boolean)) && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="text-2xl mb-1">🏃</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Object.values(entry.sports).filter(Boolean).length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('tracking.sportSessions')}
                        </div>
                      </div>
                    )}

                    {entry.water && entry.water > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="text-2xl mb-1">💧</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {(entry.water / 1000).toFixed(1)}L
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('tracking.water')}
                        </div>
                      </div>
                    )}

                    {entry.protein && entry.protein > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                        <div className="text-2xl mb-1">🥩</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {entry.protein}g
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('tracking.protein')}
                        </div>
                      </div>
                    )}

                    {entry.weight && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <div className="text-2xl mb-1">⚖️</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {entry.weight.value}kg
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('tracking.weight')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === date && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                        {t('tracking.deleteConfirm')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(date)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          {t('tracking.confirmDelete')}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
