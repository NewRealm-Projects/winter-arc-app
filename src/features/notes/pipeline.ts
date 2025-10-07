import { parseHeuristic } from '../../lib/parsers';
import { summarizeAndValidate } from '../../services/gemini';
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

type ProcessSmartNoteOptions = {
  autoTracking: boolean;
  attachments?: SmartNote['attachments'];
};

export async function processSmartNote(
  rawInput: string,
  options: ProcessSmartNoteOptions = { autoTracking: true }
) {
  const raw = rawInput.trim();
  if (!raw) {
    throw new Error('Empty input');
  }

  const ts = Date.now();
  const noteId = createEventId();
  const attachments = options.attachments?.length ? options.attachments : undefined;

  if (!options.autoTracking) {
    const note: SmartNote = {
      id: noteId,
      ts,
      raw,
      summary: raw,
      events: [],
      attachments,
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
    attachments,
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
      });
    } catch (error) {
      console.error('Gemini summarization failed', error);
      await noteStore.update(noteId, {
        summary: createOptimisticSummary(raw),
        pending: true,
      });
    }
  })();

  return { noteId };
}

export async function updateSmartNote(noteId: string, rawInput: string) {
  const existing = await noteStore.get(noteId);
  if (!existing) {
    return;
  }

  const raw = rawInput.trim();
  if (!raw) {
    throw new Error('Empty input');
  }

  const autoTrackingEnabled =
    existing.pending === true || existing.summary !== existing.raw || (existing.events?.length ?? 0) > 0;

  if (!autoTrackingEnabled) {
    await noteStore.update(noteId, {
      raw,
      summary: raw,
      events: [],
      pending: undefined,
    });
    return;
  }

  const heuristic = parseHeuristic(raw);
  const heuristicEvents = heuristic.candidates.map((candidate) => normalizeEvent(candidate, existing.ts, 'heuristic'));
  const optimisticSummary = createOptimisticSummary(raw);

  await noteStore.update(noteId, {
    raw,
    summary: optimisticSummary,
    events: heuristicEvents,
    pending: true,
  });

  const recentNotes = await noteStore.getRecent(RECENT_LIMIT + 1);

  try {
    const result = await summarizeAndValidate({
      raw,
      recentNotes,
      candidates: heuristicEvents,
    });
    const llmEvents = Array.isArray(result.events)
      ? result.events.map((event) => normalizeEvent(event, existing.ts, 'llm'))
      : [];
    const mergedEvents = mergeEvents(heuristicEvents, llmEvents).map((event) => ({
      ...event,
      ts: existing.ts,
    }));
    await noteStore.update(noteId, {
      summary: result.summary || optimisticSummary,
      events: mergedEvents,
      pending: false,
    });
  } catch (error) {
    console.error('Gemini update failed', error);
    await noteStore.update(noteId, {
      pending: true,
    });
  }
}

export async function retrySmartNote(noteId: string) {
  const existing = await noteStore.get(noteId);
  if (!existing) return;

  await noteStore.update(noteId, { pending: true });

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
    });
  } catch (error) {
    console.error('Gemini retry failed', error);
    await noteStore.update(noteId, {
      pending: true,
    });
  }
}

