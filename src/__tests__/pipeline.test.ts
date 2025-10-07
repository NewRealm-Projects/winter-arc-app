import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SmartNote } from '../types/events';

const storeState = vi.hoisted(() => ({
  notes: new Map<string, SmartNote>(),
}));

const noteStoreMock = vi.hoisted(() => ({
  async add(note: SmartNote) {
    storeState.notes.set(note.id, note);
  },
  async update(id: string, patch: Partial<SmartNote>) {
    const existing = storeState.notes.get(id);
    if (!existing) return;
    storeState.notes.set(id, { ...existing, ...patch });
  },
  async getRecent(limit: number) {
    return Array.from(storeState.notes.values())
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
  },
  async get(id: string) {
    return storeState.notes.get(id);
  },
}));

const geminiExports = vi.hoisted(() => {
  class GeminiUnavailableError extends Error {}
  class GeminiTimeoutError extends Error {}
  return {
    summarizeAndValidate: vi.fn(),
    GeminiUnavailableError,
    GeminiTimeoutError,
  };
});

vi.mock('../store/noteStore', () => ({ noteStore: noteStoreMock }));
vi.mock('../services/gemini', () => geminiExports);

import { mergeEvents, processSmartNote } from '../features/notes/pipeline';
import { Event, ProteinEvent } from '../types/events';

const { summarizeAndValidate, GeminiUnavailableError } = geminiExports;

beforeEach(() => {
  storeState.notes.clear();
  summarizeAndValidate.mockReset();
});

describe('mergeEvents', () => {
  const baseTs = Date.now();

  const heuristicDrink: Event = {
    id: 'h1',
    ts: baseTs,
    kind: 'drink',
    confidence: 0.6,
    source: 'heuristic',
    volumeMl: 500,
    beverage: 'water',
  };

  const llmDrink: Event = {
    id: 'l1',
    ts: baseTs,
    kind: 'drink',
    confidence: 0.9,
    source: 'llm',
    volumeMl: 500,
    beverage: 'water',
  };

  const heuristicProtein: Event = {
    id: 'h2',
    ts: baseTs,
    kind: 'protein',
    confidence: 0.6,
    source: 'heuristic',
    grams: 25,
  };

  const llmProtein: Event = {
    id: 'l2',
    ts: baseTs,
    kind: 'protein',
    confidence: 0.4,
    source: 'llm',
    grams: 20,
  };

  it('keeps higher confidence event when duplicate', () => {
    const merged = mergeEvents([heuristicDrink], [llmDrink]);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('l1');
    expect(merged[0].source).toBe('llm');
  });

  it('keeps heuristic value when LLM is less confident', () => {
    const merged = mergeEvents([heuristicProtein], [llmProtein]);
    expect(merged).toHaveLength(1);
    const protein = merged[0] as ProteinEvent;
    expect(protein.grams).toBe(25);
    expect(protein.source).toBe('heuristic');
  });
});

describe('processSmartNote fallback', () => {
  it('marks note as unavailable when Gemini cannot be reached', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    summarizeAndValidate.mockRejectedValue(new GeminiUnavailableError());
    const { noteId } = await processSmartNote('500 ml Wasser', { autoTracking: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const stored = storeState.notes.get(noteId);
    expect(stored?.llmStatus).toBe('unavailable');
    expect(stored?.pending).toBe(false);
    expect(stored?.summary.length).toBeGreaterThan(0);
    errorSpy.mockRestore();
  });
});

