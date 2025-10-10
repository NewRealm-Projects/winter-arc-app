import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkMigrationStatus,
  migrateDaysToEntries,
  forceMigration,
} from '../migration';
import { doc, getDoc, getDocs, setDoc, writeBatch, collection } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  writeBatch: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('../sentryService', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

describe('Migration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkMigrationStatus', () => {
    it('should return migrated status for existing user', async () => {
      const mockUserData = {
        migrated: true,
        migratedAt: '2025-01-01T00:00:00Z',
        migratedCount: 100,
        migrationVersion: 'v1',
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const status = await checkMigrationStatus('user123');

      expect(status).toEqual({
        migrated: true,
        migratedAt: '2025-01-01T00:00:00Z',
        migratedCount: 100,
        version: 'v1',
      });
    });

    it('should return not migrated for non-existing user', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const status = await checkMigrationStatus('user123');

      expect(status).toEqual({ migrated: false });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('Firestore error'));

      const status = await checkMigrationStatus('user123');

      expect(status).toEqual({ migrated: false });
    });
  });

  describe('migrateDaysToEntries', () => {
    it('should skip migration if already migrated', async () => {
      // User already migrated
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          migrated: true,
          migratedAt: '2025-01-01T00:00:00Z',
          migratedCount: 50,
        }),
      } as any);

      const result = await migrateDaysToEntries('user123');

      expect(result).toEqual({
        success: true,
        count: 50,
      });

      expect(vi.mocked(getDocs)).not.toHaveBeenCalled();
    });

    it('should migrate data from days to entries collection', async () => {
      // User not migrated
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ migrated: false }),
      } as any);

      // Mock days collection data
      const mockDaysData = [
        { id: '2025-01-01', data: () => ({ pushups: 100, water: 2000 }) },
        { id: '2025-01-02', data: () => ({ pushups: 120, water: 2500 }) },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        forEach: (callback: any) => {
          mockDaysData.forEach(callback);
        },
      } as any);

      // Mock batch operations
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValueOnce(undefined),
      };
      vi.mocked(writeBatch).mockReturnValueOnce(mockBatch as any);

      const result = await migrateDaysToEntries('user123');

      expect(result).toEqual({
        success: true,
        count: 2,
      });

      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(vi.mocked(setDoc)).toHaveBeenCalledTimes(1);
    });

    it('should handle empty days collection', async () => {
      // User not migrated
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ migrated: false }),
      } as any);

      // Empty days collection
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
      } as any);

      const result = await migrateDaysToEntries('user123');

      expect(result).toEqual({
        success: true,
        count: 0,
      });

      expect(vi.mocked(setDoc)).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          migrated: true,
          migratedCount: 0,
          migrationVersion: 'v1',
        }),
        { merge: true }
      );
    });

    it('should handle migration errors', async () => {
      // User not migrated
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ migrated: false }),
      } as any);

      // Simulate error during getDocs
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Firestore error'));

      const result = await migrateDaysToEntries('user123');

      expect(result).toEqual({
        success: false,
        error: 'Firestore error',
      });
    });
  });

  describe('forceMigration', () => {
    it('should reset migration flag and re-run migration', async () => {
      // First setDoc to reset flag
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      // Then successful migration
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ migrated: false }),
      } as any);

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
      } as any);

      // Second setDoc for marking as migrated
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const result = await forceMigration('user123');

      expect(result).toEqual({
        success: true,
        count: 0,
      });

      expect(vi.mocked(setDoc)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(setDoc)).toHaveBeenNthCalledWith(
        1,
        undefined,
        expect.objectContaining({
          migrated: false,
          migratedAt: null,
          migratedCount: null,
          migrationVersion: null,
        }),
        { merge: true }
      );
    });

    it('should handle errors during force migration', async () => {
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('Reset failed'));

      const result = await forceMigration('user123');

      expect(result).toEqual({
        success: false,
        error: 'Reset failed',
      });
    });
  });
});