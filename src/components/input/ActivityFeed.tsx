import { memo, useMemo } from 'react';
import { formatDistanceToNow, isSameDay } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { SmartNote } from '../../types/events';

interface ActivityFeedProps {
  notes: SmartNote[];
  isLoading?: boolean;
  onEditClick?: (note: SmartNote) => void;
}

/**
 * Activity Feed for Mobile Input Page (<481px)
 * Shows mixed feed of all activity types (food, water, notes, training)
 * Grouped by date (Today, Yesterday, etc.)
 */
const ActivityFeed = memo(function ActivityFeed({
  notes,
  isLoading = false,
  onEditClick,
}: ActivityFeedProps) {
  const { t } = useTranslation();

  // Group notes by date
  const groupedNotes = useMemo(() => {
    const today = new Date();
    const groups: Record<string, SmartNote[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    notes.forEach((note) => {
      const noteDate = new Date(note.ts);

      if (isSameDay(noteDate, today)) {
        groups.today.push(note);
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (isSameDay(noteDate, yesterday)) {
          groups.yesterday.push(note);
        } else {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (noteDate > weekAgo) {
            groups.week.push(note);
          } else {
            groups.older.push(note);
          }
        }
      }
    });

    return groups;
  }, [notes]);

  const getActivityIcon = (type?: string): string => {
    switch (type) {
      case 'food':
        return '🍗';
      case 'drink':
        return '🥤';
      case 'workout':
        return '🏋️';
      case 'pushup':
        return '💪';
      case 'weight':
        return '⚖️';
      case 'custom':
        return '📝';
      default:
        return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="activity-feed-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-white/60" data-testid="activity-feed-empty">
        <p className="text-sm">{t('notes.noActivities')}</p>
      </div>
    );
  }

  const renderGroup = (title: string, items: SmartNote[]) => {
    if (items.length === 0) return null;

    return (
      <div key={title} className="space-y-2">
        <h3 className="text-xs font-semibold text-white/60 px-3 py-2 uppercase tracking-wide">
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((note) => {
            const timeAgo = formatDistanceToNow(note.ts, { addSuffix: true });
            const icon = getActivityIcon(note.activityType);

            return (
              <button
                key={note.id}
                onClick={() => onEditClick?.(note)}
                type="button"
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] active:scale-95 text-left"
                data-testid={`activity-item-${note.id}`}
              >
                {/* Icon */}
                <span className="text-lg flex-shrink-0 pt-0.5">{icon}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white/90">{note.summary}</p>
                  {note.activitySummary && (
                    <p className="text-xs text-white/60 truncate">{note.activitySummary}</p>
                  )}
                  <p className="text-[10px] text-white/40 mt-1">{timeAgo}</p>
                </div>

                {/* Pending indicator */}
                {note.pending && <span title={t('notes.processing')}>⏳</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" data-testid="activity-feed">
      {renderGroup(t('notes.today'), groupedNotes.today)}
      {renderGroup(t('notes.yesterday'), groupedNotes.yesterday)}
      {renderGroup(t('notes.thisWeek'), groupedNotes.week)}
      {renderGroup(t('notes.older'), groupedNotes.older)}
    </div>
  );
});

export default ActivityFeed;
