import { parseHeuristic } from '../../lib/parsers';
import {
  summarizeAndValidate,
  GeminiUnavailableError,
  GeminiTimeoutError,
} from '../../services/gemini';
import { noteStore } from '../../store/noteStore';
import { Event, SmartNote } from '../../types/events';

const RECENT_LIMIT = 5;

function createEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEvent(event: Event, noteTs: number, source: Event['source']): Event {
  return {
    ...event,
    id: event.id ?? createEventId(),
    ts: noteTs,
    source,
    confidence: typeof event.confidence === 'number' ? event.confidence : 0.5,
  } as Event;
}

function fingerprint(event: Event): string {
  switch (event.kind) {
    case 'drink':
      return `${event.kind}:${event.beverage}:${Math.round(event.volumeMl)}`;
    case 'protein':
      return `${event.kind}:${Math.round(event.grams)}`;
    case 'pushups':
      return `${event.kind}:${event.count}`;
    case 'workout':
      return `${event.kind}:${event.sport}:${event.durationMin ?? 'na'}:${event.intensity ?? 'na'}`;
    case 'rest':
      return `${event.kind}:${event.reason ?? ''}`;
    case 'weight':
      return `${event.kind}:${event.kg}`;
    case 'bfp':
      return `${event.kind}:${event.percent}`;
    case 'food':
      return `${event.kind}:${event.label}`;
  }
  throw new Error('Unsupported event kind');
}

function isSimilarEvent(a: Event, b: Event): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'drink':
      if (b.kind !== 'drink') return false;
      return a.beverage === b.beverage && Math.abs(a.volumeMl - b.volumeMl) <= 60;
    case 'protein':
      if (b.kind !== 'protein') return false;
      return Math.abs(a.grams - b.grams) <= 6;
    case 'pushups':
      if (b.kind !== 'pushups') return false;
      return Math.abs(a.count - b.count) <= 2;
    case 'workout':
      if (b.kind !== 'workout') return false;
      return (
        a.sport === b.sport &&
        (a.durationMin === undefined || b.durationMin === undefined || Math.abs((a.durationMin ?? 0) - (b.durationMin ?? 0)) <= 10) &&
        (a.intensity === b.intensity || !a.intensity || !b.intensity)
      );
    case 'rest':
      if (b.kind !== 'rest') return false;
      return true;
    case 'weight':
      if (b.kind !== 'weight') return false;
      return Math.abs(a.kg - b.kg) <= 0.2;
    case 'bfp':
      if (b.kind !== 'bfp') return false;
      return Math.abs(a.percent - b.percent) <= 0.3;
    case 'food':
      if (b.kind !== 'food') return false;
      return a.label === b.label;
  }
  return false;
}

function resolveKey(store: Map<string, Event>, event: Event): string {
  const exactKey = fingerprint(event);
  if (store.has(exactKey)) {
    return exactKey;
  }
  for (const [key, existing] of store.entries()) {
    if (isSimilarEvent(existing, event)) {
      return key;
    }
  }
  return exactKey;
}

export function mergeEvents(candidates: Event[], llmEvents: Event[]): Event[] {
  const merged = new Map<string, Event>();

  for (const candidate of candidates) {
    merged.set(fingerprint(candidate), candidate);
  }

  for (const event of llmEvents) {
    const key = resolveKey(merged, event);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, event);
      continue;
    }
    if ((event.confidence ?? 0) >= (existing.confidence ?? 0)) {
      merged.set(key, event);
    }
  }

  return Array.from(merged.values());
}

function createOptimisticSummary(raw: string) {
  if (raw.length < 120) {
    return raw;
  }
  return `${raw.slice(0, 117)}...`;
}

