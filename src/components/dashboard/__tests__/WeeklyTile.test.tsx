import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WeeklyTile from '../WeeklyTile';
import type { DailyCheckIn, DailyTrainingLoad } from '../../../types';

const translations: Record<string, string> = {
  'dashboard.weekOverview': 'Diese Woche',
  'dashboard.streakDays': 'Tage Streak',
  'dashboard.streakInfo': 'Streak zählt ab 50% Tageserfüllung (2/3 Aufgaben)',
  'dashboard.trainingLoad': 'Trainingslast',
  'dashboard.trainingLoadLevelLabel': 'Level',
  'dashboard.trainingLoadCheckIn': 'Check-in',
  'dashboard.previousWeek': 'Vorherige Woche',
  'dashboard.nextWeek': 'Nächste Woche',
  'dashboard.trainingLoadStatus.low': 'Niedrig',
  'dashboard.trainingLoadStatus.optimal': 'Optimal',
  'dashboard.trainingLoadStatus.high': 'Hoch',
  'checkIn.title': 'Check-in',
  'checkIn.subtitle': 'Status aktualisieren',
  'checkIn.sleepLabel': 'Schlaf',
  'checkIn.recoveryLabel': 'Regeneration',
  'checkIn.scoreMin': '1',
  'checkIn.scoreMax': '10',
  'checkIn.sickLabel': 'Krank?',
  'checkIn.sickHint': 'Toggle',
  'checkIn.toastSuccess': 'Gespeichert',
  'checkIn.toastError': 'Fehler',
  'common.cancel': 'Abbrechen',
  'common.save': 'Speichern',
  'common.saving': 'Speichern…',
  'common.close': 'Schließen',
};

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
    language: 'de',
  }),
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../../hooks/useCombinedTracking', () => ({
  useCombinedTracking: () => ({}),
  useCombinedDailyTracking: () => undefined,
}));

function createMockUser() {
  return {
    id: 'user-1',
    language: 'de',
    nickname: 'Tester',
    gender: 'male' as const,
    height: 180,
    weight: 80,
    hydrationGoalLiters: 2.5,
    proteinGoalGrams: 150,
    maxPushups: 20,
    groupCode: 'grp',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    pushupState: { baseReps: 10, sets: 3, restTime: 60 },
    enabledActivities: ['pushups', 'sports', 'water', 'protein'] as const,
  };
}

type StoreStateMock = {
  user: ReturnType<typeof createMockUser> | null;
  trainingLoad: Record<string, DailyTrainingLoad>;
  tracking: Record<string, unknown>;
  checkIns: Record<string, DailyCheckIn>;
  smartContributions: Record<string, unknown>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setCheckInForDate: ReturnType<typeof vi.fn>;
  setTrainingLoadForDate: ReturnType<typeof vi.fn>;
  setTrainingLoad: ReturnType<typeof vi.fn>;
  setUser: ReturnType<typeof vi.fn>;
  setTracking: ReturnType<typeof vi.fn>;
  updateDayTracking: ReturnType<typeof vi.fn>;
};

const storeState: StoreStateMock = {
  user: createMockUser(),
  trainingLoad: {} as Record<string, DailyTrainingLoad>,
  tracking: {} as Record<string, unknown>,
  checkIns: {} as Record<string, DailyCheckIn>,
  smartContributions: {} as Record<string, unknown>,
  selectedDate: '',
  setSelectedDate: vi.fn((date: string) => {
    storeState.selectedDate = date;
  }),
  setCheckInForDate: vi.fn(),
  setTrainingLoadForDate: vi.fn(),
  setTrainingLoad: vi.fn(),
  setUser: vi.fn(),
  setTracking: vi.fn(),
  updateDayTracking: vi.fn(),
};

