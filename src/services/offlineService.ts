/**
 * Offline Service
 *
 * Manages offline functionality and sync queue for the PWA
 */

import { addBreadcrumb } from './sentryService';

interface OfflineAction {
  id: string;
  type: 'tracking' | 'checkin' | 'note';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

class OfflineService {
  private syncQueue: OfflineAction[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private readonly MAX_RETRIES = 3;
  private readonly STORAGE_KEY = 'winter-arc-offline-queue';

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      addBreadcrumb('Network: Online', {}, 'info');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      addBreadcrumb('Network: Offline', {}, 'warning');
    });

    // Listen for visibility change to sync when app becomes active
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  /**
   * Register service worker and background sync
   */
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Register background sync
        if ('sync' in registration) {
          await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('winter-arc-sync');
          addBreadcrumb('Background sync registered', {}, 'info');
        }
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  }

  /**
   * Load sync queue from localStorage
   */
  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        addBreadcrumb('Offline queue loaded', { count: this.syncQueue.length }, 'info');
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save sync queue to localStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add action to offline queue
   */
  public queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) {
    const queueItem: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(queueItem);
    this.saveQueue();

    addBreadcrumb('Action queued for sync', {
      type: action.type,
      action: action.action,
    }, 'info');

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return queueItem.id;
  }

  /**
   * Process the sync queue
   */
  public async processSyncQueue() {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const queue = [...this.syncQueue];

    for (const action of queue) {
      try {
        await this.processAction(action);

        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
        this.saveQueue();

        addBreadcrumb('Action synced', {
          type: action.type,
          action: action.action,
        }, 'info');
      } catch (error) {
        console.error('Failed to sync action:', error);

        // Increment retry count
        action.retries++;

        if (action.retries >= this.MAX_RETRIES) {
          // Remove from queue after max retries
          this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
          addBreadcrumb('Action removed after max retries', {
            type: action.type,
            action: action.action,
            retries: action.retries,
          }, 'error');
        }

        this.saveQueue();
      }
    }

    this.syncInProgress = false;
  }

  /**
   * Process individual action
   */
  private async processAction(action: OfflineAction): Promise<void> {
    // This would call the actual Firebase services
    // Implementation depends on the specific action type

    switch (action.type) {
      case 'tracking':
        // await syncTrackingData(action.data);
        break;
      case 'checkin':
        // await syncCheckInData(action.data);
        break;
      case 'note':
        // await syncNoteData(action.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get current queue status
   */
  public getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      oldestAction: this.syncQueue[0]?.timestamp,
    };
  }

  /**
   * Clear the sync queue
   */
  public clearQueue() {
    this.syncQueue = [];
    this.saveQueue();
    addBreadcrumb('Offline queue cleared', {}, 'info');
  }

  /**
   * Check if service worker is supported
   */
  public static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Request persistent storage
   */
  public static async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        if (granted) {
          addBreadcrumb('Persistent storage granted', {}, 'info');
        }
        return granted;
      } catch (error) {
        console.error('Failed to request persistent storage:', error);
        return false;
      }
    }
    return false;
  }
}

// Singleton instance
export const offlineService = new OfflineService();

// Export utility functions
export const queueOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) =>
  offlineService.queueAction(action);

export const getOfflineStatus = () => offlineService.getQueueStatus();

export const syncOfflineQueue = () => offlineService.processSyncQueue();

export const clearOfflineQueue = () => offlineService.clearQueue();