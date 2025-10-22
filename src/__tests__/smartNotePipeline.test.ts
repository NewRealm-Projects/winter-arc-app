import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSmartNote } from '../features/notes/pipeline';
import { SmartNote } from '../types/events';

type Mocks = {
  parseHeuristic: ReturnType<typeof vi.fn>;
  summarizeAndValidate: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  getRecent: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted((): Mocks => ({
  parseHeuristic: vi.fn(),
  summarizeAndValidate: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  getRecent: vi.fn(),
}));

vi.mock('../lib/parsers', () => ({
  parseHeuristic: mocks.parseHeuristic,
}));

vi.mock('../services/gemini', () => ({
  summarizeAndValidate: mocks.summarizeAndValidate,
}));

vi.mock('../store/noteStore', () => ({
  noteStore: {
    get: mocks.get,
    update: mocks.update,
    getRecent: mocks.getRecent,
  },
}));

describe('updateSmartNote', () => {
  beforeEach(() => {
    mocks.parseHeuristic.mockReset();
    mocks.summarizeAndValidate.mockReset();
    mocks.get.mockReset();
    mocks.update.mockReset();
    mocks.getRecent.mockReset();
  });

  it('updates manual notes without triggering auto tracking', async () => {
    const manual: SmartNote = {
      id: 'manual',
      ts: Date.now(),
      raw: 'Manual note',
      summary: 'Manual note',
      events: [],
    };

    mocks.get.mockResolvedValue(manual);

    await updateSmartNote(manual.id, '  Neue Notiz  ');

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(manual.id, {
      raw: 'Neue Notiz',
      summary: 'Neue Notiz',
      events: [],
      pending: undefined,
    });
    expect(mocks.parseHeuristic).not.toHaveBeenCalled();
    expect(mocks.summarizeAndValidate).not.toHaveBeenCalled();
  });

  it('reprocesses smart notes with heuristic events only', async () => {
    const smart: SmartNote = {
      id: 'smart',
      ts: Date.now() - 5000,
      raw: 'Old raw text',
      summary: 'Processed summary',
      events: [
        {
          id: 'event-1',
          ts: Date.now() - 5000,
          kind: 'drink',
          volumeMl: 200,
          beverage: 'water',
          confidence: 0.6,
          source: 'heuristic',
        },
      ],
    };

    const heuristicEvent = {
      id: 'candidate-1',
      ts: smart.ts,
      kind: 'drink' as const,
      volumeMl: 250,
      beverage: 'water' as const,
      confidence: 0.7,
      source: 'heuristic' as const,
    };

    mocks.get.mockResolvedValue(smart);
    mocks.parseHeuristic.mockReturnValue({ candidates: [heuristicEvent] });

    await updateSmartNote(smart.id, 'Aktueller Rohtext');

    expect(mocks.update).toHaveBeenCalledTimes(1);

    const patch = mocks.update.mock.calls[0][1];
    expect(patch).toMatchObject({
      raw: 'Aktueller Rohtext',
      summary: 'Aktueller Rohtext',
      pending: false,
    });
    expect(patch.events).toHaveLength(1);
    expect(patch.events?.[0]).toMatchObject({
      kind: 'drink',
      beverage: 'water',
      volumeMl: 250,
      source: 'heuristic',
      ts: smart.ts,
    });

    expect(mocks.summarizeAndValidate).not.toHaveBeenCalled();
  });
});