vi.mock('../../../store/useStore', () => ({
  useStore: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock('../../../contexts/WeekContext', () => {
  const WEEK_OPTIONS = { weekStartsOn: 1 as const };

  return {
    __esModule: true as const,
    useWeekContext: () => {
      const [selectedDate, setSelectedDateState] = React.useState(
        format(new Date(), 'yyyy-MM-dd')
      );
      const [weekOffset, setWeekOffsetState] = React.useState(0);

      const activeWeekStart = React.useMemo(
        () => addDays(startOfWeek(new Date(), WEEK_OPTIONS), weekOffset * 7),
        [weekOffset]
      );
      const activeWeekEnd = React.useMemo(
        () => addDays(activeWeekStart, 6),
        [activeWeekStart]
      );
      const activeDate = React.useMemo(
        () => parseISO(selectedDate),
        [selectedDate]
      );
      const activeDayIndex = React.useMemo(
        () =>
          Math.min(
            Math.max(
              differenceInCalendarDays(activeDate, activeWeekStart),
              0
            ),
            6
          ),
        [activeDate, activeWeekStart]
      );

      const setSelectedDate = React.useCallback((date: string) => {
        setSelectedDateState(date);
      }, []);

      const setWeekOffset = React.useCallback(
        (value: number | ((offset: number) => number)) => {
          setWeekOffsetState((currentOffset) => {
            const requestedOffset =
              typeof value === 'function' ? value(currentOffset) : value;
            const nextOffset = Math.min(requestedOffset, 0);
            if (nextOffset === currentOffset) {
              return currentOffset;
            }

            const baseCurrent = startOfWeek(new Date(), WEEK_OPTIONS);
            const currentDate = parseISO(selectedDate);
            const dayDiff = Math.min(
              Math.max(
                differenceInCalendarDays(
                  currentDate,
                  addDays(baseCurrent, currentOffset * 7)
                ),
                0
              ),
              6
            );
            const nextBase = addDays(baseCurrent, nextOffset * 7);
            const nextDate = addDays(nextBase, dayDiff);
            setSelectedDateState(format(nextDate, 'yyyy-MM-dd'));
            return nextOffset;
          });
        },
        [selectedDate]
      );

      const goToToday = React.useCallback(() => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        setSelectedDateState(todayKey);
        setWeekOffsetState(0);
      }, []);

      return {
        selectedDate,
        setSelectedDate,
        activeDate,
        activeWeekStart,
        activeWeekEnd,
        activeDayIndex,
        weekOffset,
        setWeekOffset,
        isCurrentWeek: weekOffset === 0,
        goToToday,
      };
    },
    WeekProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const dayData = new Map<string, Record<string, unknown>>();

declare global {
  var __weeklyDayData: Map<string, Record<string, unknown>>;
}

globalThis.__weeklyDayData = dayData;

const firestoreMocks = vi.hoisted(() => {
  const doc = vi.fn((_: unknown, ...segments: string[]) => ({
    path: segments.join('/'),
    id: segments[segments.length - 1],
    segments,
  }));

  const getDoc = vi.fn(async (ref: { segments: string[] }) => {
    const { segments } = ref;
    if (segments[0] === 'users' && segments.length === 2) {
      return { exists: () => true, data: () => storeState.user };
    }
    if (segments[0] === 'users' && segments[2] === 'checkins') {
      const entry = storeState.checkIns[segments[3]];
      return { exists: () => Boolean(entry), data: () => entry };
    }
    if (segments[0] === 'users' && segments[2] === 'trainingLoad') {
      const entry = storeState.trainingLoad[segments[3]];
      return { exists: () => Boolean(entry), data: () => entry };
    }
    if (segments[0] === 'tracking' && segments[2] === 'days') {
      const entry = dayData.get(segments[3]);
      return { exists: () => Boolean(entry), data: () => entry };
    }
    return { exists: () => false, data: () => ({}) };
  });

  const setDoc = vi.fn(async (ref: { path: string; segments: string[] }, data: Record<string, unknown>) => {
    const { segments } = ref;
    if (segments[0] === 'users' && segments[2] === 'checkins') {
      storeState.checkIns[segments[3]] = data as unknown as DailyCheckIn;
    }
    if (segments[0] === 'users' && segments[2] === 'trainingLoad') {
      storeState.trainingLoad[segments[3]] = data as unknown as DailyTrainingLoad;
    }
    if (segments[0] === 'tracking' && segments[2] === 'days') {
      dayData.set(segments[3], { ...(dayData.get(segments[3]) ?? {}), ...data });
    }
  });

  const getDocs = vi.fn(async () => ({
    forEach: (callback: (snapshot: { id: string; data: () => Record<string, unknown> }) => void) => {
      for (const [key, value] of dayData.entries()) {
        callback({ id: key, data: () => value });
      }
    },
  }));

  const collection = vi.fn();
  const query = vi.fn();
  const where = vi.fn();
  const orderBy = vi.fn();
  const serverTimestamp = vi.fn(() => new Date());
  const Timestamp = { now: () => ({ toDate: () => new Date() }) };

  return { doc, getDoc, setDoc, getDocs, collection, query, where, orderBy, serverTimestamp, Timestamp };
});

vi.mock('firebase/firestore', () => firestoreMocks);

const checkinServiceMock = vi.hoisted(() => ({
  saveDailyCheckInAndRecalc: vi.fn(async (dateKey: string) => {
    const dataMap = globalThis.__weeklyDayData as Map<string, Record<string, unknown>>;
    const current = dataMap.get(dateKey) ?? { date: dateKey };
    dataMap.set(dateKey, {
      ...current,
      dayProgressPct: 88,
      dayStreakMet: true,
      tasksCompleted: 3,
      tasksTotal: 3,
    });
  }),
}));

vi.mock('../../../services/checkin', () => checkinServiceMock);

const { saveDailyCheckInAndRecalc } = checkinServiceMock;

function seedDayData(reference: Date): void {
  dayData.clear();
  const base = startOfWeek(reference, { weekStartsOn: 1 });
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(base, index);
    const key = format(date, 'yyyy-MM-dd');
    dayData.set(key, {
      date: key,
      dayProgressPct: 0,
      dayStreakMet: false,
      tasksCompleted: 0,
      tasksTotal: 3,
    });
  }
  const streakKey = format(base, 'yyyy-MM-dd');
  dayData.set(streakKey, {
    date: streakKey,
    dayProgressPct: 67,
    dayStreakMet: true,
    tasksCompleted: 2,
    tasksTotal: 3,
  });
  const nonStreakKey = format(addDays(base, 1), 'yyyy-MM-dd');
  dayData.set(nonStreakKey, {
    date: nonStreakKey,
    dayProgressPct: 49,
    dayStreakMet: false,
    tasksCompleted: 1,
    tasksTotal: 3,
  });

  const previousBase = addDays(base, -7);
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(previousBase, index);
    const key = format(date, 'yyyy-MM-dd');
    dayData.set(key, {
      date: key,
      dayProgressPct: 12,
      dayStreakMet: false,
      tasksCompleted: 0,
      tasksTotal: 3,
    });
  }
}

function resetTestState(): void {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  storeState.user = createMockUser();
  storeState.selectedDate = todayKey;
  storeState.trainingLoad = {
    [todayKey]: { load: 240 } as unknown as DailyTrainingLoad,
  };
  storeState.checkIns = {};
  seedDayData(today);
  saveDailyCheckInAndRecalc.mockClear();
  firestoreMocks.doc.mockClear();
  firestoreMocks.getDoc.mockClear();
  firestoreMocks.setDoc.mockClear();
  firestoreMocks.getDocs.mockClear();
}

function renderWeeklyTile() {
  render(<WeeklyTile />);
}

describe('WeeklyTile', () => {
  beforeEach(() => {
    resetTestState();
  });

  it('renders a single weekly tile without legacy widgets', async () => {
    renderWeeklyTile();

    expect(await screen.findByTestId('weekly-tile')).toBeInTheDocument();
    expect(screen.queryByTestId('header-summary-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('week-compact-card')).not.toBeInTheDocument();
  });

  it('shows flame icon for days meeting streak threshold and hides it otherwise', async () => {
    renderWeeklyTile();

    const streakDayButton = await screen.findByRole('button', { name: /67%/ });
    expect(within(streakDayButton).getByText('🔥')).toBeInTheDocument();

    const nonStreakButton = screen.getByRole('button', { name: /49%/ });
    expect(within(nonStreakButton).queryByText('🔥')).not.toBeInTheDocument();
  });

  it('navigates between weeks and loads new data sets', async () => {
    renderWeeklyTile();

    expect(await screen.findByText(/67%/)).toBeInTheDocument();

    const previousButton = screen.getByRole('button', {
      name: translations['dashboard.previousWeek'],
    });
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getAllByText(/12%/).length).toBeGreaterThan(0);
    });
  });

  it('revalidates week data after a successful check-in submission', async () => {
    renderWeeklyTile();

    const button = await screen.findByRole('button', {
      name: translations['dashboard.trainingLoadCheckIn'],
    });
    fireEvent.click(button);

    const saveButton = await screen.findByRole('button', {
      name: translations['common.save'],
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDailyCheckInAndRecalc).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /88%/ })).toBeInTheDocument();
    });
  });

  it('falls back to computed summary when tracking metrics are missing', async () => {
    const reference = new Date();
    const base = startOfWeek(reference, { weekStartsOn: 1 });
    const fallbackDate = addDays(base, 2);
    const fallbackKey = format(fallbackDate, 'yyyy-MM-dd');
    dayData.set(fallbackKey, { date: fallbackKey });

    renderWeeklyTile();

    const weekdayLabel = format(fallbackDate, 'EEEE', { locale: de });
    const fallbackButton = await screen.findByRole('button', {
      name: new RegExp(`${weekdayLabel}.*0%`, 'i'),
    });

    expect(fallbackButton).toBeInTheDocument();
  });

  it('shows high training load summary when exceeding threshold', async () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    storeState.trainingLoad[todayKey] = { load: 720 } as unknown as DailyTrainingLoad;

    renderWeeklyTile();

    expect(await screen.findByText(/Trainingslast: 720 \| Hoch/)).toBeInTheDocument();
  });

  it('renders without user context by skipping Firestore calls', async () => {
    storeState.user = null;

    renderWeeklyTile();

    await waitFor(() => {
      expect(firestoreMocks.getDoc).not.toHaveBeenCalled();
    });

    expect(screen.queryAllByRole('button', { name: /%/ })).toHaveLength(0);
  });

  it('exposes accessible labels for navigation controls and day circles', async () => {
    renderWeeklyTile();

    const previous = await screen.findByRole('button', {
      name: translations['dashboard.previousWeek'],
    });
    const next = screen.getByRole('button', {
      name: translations['dashboard.nextWeek'],
    });

    expect(previous).toBeInTheDocument();
    expect(next).toBeInTheDocument();

    // Wait for day data to load before checking day buttons
    await waitFor(() => {
      const dayButtons = screen.getAllByRole('button', { name: /%/ });
      expect(dayButtons.length).toBe(7);
    });

    const dayButtons = screen.getAllByRole('button', { name: /%/ });
    for (const button of dayButtons) {
      expect(button.getAttribute('aria-label')).toMatch(/%/);
    }
  });
});
