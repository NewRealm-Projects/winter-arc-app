import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { getGroupMembers } from '../services/firestoreService';
import { calculateStreak } from '../utils/calculations';

function LeaderboardPage() {
  const [filter, setFilter] = useState<'week' | 'month' | 'all'>('month');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);

  // Calculate current user stats
  const userStats = useMemo(() => {
    const trackingDates = Object.keys(tracking).sort();
    const totalPushups = Object.values(tracking).reduce(
      (sum, day) => sum + (day.pushups?.total || 0),
      0
    );
    const sportSessions = Object.values(tracking).reduce(
      (sum, day) =>
        sum +
        Object.values(day.sports || {}).filter(Boolean).length,
      0
    );
    const streak = calculateStreak(trackingDates);

    return {
      totalPushups,
      sportSessions,
      streak,
    };
  }, [tracking]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user?.groupCode) return;

      setLoading(true);
      try {
        const result = await getGroupMembers(user.groupCode);
        if (result.success && result.data) {
          setLeaderboardData(result.data);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [user?.groupCode]);

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500';
      case 2:
        return 'bg-gray-400';
      case 3:
        return 'bg-orange-600';
      default:
        return 'bg-winter-600';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedUserData = selectedUser
    ? leaderboardData.find((u: any) => u.userId === selectedUser)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      {/* Header */}
      <div className="bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">🏆 Leaderboard</h1>
          <p className="text-winter-100">Gruppe: {user?.groupCode || 'Keine'}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-20 space-y-4">
        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 flex gap-2">
          {[
            { key: 'week' as const, label: 'Woche' },
            { key: 'month' as const, label: 'Monat' },
            { key: 'all' as const, label: 'Gesamt' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-winter-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Heatmap Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Trainings-Heatmap ({format(currentMonth, 'MMMM yyyy', { locale: de })})
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTracking = tracking[dateStr];
              const isCompleted = dayTracking?.completed || false;
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={dateStr}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrentDay
                      ? 'bg-winter-500 text-white ring-2 ring-winter-600'
                      : isSameMonth(day, currentMonth)
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      : 'bg-transparent text-gray-300 dark:text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard Rankings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Rankings
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Laden...
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Keine Gruppenmitglieder gefunden
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboardData.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user?.nickname === entry.nickname;

              return (
                <div
                  key={entry.userId}
                  className={`p-4 rounded-xl transition-all cursor-pointer ${
                    isCurrentUser
                      ? 'bg-winter-100 dark:bg-winter-900 ring-2 ring-winter-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() =>
                    setSelectedUser(
                      selectedUser === entry.userId ? null : entry.userId
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-12 h-12 rounded-full ${getRankColor(
                        rank
                      )} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                    >
                      #{rank}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {entry.nickname}
                        {isCurrentUser && (
                          <span className="text-xs bg-winter-500 text-white px-2 py-0.5 rounded">
                            Du
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.streak} Tage Streak 🔥
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {entry.score}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Punkte
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedUser === entry.userId && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-2xl mb-1">💪</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {entry.totalPushups}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Liegestütze
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl mb-1">🏃</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {entry.sportSessions}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Sport-Sessions
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl mb-1">💧</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {(entry.avgWater / 1000).toFixed(1)}L
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ø Wasser
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl mb-1">🥩</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {entry.avgProtein}g
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Ø Protein
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🏅 Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: '🔥',
                label: '7 Tage Streak',
                locked: userStats.streak < 7
              },
              {
                icon: '💪',
                label: '1000 Pushups',
                locked: userStats.totalPushups < 1000
              },
              {
                icon: '🏃',
                label: '20 Workouts',
                locked: userStats.sportSessions < 20
              },
              {
                icon: '⭐',
                label: 'Top 3',
                locked: true // TODO: Calculate rank
              },
            ].map((achievement, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl text-center ${
                  achievement.locked
                    ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                    : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="text-xs font-medium">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
