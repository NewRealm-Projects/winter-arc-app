import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

// Mock data for now - will be replaced with real Firebase data
const mockLeaderboard = [
  { userId: '1', nickname: 'Alex', score: 850, rank: 1 },
  { userId: '2', nickname: 'Maria', score: 720, rank: 2 },
  { userId: '3', nickname: 'Jonas', score: 680, rank: 3 },
  { userId: '4', nickname: 'Sarah', score: 540, rank: 4 },
  { userId: '5', nickname: 'Tom', score: 420, rank: 5 },
];

function LeaderboardPreview() {
  const user = useStore((state) => state.user);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-orange-600';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          🏆 Leaderboard
        </h2>
        <Link
          to="/leaderboard"
          className="text-sm font-medium text-winter-600 dark:text-winter-400 hover:text-winter-700 dark:hover:text-winter-300"
        >
          Alle anzeigen →
        </Link>
      </div>

      {/* Group Info */}
      <div className="mb-4 p-3 bg-winter-50 dark:bg-winter-900/20 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Gruppe:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {user?.groupCode || 'Keine Gruppe'}
          </span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {mockLeaderboard.map((entry) => {
          const isCurrentUser = user?.nickname === entry.nickname;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                isCurrentUser
                  ? 'bg-winter-100 dark:bg-winter-900 ring-2 ring-winter-500'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              {/* Rank */}
              <div
                className={`flex-shrink-0 w-12 text-center font-bold ${getRankColor(
                  entry.rank
                )}`}
              >
                {getRankIcon(entry.rank)}
              </div>

              {/* Nickname */}
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {entry.nickname}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-winter-600 dark:text-winter-400">
                      (Du)
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {entry.score}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Punkte
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Join Group CTA */}
      {!user?.groupCode && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            Du bist noch keiner Gruppe beigetreten!
          </p>
          <Link
            to="/settings"
            className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:underline"
          >
            Jetzt Gruppe beitreten →
          </Link>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPreview;
