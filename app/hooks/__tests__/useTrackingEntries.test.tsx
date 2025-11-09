import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTrackingEntries } from '../useTrackingEntries';
import { useStore } from '@/store/useStore';
import type { User } from '@/types';

const unsubscribeMock = vi.fn();

const snapshotMock = vi.hoisted(() => {
  const onUserTrackingEntriesSnapshot = vi.fn(
    (_userId: string, _onNext: unknown, _onError?: unknown) => unsubscribeMock
  );
  return { onUserTrackingEntriesSnapshot };
});

// Mock removed Firestore service
vi.mock('@/services/firestoreClient', () => snapshotMock);

const createTestUser = (): User => ({
  id: 'user-1',
  language: 'de',
  nickname: 'Test',
  gender: 'male',
  height: 180,
  weight: 80,
  maxPushups: 20,
  groupCode: 'grp',
  pushupState: { baseReps: 10, sets: 5, restTime: 90 },
  createdAt: new Date(),
});

describe('useTrackingEntries', () => {
  beforeEach(() => {
    snapshotMock.onUserTrackingEntriesSnapshot.mockReset();
    unsubscribeMock.mockReset();
    useStore.setState({ authLoading: true, user: null, tracking: {} });
  });

  it('does not subscribe before authentication resolves', () => {
    renderHook(() => useTrackingEntries());

    expect(snapshotMock.onUserTrackingEntriesSnapshot).not.toHaveBeenCalled();

    act(() => {
      useStore.setState({ authLoading: false });
    });

    expect(snapshotMock.onUserTrackingEntriesSnapshot).not.toHaveBeenCalled();

    act(() => {
      useStore.setState({ user: createTestUser() });
    });

    expect(snapshotMock.onUserTrackingEntriesSnapshot).toHaveBeenCalledTimes(1);
    expect(snapshotMock.onUserTrackingEntriesSnapshot).toHaveBeenCalledWith(
      'user-1',
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('maps permission-denied errors to hook state and clears tracking', () => {
    const { result } = renderHook(() => useTrackingEntries());

    let errorHandler: ((error: { code: string; message: string; name: string }) => void) | undefined;
    snapshotMock.onUserTrackingEntriesSnapshot.mockImplementationOnce((_, __, onError) => {
      errorHandler = onError as (error: { code: string; message: string; name: string }) => void;
      return unsubscribeMock;
    });

    act(() => {
      useStore.setState({ authLoading: false, user: createTestUser() });
    });

    expect(errorHandler).toBeDefined();

    act(() => {
      errorHandler?.({
        code: 'permission-denied',
        message: 'forbidden',
        name: 'FirebaseError',
      });
    });

    expect(result.current.error).toBe('no-permission');
    expect(useStore.getState().tracking).toEqual({});
  });
});
