import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { getGroupMembers } from '../services/firestoreService';
import { calculateStreak } from '../utils/calculations';
import { countActiveSports } from '../utils/sports';
import { useTranslation } from '../hooks/useTranslation';
import type { GroupMember } from '../types';
import { useCombinedTracking } from '../hooks/useCombinedTracking';
import { glassCardClasses, glassCardHoverClasses, designTokens } from '../theme/tokens';

function LeaderboardPage() {
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState<'week' | 'month' | 'all'>('month');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  const user = useStore((state) => state.user);
  const combinedTracking = useCombinedTracking();
  const locale = language === 'de' ? de : enUS;

  // Calculate current user stats
  const userStats = useMemo(() => {
    const totalPushups = Object.values(combinedTracking).reduce(
      (sum, day) => sum + (day.pushups?.total || 0),
      0
    );
    const sportSessions = Object.values(combinedTracking).reduce(
      (sum, day) =>
        sum +
        countActiveSports(day.sports),
      0
    );
    const streak = calculateStreak(combinedTracking);

    return {
      totalPushups,
      sportSessions,
      streak,
    };
  }, [combinedTracking]);

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
        return 'bg-gradient-to-br from-yellow-400 to-orange-500 border border-white/20 shadow-lg';
      case 2:
        return 'bg-white/20 border border-white/40';
      case 3:
        return 'bg-orange-500/80 border border-white/20';
      default:
        return 'bg-white/10 border border-white/20';
    }
  };

  return (
    <div className="min-h-screen-mobile safe-pt pb-20 overflow-y-auto viewport-safe">
      <div className="mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 lg:px-0">
        <div className="flex flex-col gap-3 md:gap-4">
          <section className={`${glassCardClasses} ${designTokens.padding.spacious} text-white`}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-fluid-h1 font-semibold flex items-center gap-2">
                    <span aria-hidden="true">👥</span>
                    {t('group.title')}
                  </h1>
                  <p className="text-sm text-white/70">{t('group.rankings')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-white/50 tracking-[0.28em] uppercase">
                    {t('group.code')}
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 font-mono text-sm tracking-[0.35em] uppercase">
                    {user?.groupCode || t('group.none')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">🔥</span>
                      {t('group.daysStreak')}
                    </span>
                  </div>
                  <div className="text-3xl font-semibold text-white mt-2">{userStats.streak}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">💪</span>
                      {t('group.pushups')}
                    </span>
                  </div>
                  <div className="text-3xl font-semibold text-white mt-2">{userStats.totalPushups}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm px-4 py-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">🏃</span>
                      {t('group.sportSessions')}
                    </span>
                  </div>
                  <div className="text-3xl font-semibold text-white mt-2">{userStats.sportSessions}</div>
                </div>
              </div>
            </div>
          </section>

          <section className={`${glassCardClasses} p-2 flex items-center gap-2`}>
            {[
              { key: 'week' as const, label: t('group.week') },
              { key: 'month' as const, label: t('group.month') },
              { key: 'all' as const, label: t('group.all') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-winter-500/80 to-sky-500/80 text-white shadow-[0_8px_24px_rgba(59,130,246,0.45)]'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </section>

          {filter === 'week' && (
            <section className={`${glassCardHoverClasses} ${designTokens.padding.compact} text-white`}>
              <h2 className="text-sm font-semibold text-white mb-3">
                {t('group.trainingWeek')} ({t('group.weekNumber')} {format(now, 'ww', { locale })})
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {daysInWeek.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayTracking = combinedTracking[dateStr] || {};
                  const isCurrentDay = isToday(day);
                  const pushups = dayTracking?.pushups?.total || 0;
                  const sports = countActiveSports(dayTracking?.sports);
                  const water = dayTracking?.water || 0;
                  const protein = dayTracking?.protein || 0;
                  const weight = dayTracking?.weight?.value || 0;
                  const progress =
                    (pushups > 0 ? 20 : 0) +
                    (sports > 0 ? 20 : 0) +
                    (water >= 2000 ? 20 : 0) +
                    (protein >= 100 ? 20 : 0) +
                    (weight > 0 ? 20 : 0);

                  return (
                    <div key={`week-${dateStr}`} className="flex flex-col items-center gap-1">
                      <div className="text-xs font-medium text-white/70">
                        {format(day, 'EEE', { locale })}
                      </div>

                      <div className="w-12 h-12 flex items-center justify-center relative">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            className="stroke-white/15"
                            strokeWidth="4"
                          />
                          {progress > 0 && (
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              className={isCurrentDay ? 'stroke-winter-200' : 'stroke-winter-400'}
                              strokeWidth="4"
                              strokeDasharray={`${progress} 100`}
                              strokeLinecap="round"
                            />
                          )}
                        </svg>
                        <div
                          className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${
                            isCurrentDay ? 'text-white' : 'text-white/80'
                          }`}
                        >
                          {format(day, 'd')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {filter === 'month' && (
            <section className={`${glassCardHoverClasses} ${designTokens.padding.compact} text-white`}>
              <h2 className="text-sm font-semibold text-white mb-3">
                {t('group.trainingHeatmap')} ({format(now, 'MMMM yyyy', { locale })})
              </h2>
              <div className="grid grid-cols-7 gap-0.5 max-w-sm">
                {(language === 'de' ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((dayLabel) => (
                  <div
                    key={dayLabel}
                    className="text-center text-xs font-medium text-white/60 pb-0.5"
                  >
                    {dayLabel}
                  </div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`offset-month-${i}`} className="aspect-square" />
                ))}
                {daysInMonth.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayTracking = combinedTracking[dateStr];
                  const isCurrentDay = isToday(day);

                  const pushups = dayTracking?.pushups?.total || 0;
                  const sports = countActiveSports(dayTracking?.sports);
                  const water = dayTracking?.water || 0;
                  const protein = dayTracking?.protein || 0;
                  const weight = dayTracking?.weight?.value || 0;

                  const progress =
                    (pushups > 0 ? 20 : 0) +
                    (sports > 0 ? 20 : 0) +
                    (water >= 2000 ? 20 : 0) +
                    (protein >= 100 ? 20 : 0) +
                    (weight > 0 ? 20 : 0);

                  return (
                    <div key={`month-${dateStr}`} className="aspect-square flex items-center justify-center relative">
                      <svg className="w-1/2 h-1/2 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          className={isSameMonth(day, monthStart) ? 'stroke-white/15' : 'stroke-white/5'}
                          strokeWidth="4"
                        />
                        {progress > 0 && (
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            className={isCurrentDay ? 'stroke-winter-200' : 'stroke-winter-400'}
                            strokeWidth="4"
                            strokeDasharray={`${progress} 100`}
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                      <div
                        className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                          isCurrentDay
                            ? 'text-white'
                            : isSameMonth(day, monthStart)
                            ? 'text-white/80'
                            : 'text-white/30'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('group.rankings')}</h2>
            </div>
            {loading ? (
              <div className="text-center py-8 text-white/70">{t('common.loading')}</div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-8 text-white/70">{t('group.noMembers')}</div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedLeaderboardData.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = user?.nickname === entry.nickname;
                  const entryId = entry.id ?? `entry-${index}`;

                  return (
                    <div
                      key={entryId}
                      className={`p-4 rounded-2xl transition-all cursor-pointer border border-white/10 ${
                        isCurrentUser
                          ? 'bg-gradient-to-r from-winter-500/60 to-sky-500/40 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                      onClick={() => { setSelectedUser(selectedUser === entryId ? null : entryId); }}
                    >
                      <div className="flex items-center gap-4">
                        {(entry.shareProfilePicture || isCurrentUser) && entry.photoURL ? (
                          <img
                            src={entry.photoURL}
                            alt={entry.nickname}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full border-2 border-white/30 object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const defaultAvatar = target.nextElementSibling as HTMLElement;
                              if (defaultAvatar) defaultAvatar.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br from-winter-400 to-winter-600 ${
                            (entry.shareProfilePicture || isCurrentUser) && entry.photoURL ? 'hidden' : 'flex'
                          } items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                        >
                          {entry.nickname.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center gap-2 text-white">
                            <span className="truncate">{entry.nickname}</span>
                            {isCurrentUser && (
                              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {t('group.you')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white/70 flex items-center gap-2">
                            <span>
                              {entry.streak} {t('group.daysStreak')} 🔥
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>
                              💪 {entry.dailyPushups || 0} {t('group.today')}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-10 h-10 rounded-full ${getRankColor(rank)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                        >
                          #{rank}
                        </div>
                      </div>

                      {selectedUser === entryId && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
                            <div>
                              <div className="text-2xl mb-1">💪</div>
                              <div className="text-lg font-semibold">{entry.totalPushups}</div>
                              <div className="text-xs text-white/70">{t('group.pushups')}</div>
                            </div>
                            <div>
                              <div className="text-2xl mb-1">🏃</div>
                              <div className="text-lg font-semibold">{entry.sportSessions}</div>
                              <div className="text-xs text-white/70">{t('group.sportSessions')}</div>
                            </div>
                            <div>
                              <div className="text-2xl mb-1">💧</div>
                              <div className="text-lg font-semibold">{(entry.avgWater / 1000).toFixed(1)}L</div>
                              <div className="text-xs text-white/70">{t('group.avgWater')}</div>
                            </div>
                            <div>
                              <div className="text-2xl mb-1">🥩</div>
                              <div className="text-lg font-semibold">{entry.avgProtein}g</div>
                              <div className="text-xs text-white/70">{t('group.avgProtein')}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={`${glassCardHoverClasses} ${designTokens.padding.spacious} text-white`}>
            <h2 className="text-lg font-semibold mb-4">🏅 {t('group.achievements')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: '🔥', label: t('group.achievement7Days'), locked: userStats.streak < 7 },
                { icon: '💪', label: t('group.achievement1000'), locked: userStats.totalPushups < 1000 },
                { icon: '🏃', label: t('group.achievement20Workouts'), locked: userStats.sportSessions < 20 },
                { icon: '⭐', label: t('group.achievementTop3'), locked: true },
              ].map((achievement) => (
                <div
                  key={achievement.label}
                  className={`p-4 rounded-2xl text-center transition-all ${
                    achievement.locked
                      ? 'bg-white/10 border border-white/10 text-white/50'
                      : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="text-xs font-medium">{achievement.label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
