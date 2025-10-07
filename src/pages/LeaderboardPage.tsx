import { useState, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { getGroupMembers } from '../services/firestoreService';
import { calculateStreak } from '../utils/calculations';
import { countActiveSports } from '../utils/sports';
import { useTranslation } from '../hooks/useTranslation';
import type { Activity, GroupMember } from '../types';
import { useCombinedTracking } from '../hooks/useCombinedTracking';
import { glassCardClasses, glassCardHoverClasses, designTokens } from '../theme/tokens';

function LeaderboardPage() {
  const { t, language } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  const user = useStore((state) => state.user);
  const combinedTracking = useCombinedTracking();
  const filter = useStore((state) => state.leaderboardFilter);
  const setFilter = useStore((state) => state.setLeaderboardFilter);
  const locale = language === 'de' ? de : enUS;

  const enabledActivities = useMemo<Activity[]>(
    () => user?.enabledActivities || ['pushups', 'sports', 'water', 'protein'],
    [user?.enabledActivities]
  );

  const userStats = useMemo(() => {
    const totalPushups = Object.values(combinedTracking).reduce(
      (sum, day) => sum + (day.pushups?.total || 0),
      0
    );
    const sportSessions = Object.values(combinedTracking).reduce(
      (sum, day) => sum + countActiveSports(day.sports),
      0
    );
    const streak = calculateStreak(combinedTracking, enabledActivities);

    return {
      totalPushups,
      sportSessions,
      streak,
    };
  }, [combinedTracking, enabledActivities]);

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
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            break;
          case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'all':
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

    void loadLeaderboard();
  }, [user?.groupCode, filter]);

  const sortedLeaderboardData = useMemo(() => {
    if (!leaderboardData.length) return [];

    return [...leaderboardData].sort((a, b) => {
      if (b.totalPushups !== a.totalPushups) return b.totalPushups - a.totalPushups;
      return b.streak - a.streak;
    });
  }, [leaderboardData]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = (monthStart.getDay() + 6) % 7;

  const getRankBadgeClasses = (rank: number) => {
    const baseBadgeClasses =
      'w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm transition-colors duration-200';

    switch (rank) {
      case 1:
        return `${baseBadgeClasses} bg-gradient-to-br from-winter-200/90 via-winter-300/90 to-winter-500/90 text-slate-900 border-white/40 shadow-[0_10px_30px_rgba(14,165,233,0.45)]`;
      case 2:
        return `${baseBadgeClasses} bg-gradient-to-br from-winter-200/70 to-winter-400/70 text-slate-900 border-white/30 shadow-[0_6px_24px_rgba(14,165,233,0.35)]`;
      case 3:
        return `${baseBadgeClasses} bg-gradient-to-br from-winter-300/60 to-winter-600/60 text-white border-white/20 shadow-[0_6px_24px_rgba(8,47,73,0.35)]`;
      default:
        return `${baseBadgeClasses} bg-white/10 text-white border-white/20`;
    }
  };

  const calculateDayProgress = (dateStr: string) => {
    const totalTasksForProgress = enabledActivities.length + 1; // +1 for weight
    const pointsPerTask = 100 / totalTasksForProgress;

    const dayTracking = combinedTracking[dateStr];
    if (!dayTracking) {
      return 0;
    }

    let progress = 0;
    if (enabledActivities.includes('pushups') && (dayTracking.pushups?.total || 0) > 0) {
      progress += pointsPerTask;
    }
    if (enabledActivities.includes('sports') && countActiveSports(dayTracking?.sports) > 0) {
      progress += pointsPerTask;
    }
    if (enabledActivities.includes('water') && (dayTracking.water || 0) >= 2000) {
      progress += pointsPerTask;
    }
    if (enabledActivities.includes('protein') && (dayTracking?.protein || 0) >= 100) {
      progress += pointsPerTask;
    }
    if (dayTracking.weight?.value) {
      progress += pointsPerTask;
    }

    return progress;
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
              onClick={() => { setFilter(tab.key); }}
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
                  const progress = calculateDayProgress(dateStr);
                  const isCurrentDay = isToday(day);

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
                  const progress = calculateDayProgress(dateStr);
                  const isCurrentDay = isToday(day);

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
            <h2 className="text-lg font-semibold text-white mb-4">
              {t('group.rankings')}
            </h2>
            {loading ? (
              <div className="text-center py-8 text-white/60">
                {t('common.loading')}
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                {t('group.noMembers')}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedLeaderboardData.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = user?.nickname === entry.nickname;
                  const entryId = entry.id ?? entry.nickname;
                  const isExpanded = selectedUser === entryId;

                  return (
                    <button
                      key={entryId || `entry-${index}`}
                      type="button"
                      aria-expanded={isExpanded}
                      className={`${glassCardClasses} ${designTokens.padding.compact} md:p-5 group relative w-full text-left cursor-pointer overflow-hidden transition-all duration-200 ${
                        isCurrentUser
                          ? 'ring-1 ring-winter-300/70 shadow-[0_12px_40px_rgba(14,165,233,0.35)] bg-gradient-to-br from-winter-500/15 via-winter-400/10 to-transparent'
                          : isExpanded
                          ? 'border-white/20 bg-white/10 shadow-[0_10px_36px_rgba(15,23,42,0.35)]'
                          : 'hover:border-white/20 hover:bg-white/10'
                      } ${designTokens.tile.hover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-winter-200/70`}
                      onClick={() => {
                        setSelectedUser(isExpanded ? null : entryId);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {(entry.shareProfilePicture || isCurrentUser) && entry.photoURL ? (
                          <img
                            src={entry.photoURL}
                            alt={entry.nickname}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full border-2 border-white/20 object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const defaultAvatar = target.nextElementSibling as HTMLElement;
                              if (defaultAvatar) defaultAvatar.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br from-winter-400 to-winter-600 ${(entry.shareProfilePicture || isCurrentUser) && entry.photoURL ? 'hidden' : 'flex'} items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-[0_8px_24px_rgba(14,165,233,0.45)]`}
                        >
                          {entry.nickname.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{entry.nickname}</span>
                            {isCurrentUser && (
                              <span className="text-xs bg-winter-500/80 text-white px-2 py-0.5 rounded-full ml-1">
                                {t('group.you')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white/70 flex items-center gap-2">
                            <span>
                              {entry.streak} {t('group.daysStreak')} 🔥
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-winter-200">
                              💪 {entry.dailyPushups || 0} {t('group.today')}
                            </span>
                          </div>
                        </div>

                        <div className={`${getRankBadgeClasses(rank)} flex-shrink-0`}>
                          #{rank}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white/12">
                          {(() => {
                            const userEnabledActivities = entry.enabledActivities || ['pushups', 'sports', 'water', 'protein'];
                            const stats = [] as JSX.Element[];

                            if (userEnabledActivities.includes('pushups')) {
                              stats.push(
                                <div key="pushups" className="flex flex-col items-center gap-1 text-center">
                                  <div className="text-2xl mb-1">💪</div>
                                  <div className="text-lg font-bold text-white">
                                    {entry.totalPushups}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {t('group.pushups')}
                                  </div>
                                </div>
                              );
                            }

                            if (userEnabledActivities.includes('sports')) {
                              stats.push(
                                <div key="sports" className="flex flex-col items-center gap-1 text-center">
                                  <div className="text-2xl mb-1">🏃</div>
                                  <div className="text-lg font-bold text-white">
                                    {entry.sportSessions}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {t('group.sportSessions')}
                                  </div>
                                </div>
                              );
                            }

                            if (userEnabledActivities.includes('water')) {
                              stats.push(
                                <div key="water" className="flex flex-col items-center gap-1 text-center">
                                  <div className="text-2xl mb-1">💧</div>
                                  <div className="text-lg font-bold text-white">
                                    {(entry.avgWater / 1000).toFixed(1)}L
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {t('group.avgWater')}
                                  </div>
                                </div>
                              );
                            }

                            if (userEnabledActivities.includes('protein')) {
                              stats.push(
                                <div key="protein" className="flex flex-col items-center gap-1 text-center">
                                  <div className="text-2xl mb-1">🥩</div>
                                  <div className="text-lg font-bold text-white">
                                    {entry.avgProtein}g
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {t('group.avgProtein')}
                                  </div>
                                </div>
                              );
                            }

                            const gridClass = stats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4';

                            return <div className={`grid ${gridClass} gap-4`}>{stats}</div>;
                          })()}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
