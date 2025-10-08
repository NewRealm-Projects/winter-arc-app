import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveDailyCheckInAndRecalc } from '../checkin';

const firestoreMocks = vi.hoisted(() => {
  const setDoc = vi.fn();
  const getDoc = vi.fn();
  const serverTimestamp = vi.fn(() => 'ts');
  const doc = vi.fn((_: unknown, ...segments: string[]) => segments.join('/'));
  return { setDoc, getDoc, serverTimestamp, doc };
});

const { setDoc, getDoc, serverTimestamp, doc } = firestoreMocks;

vi.mock('firebase/firestore', () => ({
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  setDoc: firestoreMocks.setDoc,
  serverTimestamp: firestoreMocks.serverTimestamp,
}));

vi.mock('../../firebase/config', () => ({
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
    serverTimestamp.mockClear();
    doc.mockClear();
  });

  it('writes check-in and training load documents', async () => {
    getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce(trackingSnapshot);

    await saveDailyCheckInAndRecalc('2024-01-05', {
      sleepScore: 6,
      recoveryScore: 7,
      sick: false,
    });

    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-1', 'checkins', '2024-01-05');
    expect(doc).toHaveBeenCalledWith({}, 'users', 'user-1', 'trainingLoad', '2024-01-05');

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
  });
});
