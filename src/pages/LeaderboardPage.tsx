import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
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
        const now = new Date();
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        switch (filter) {
          case 'week':
            startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
            endDate = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
            break;
          case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'all':
            // Don't pass date range for all-time stats
            startDate = undefined;
            endDate = undefined;
            break;
        }

        const result = await getGroupMembers(user.groupCode, startDate, endDate);
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
  }, [user?.groupCode, filter]);

  // Sort leaderboard data
  const sortedLeaderboardData = useMemo(() => {
    if (!leaderboardData.length) return [];

    // Sort by total pushups in the filtered period, then by streak
    return [...leaderboardData].sort((a, b) => {
      if (b.totalPushups !== a.totalPushups) return b.totalPushups - a.totalPushups;
      return b.streak - a.streak;
    });
  }, [leaderboardData]);

  const now = new Date();

  // Week data
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month data
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate offset for first day (0 = Monday, 6 = Sunday)
  const firstDayOffset = (monthStart.getDay() + 6) % 7;

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
      {/* Header */}
      <div className="bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 text-white p-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">👥 Gruppe</h1>
          <p className="text-winter-100">Code: {user?.groupCode || 'Keine'}</p>
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

        {/* Week Heatmap - Only show in week view */}
        {filter === 'week' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Trainings-Woche (KW {format(now, 'ww', { locale: de })})
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {daysInWeek.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTracking = tracking[dateStr];
                const isCurrentDay = isToday(day);

                // Calculate progress percentage
                const pushups = dayTracking?.pushups?.total || 0;
                const sports = Object.values(dayTracking?.sports || {}).filter(Boolean).length;
                const water = dayTracking?.water || 0;
                const protein = dayTracking?.protein || 0;

                // Simple progress: 25% per category (pushups, sports, water, protein)
                const progress = (
                  (pushups > 0 ? 25 : 0) +
                  (sports > 0 ? 25 : 0) +
                  (water >= 2000 ? 25 : 0) +
                  (protein >= 100 ? 25 : 0)
                );

                return (
                  <div key={dateStr} className="flex flex-col items-center gap-1">
                    {/* Day label */}
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {format(day, 'EEE', { locale: de })}
                    </div>

                    {/* Progress Circle (larger for week view) */}
                    <div className="w-12 h-12 flex items-center justify-center relative">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        {/* Background circle */}
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          className="stroke-gray-200 dark:stroke-gray-700"
                          strokeWidth="4"
                        />
                        {/* Progress circle */}
                        {progress > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            className={`${
                              isCurrentDay
                                ? 'stroke-winter-500'
                                : 'stroke-winter-400'
                            }`}
                            strokeWidth="4"
                            strokeDasharray={`${progress} 100`}
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                      {/* Day number */}
                      <div
                        className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${
                          isCurrentDay
                            ? 'text-winter-600 dark:text-winter-400'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month Heatmap - Only show in month view */}
        {filter === 'month' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Trainings-Heatmap ({format(now, 'MMMM yyyy', { locale: de })})
            </h2>
            <div className="grid grid-cols-7 gap-0.5 max-w-sm">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-0.5"
                >
                  {day}
                </div>
              ))}
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTracking = tracking[dateStr];
              const isCurrentDay = isToday(day);

              // Calculate progress percentage
              const pushups = dayTracking?.pushups?.total || 0;
              const sports = Object.values(dayTracking?.sports || {}).filter(Boolean).length;
              const water = dayTracking?.water || 0;
              const protein = dayTracking?.protein || 0;

              // Simple progress: 25% per category (pushups, sports, water, protein)
              const progress = (
                (pushups > 0 ? 25 : 0) +
                (sports > 0 ? 25 : 0) +
                (water >= 2000 ? 25 : 0) +
                (protein >= 100 ? 25 : 0)
              );

              return (
                <div
                  key={dateStr}
                  className="aspect-square flex items-center justify-center relative"
                >
                  {/* Progress Circle (50% size) */}
                  <svg className="w-1/2 h-1/2 -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className={`${
                        isSameMonth(day, monthStart)
                          ? 'stroke-gray-200 dark:stroke-gray-700'
                          : 'stroke-gray-100 dark:stroke-gray-800'
                      }`}
                      strokeWidth="4"
                    />
                    {/* Progress circle */}
                    {progress > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className={`${
                          isCurrentDay
                            ? 'stroke-winter-500'
                            : 'stroke-winter-400'
                        }`}
                        strokeWidth="4"
                        strokeDasharray={`${progress} 100`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  {/* Day number */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                      isCurrentDay
                        ? 'text-winter-600 dark:text-winter-400'
                        : isSameMonth(day, monthStart)
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-300 dark:text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

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
              {sortedLeaderboardData.map((entry, index) => {
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
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{entry.streak} Tage Streak 🔥</span>
                        <span>•</span>
                        <span>💪 {entry.dailyPushups || 0} heute</span>
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