function detectLanguage(raw: string): 'de' | 'en' {
  const sample = raw.toLowerCase();
  const germanSignals = /wasser|gramm|ausruhen|pause|resttag|liegestütz|km|min\.|heute|kg|tee|laufen|training/;
  const englishSignals = /water|protein|push ?up|rest day|run|gym|workout|swim|today|lbs|weight|cardio|tea|coffee/;
  if (germanSignals.test(sample) && !englishSignals.test(sample)) {
    return 'de';
  }
  if (englishSignals.test(sample) && !germanSignals.test(sample)) {
    return 'en';
  }
  if (sample.includes('ß') || sample.includes('ä') || sample.includes('ö') || sample.includes('ü')) {
    return 'de';
  }
  return englishSignals.test(sample) ? 'en' : 'de';
}

function describeEvent(event: Event, lang: 'de' | 'en'): string | null {
  const joiner = '·';
  switch (event.kind) {
    case 'drink': {
      const beverage =
        event.beverage === 'water'
          ? lang === 'de'
            ? 'Wasser'
            : 'water'
          : event.beverage === 'protein'
            ? lang === 'de'
              ? 'Proteinshake'
              : 'protein shake'
            : event.beverage === 'coffee'
              ? lang === 'de'
                ? 'Kaffee'
                : 'coffee'
              : event.beverage === 'tea'
                ? lang === 'de'
                  ? 'Tee'
                  : 'tea'
                : lang === 'de'
                  ? 'Drink'
                  : 'drink';
      return `${event.volumeMl} ml ${beverage}`;
    }
    case 'protein':
      return lang === 'de' ? `${event.grams} g Protein` : `${event.grams} g protein`;
    case 'pushups':
      return lang === 'de' ? `${event.count} Liegestütze` : `${event.count} push-ups`;
    case 'workout': {
      const sport = (() => {
        switch (event.sport) {
          case 'hiit_hyrox':
            return lang === 'de' ? 'Hyrox/HIIT' : 'Hyrox/HIIT';
          case 'cardio':
            return lang === 'de' ? 'Cardio' : 'cardio';
          case 'gym':
            return lang === 'de' ? 'Gym' : 'gym';
          case 'swimming':
            return lang === 'de' ? 'Schwimmen' : 'swimming';
          case 'football':
            return lang === 'de' ? 'Fußball' : 'football';
          default:
            return event.sport;
        }
      })();
      const duration = event.durationMin ? `${joiner} ${event.durationMin} min` : '';
      const intensity = event.intensity
        ? `${joiner} ${
            event.intensity === 'easy'
              ? lang === 'de'
                ? 'locker'
                : 'easy'
              : event.intensity === 'moderate'
                ? lang === 'de'
                  ? 'moderat'
                  : 'moderate'
                : lang === 'de'
                  ? 'hart'
                  : 'hard'
          }`
        : '';
      return [sport, duration, intensity].filter(Boolean).join(' ');
    }
    case 'rest':
      return lang === 'de' ? 'Ruhetag' : 'rest day';
    case 'weight':
      return `${event.kg} kg`;
    case 'bfp':
      return lang === 'de' ? `${event.percent} % Körperfett` : `${event.percent} % body fat`;
    case 'food': {
      const details: string[] = [];
      if (typeof event.calories === 'number') {
        details.push(`${event.calories} kcal`);
      }
      if (typeof event.proteinG === 'number') {
        details.push(
          lang === 'de' ? `${event.proteinG} g Protein` : `${event.proteinG} g protein`
        );
      }
      const suffix = details.length ? ` (${details.join(', ')})` : '';
      return `${event.label}${suffix}`;
    }
    default:
      return null;
  }
}

function createHeuristicSummary(raw: string, events: Event[]): string {
  if (!events.length) {
    return createOptimisticSummary(raw);
  }
  const lang = detectLanguage(raw);
  const descriptions = events
    .map((event) => describeEvent(event, lang))
    .filter((value): value is string => Boolean(value));
  if (!descriptions.length) {
    return createOptimisticSummary(raw);
  }
  const prefix = lang === 'de' ? 'Notiert: ' : 'Logged: ';
  return `${prefix}${descriptions.join(', ')}.`;
}

