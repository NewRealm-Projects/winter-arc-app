import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveDailyCheckInAndRecalc } from '../checkin';

const firestoreMocks = vi.hoisted(() => {
  const setDoc = vi.fn();
  const getDoc = vi.fn();
  const getDocs = vi.fn();
  const collection = vi.fn();
  const query = vi.fn();
  const where = vi.fn();
  const orderBy = vi.fn();
  const serverTimestamp = vi.fn(() => 'ts');
  const doc = vi.fn((_: unknown, ...segments: string[]) => segments.join('/'));
  return { setDoc, getDoc, getDocs, collection, query, where, orderBy, serverTimestamp, doc };
});

const { setDoc, getDoc, getDocs, collection, query, where, orderBy, serverTimestamp, doc } = firestoreMocks;

vi.mock('firebase/firestore', () => ({
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  setDoc: firestoreMocks.setDoc,
  getDocs: firestoreMocks.getDocs,
  collection: firestoreMocks.collection,
  query: firestoreMocks.query,
  where: firestoreMocks.where,
  orderBy: firestoreMocks.orderBy,
  serverTimestamp: firestoreMocks.serverTimestamp,
}));

vi.mock('../../firebase', () => ({
  auth: {
    currentUser: { uid: 'user-1' },
  },
  db: {},
}));

const trackingSnapshot = {
  exists: () => true,
  data: () => ({
    sports: {
      hiit: { active: true, duration: 30, intensity: 7 },
    },
    pushups: { total: 30 },
  }),
};

describe('saveDailyCheckInAndRecalc', () => {
  beforeEach(() => {
    setDoc.mockReset();
    getDoc.mockReset();
    getDocs.mockReset();
    collection.mockReset();
    query.mockReset();
    where.mockReset();
    orderBy.mockReset();
    serverTimestamp.mockClear();
    doc.mockClear();
  });

  it('writes check-in and training load documents', async () => {
    const weekDocuments = new Map<string, Record<string, unknown>>();
    getDocs.mockResolvedValue({
      forEach: (callback: (snapshot: { id: string; data: () => Record<string, unknown> }) => void) => {
        weekDocuments.forEach((value, key) => {
          callback({ id: key, data: () => value });
        });
      },
    });
    setDoc.mockImplementation((path: string, data: Record<string, unknown>) => {
      if (path.startsWith('tracking/user-1/days/')) {
        const key = path.split('/').pop() ?? '';
        const current = weekDocuments.get(key) ?? {};
        weekDocuments.set(key, { ...current, ...data });
      }
      return Promise.resolve();
    });

    const userSnapshot = {
      exists: () => true,
      data: () => ({
        enabledActivities: ['water', 'protein', 'sports', 'pushups'],
        weight: 80,
        hydrationGoalLiters: 2.5,
        proteinGoalGrams: 150,
      }),
    };

    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce(trackingSnapshot)
      .mockResolvedValueOnce(userSnapshot);

    await saveDailyCheckInAndRecalc('2024-01-05', {
      sleepScore: 6,
      recoveryScore: 7,
      sick: false,
    });

    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-1', 'checkins', '2024-01-05');
    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-1', 'trainingLoad', '2024-01-05');
    expect(doc).toHaveBeenCalledWith({}, 'tracking', 'user-1', 'days', '2024-01-05');
    expect(doc).toHaveBeenCalledWith({}, 'tracking', 'user-1', 'weeks', '2024-W01');

    expect(setDoc).toHaveBeenNthCalledWith(
      1,
      'users/user-1/checkins/2024-01-05',
      expect.objectContaining({
        date: '2024-01-05',
        sleepScore: 6,
        recoveryScore: 7,
        sick: false,
        source: 'manual',
      }),
      { merge: true }
    );

    const secondCallPayload = setDoc.mock.calls[1][1];
    expect(setDoc).toHaveBeenNthCalledWith(
      2,
      'users/user-1/trainingLoad/2024-01-05',
      expect.objectContaining({ calcVersion: 'v1', load: 37 }),
      { merge: true }
    );
    expect(secondCallPayload.components?.modifierSleep).toBeCloseTo(1.04, 5);
    expect(secondCallPayload.components?.modifierRecovery).toBeCloseTo(0.91, 5);
    expect(secondCallPayload.components?.modifierSick).toBe(1);
    expect(secondCallPayload.inputs).toEqual({ sleepScore: 6, recoveryScore: 7, sick: false });

    expect(setDoc).toHaveBeenNthCalledWith(
      3,
      'tracking/user-1/days/2024-01-05',
      expect.objectContaining({
        date: '2024-01-05',
        tasksCompleted: expect.any(Number),
        tasksTotal: expect.any(Number),
        dayProgressPct: expect.any(Number),
        dayStreakMet: expect.any(Boolean),
      }),
      { merge: true }
    );

    expect(setDoc).toHaveBeenNthCalledWith(
      4,
      'tracking/user-1/weeks/2024-W01',
      expect.objectContaining({
        streakDays: expect.any(Number),
        totalPctAvg: expect.any(Number),
      }),
      { merge: true }
    );

    expect(getDocs).toHaveBeenCalledTimes(1);
  });
});
