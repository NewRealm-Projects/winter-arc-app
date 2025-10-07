import { describe, expect, it } from 'vitest';
import { parseHeuristic } from '../lib/parsers';

describe('parseHeuristic', () => {
  it('parses drink quantities with decimal comma', () => {
    const { candidates } = parseHeuristic('0,5 l Wasser getrunken');
    const drink = candidates.find((event) => event.kind === 'drink');
    expect(drink).toBeDefined();
    expect(drink?.volumeMl).toBe(500);
  });

  it('parses pushups in German', () => {
    const { candidates } = parseHeuristic('20 Liegestütze fertig');
    const pushups = candidates.find((event) => event.kind === 'pushups');
    expect(pushups).toBeDefined();
    expect(pushups?.count).toBe(20);
  });

  it('guesses protein shake when no grams provided', () => {
    const { candidates } = parseHeuristic('Proteinshake nach dem Workout');
    const protein = candidates.find((event) => event.kind === 'protein');
    expect(protein).toBeDefined();
    expect(protein?.grams).toBe(25);
    expect(protein?.confidence).toBeLessThan(0.6);
  });
});

