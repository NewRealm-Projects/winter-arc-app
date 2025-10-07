import { describe, expect, it } from 'vitest';
import { mergeEvents } from '../features/notes/pipeline';
import { Event, ProteinEvent } from '../types/events';

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

