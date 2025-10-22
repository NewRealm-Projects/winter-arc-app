import { parseHeuristic } from '../../lib/parsers';
import { noteStore } from '../../store/noteStore';
import { Event, SmartNote } from '../../types/events';

function getRuntimeCrypto(): Crypto | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto as Crypto;
  }
  return undefined;
}

function createEventId() {
  const runtimeCrypto = getRuntimeCrypto();
  if (runtimeCrypto?.randomUUID) {
    return runtimeCrypto.randomUUID();
  }
  if (runtimeCrypto?.getRandomValues) {
    // Browser environment: generate a 16-byte hex string (UUID-like)
    const array = new Uint8Array(16);
    runtimeCrypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('No secure randomness available for event ID');
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
  const events = heuristic.candidates.map((candidate) => normalizeEvent(candidate, ts, 'heuristic'));

  const note: SmartNote = {
    id: noteId,
    ts,
    raw,
    summary: createOptimisticSummary(raw),
    events,
    pending: false,
    attachments,
  };

  await noteStore.add(note);

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
    existing.pending === true || existing.summary !== existing.raw || (existing.events.length > 0);

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
  const events = heuristic.candidates.map((candidate) => normalizeEvent(candidate, existing.ts, 'heuristic'));
  const summary = createOptimisticSummary(raw);

  await noteStore.update(noteId, {
    raw,
    summary,
    events,
    pending: false,
  });
}

export async function retrySmartNote(noteId: string) {
  const existing = await noteStore.get(noteId);
  if (!existing) return;

  const ts = existing.ts;
  const heuristic = parseHeuristic(existing.raw);
  const events = heuristic.candidates.map((candidate) => normalizeEvent(candidate, ts, 'heuristic'));
  const summary = createOptimisticSummary(existing.raw);

  await noteStore.update(noteId, {
    summary,
    events,
    pending: false,
  });
}