async function settleWithHeuristic(
  noteId: string,
  raw: string,
  events: Event[],
  status: SmartNote['llmStatus']
) {
  await noteStore.update(noteId, {
    summary: createHeuristicSummary(raw, events),
    events,
    pending: status === 'pending' || status === 'error',
    llmStatus: status,
  });
}

export async function processSmartNote(rawInput: string, options: { autoTracking: boolean } = { autoTracking: true }) {
  const raw = rawInput.trim();
  if (!raw) {
    throw new Error('Empty input');
  }

  const ts = Date.now();
  const noteId = createEventId();

  if (!options.autoTracking) {
    const note: SmartNote = {
      id: noteId,
      ts,
      raw,
      summary: raw,
      events: [],
      llmStatus: 'ready',
    };
    await noteStore.add(note);
    return { noteId };
  }

  const heuristic = parseHeuristic(raw);
  const optimisticEvents = heuristic.candidates.map((candidate) => normalizeEvent(candidate, ts, 'heuristic'));

  const optimisticNote: SmartNote = {
    id: noteId,
    ts,
    raw,
    summary: createOptimisticSummary(raw),
    events: optimisticEvents,
    pending: true,
    llmStatus: 'pending',
  };

  await noteStore.add(optimisticNote);

  const recentNotes = await noteStore.getRecent(RECENT_LIMIT);

  (async () => {
    try {
      const result = await summarizeAndValidate({
        raw,
        recentNotes,
        candidates: optimisticEvents,
      });
      const llmEvents = Array.isArray(result.events)
        ? result.events.map((event) => normalizeEvent(event, ts, 'llm'))
        : [];
      const mergedEvents = mergeEvents(optimisticEvents, llmEvents).map((event) => ({
        ...event,
        ts,
      }));
      await noteStore.update(noteId, {
        summary: result.summary || createOptimisticSummary(raw),
        events: mergedEvents,
        pending: false,
        llmStatus: 'ready',
      });
    } catch (error) {
      console.error('Gemini summarization failed', error);
      if (error instanceof GeminiUnavailableError) {
        await settleWithHeuristic(noteId, raw, optimisticEvents, 'unavailable');
        return;
      }
      if (error instanceof GeminiTimeoutError) {
        await settleWithHeuristic(noteId, raw, optimisticEvents, 'error');
        return;
      }
      await settleWithHeuristic(noteId, raw, optimisticEvents, 'error');
    }
  })();

  return { noteId };
}

export async function retrySmartNote(noteId: string) {
  const existing = await noteStore.get(noteId);
  if (!existing) return;

  await noteStore.update(noteId, { pending: true, llmStatus: 'pending' });

  const ts = existing.ts;
  const heuristic = parseHeuristic(existing.raw);
  const heuristicEvents = heuristic.candidates.map((candidate) => normalizeEvent(candidate, ts, 'heuristic'));

  await noteStore.update(noteId, {
    events: heuristicEvents,
  });

  const recentNotes = await noteStore.getRecent(RECENT_LIMIT + 1);

  try {
    const result = await summarizeAndValidate({
      raw: existing.raw,
      recentNotes,
      candidates: heuristicEvents,
    });
    const llmEvents = Array.isArray(result.events)
      ? result.events.map((event) => normalizeEvent(event, ts, 'llm'))
      : [];
    const mergedEvents = mergeEvents(heuristicEvents, llmEvents).map((event) => ({
      ...event,
      ts,
    }));
    await noteStore.update(noteId, {
      summary: result.summary || createOptimisticSummary(existing.raw),
      events: mergedEvents,
      pending: false,
      llmStatus: 'ready',
    });
  } catch (error) {
    console.error('Gemini retry failed', error);
    if (error instanceof GeminiUnavailableError) {
      await settleWithHeuristic(noteId, existing.raw, heuristicEvents, 'unavailable');
      return;
    }
    if (error instanceof GeminiTimeoutError) {
      await settleWithHeuristic(noteId, existing.raw, heuristicEvents, 'error');
      return;
    }
    await settleWithHeuristic(noteId, existing.raw, heuristicEvents, 'error');
  }
}

