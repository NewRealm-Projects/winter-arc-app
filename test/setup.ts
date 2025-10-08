import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

if (!('ResizeObserver' in window)) {
  class ResizeObserver {
    observe() {
      return null;
    }
    unobserve() {
      return null;
    }
    disconnect() {
      return null;
    }
  }
  // @ts-expect-error jsdom globals
  window.ResizeObserver = ResizeObserver;
}

if (!('crypto' in globalThis) || !globalThis.crypto?.randomUUID) {
  const existing = (globalThis.crypto ?? {}) as Crypto;
  globalThis.crypto = {
    ...existing,
    randomUUID: existing.randomUUID ?? (() => Math.random().toString(36).slice(2, 10)),
  } as Crypto;
}

vi.mock('@/firebase/config', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
  googleProvider: { setCustomParameters: vi.fn() },
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(async () => undefined),
  signInWithPopup: vi.fn(async () => ({ user: { uid: 'uid', email: 'user@example.com' } })),
  signInWithRedirect: vi.fn(async () => undefined),
  getRedirectResult: vi.fn(async () => null),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: class {},
  getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  collection: vi.fn(),
  getDocs: vi.fn(async () => ({ forEach: () => undefined })),
  setDoc: vi.fn(async () => undefined),
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(async () => ({
        response: {
          text: () => 'Mocked AI response',
        },
      })),
    })),
  })),
  SchemaType: {
    OBJECT: 'object',
    STRING: 'string',
    NUMBER: 'number',
  },
}));
