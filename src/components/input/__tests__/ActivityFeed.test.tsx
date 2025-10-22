import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ActivityFeed from '../ActivityFeed';
import type { SmartNote } from '../../../types/events';

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

describe('ActivityFeed', () => {
  const mockNotes: SmartNote[] = [
    {
      id: '1',
      ts: Date.now(),
      raw: 'Ate breakfast',
      summary: 'Ate breakfast',
      events: [],
      activityType: 'food',
    },
    {
      id: '2',
      ts: Date.now() - 3600000, // 1 hour ago
      raw: 'Drank water',
      summary: 'Drank water',
      events: [],
      activityType: 'drink',
    },
  ];

  it('renders empty state when no notes', () => {
    render(<ActivityFeed notes={[]} />);

    expect(screen.getByTestId('activity-feed-empty')).toBeInTheDocument();
  });

  it('renders loading state when loading', () => {
    render(<ActivityFeed notes={[]} isLoading={true} />);

    expect(screen.getByTestId('activity-feed-loading')).toBeInTheDocument();
  });

  it('renders activity feed container', () => {
    render(<ActivityFeed notes={mockNotes} />);

    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
  });

  it('displays activity items with icons', () => {
    render(<ActivityFeed notes={mockNotes} />);

    expect(screen.getByText('🍗')).toBeInTheDocument(); // food icon
    expect(screen.getByText('🥤')).toBeInTheDocument(); // drink icon
  });

  it('displays activity summaries', () => {
    render(<ActivityFeed notes={mockNotes} />);

    expect(screen.getByText('Ate breakfast')).toBeInTheDocument();
    expect(screen.getByText('Drank water')).toBeInTheDocument();
  });

  it('calls onEditClick when activity item is clicked', () => {
    const onEditClick = vi.fn();
    render(<ActivityFeed notes={mockNotes} onEditClick={onEditClick} />);

    const firstItem = screen.getByTestId(`activity-item-${mockNotes[0].id}`);
    firstItem.click();

    expect(onEditClick).toHaveBeenCalledWith(mockNotes[0]);
  });

  it('shows pending indicator for processing notes', () => {
    const pendingNote: SmartNote = {
      ...mockNotes[0],
      pending: true,
    };

    render(<ActivityFeed notes={[pendingNote]} />);

    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('groups activities by date', () => {
    const now = Date.now();
    const yesterday = now - 86400000; // 1 day ago
    const notes: SmartNote[] = [
      {
        id: '1',
        ts: now,
        raw: 'Today activity',
        summary: 'Today activity',
        events: [],
        activityType: 'food',
      },
      {
        id: '2',
        ts: yesterday,
        raw: 'Yesterday activity',
        summary: 'Yesterday activity',
        events: [],
        activityType: 'drink',
      },
    ];

    render(<ActivityFeed notes={notes} />);

    expect(screen.getByText('notes.today')).toBeInTheDocument();
    expect(screen.getByText('notes.yesterday')).toBeInTheDocument();
  });
});
