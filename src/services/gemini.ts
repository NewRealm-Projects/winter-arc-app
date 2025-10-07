import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { SmartNote, Event } from '../types/events';

export interface SummarizeInput {
  raw: string;
  recentNotes: SmartNote[];
  candidates: Event[];
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function sanitizeNote(note: SmartNote) {
  return {
    id: note.id,
    ts: note.ts,
    raw: note.raw,
    summary: note.summary,
    events: note.events.map(sanitizeEvent),
  };
}

function sanitizeEvent(event: Event) {
  const { id, ts, kind, confidence, source, ...rest } = event;
  return {
    id,
    ts,
    kind,
    confidence,
    source,
    ...rest,
  };
}

function createEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const ALLOWED_EVENT_KINDS: Event['kind'][] = [
  'drink',
  'protein',
  'pushups',
  'workout',
  'rest',
  'weight',
  'bfp',
  'food',
];

function normalizeGeneratedEvents(events: unknown[]): Event[] {
  return events
    .filter((event): event is Record<string, unknown> => typeof event === 'object' && event !== null)
    .map((event) => {
      const kind = (event as Record<string, unknown>).kind;
      if (typeof kind !== 'string' || !ALLOWED_EVENT_KINDS.includes(kind as Event['kind'])) {
        return null;
      }

      const normalized: Event = {
        ...(event as Record<string, unknown>),
        id:
          typeof (event as Record<string, unknown>).id === 'string'
            ? ((event as Record<string, unknown>).id as string)
            : createEventId(),
        ts:
          typeof (event as Record<string, unknown>).ts === 'number'
            ? ((event as Record<string, unknown>).ts as number)
            : Date.now(),
        kind: kind as Event['kind'],
        confidence: Math.max(
          0,
          Math.min(
            1,
            typeof (event as Record<string, unknown>).confidence === 'number'
              ? ((event as Record<string, unknown>).confidence as number)
              : 0.5
          )
        ),
        source:
          (event as Record<string, unknown>).source === 'heuristic' ||
          (event as Record<string, unknown>).source === 'llm'
            ? ((event as Record<string, unknown>).source as 'heuristic' | 'llm')
            : 'llm',
      } as Event;

      return normalized;
    })
    .filter((event): event is Event => event !== null);
}

export async function summarizeAndValidate(
  input: SummarizeInput
): Promise<{ summary: string; events: Event[] }> {
  if (!genAI) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY in your environment.');
  }

  const sanitizedPayload = {
    note: input.raw,
    recentNotes: input.recentNotes?.slice(0, 5).map(sanitizeNote) || [],
    candidates: input.candidates?.map(sanitizeEvent) ?? [],
  };

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        'Du bist ein präziser Fitness-Assistent. Antworte ausschließlich im JSON-Format. Fasse die Eingabe in 1–2 Sätzen aktiv zusammen (ohne Emojis) und liefere unter "summary" eine knappe, sprachlich korrekte Zusammenfassung in der Sprache der Eingabe. Gib unter "events" eine Liste strukturierter Ereignisse zurück, die exakt dem Events-Schema der Winter Arc App folgen. Wenn du unsicher bist, lass Felder weg oder setze eine niedrige confidence.',
    });

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => { reject(new Error('Gemini timeout')); }, 8000);
    });

    const generationPromise = model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analysiere die folgende Notiz und Vorschläge. Antworte ausschließlich als JSON mit dem Schema {"summary": string, "events": Event[]}. Event Schema: {"id": string (behalten oder neu vergeben), "ts": number (Unix ms), "kind": "drink"|"protein"|"pushups"|"workout"|"rest"|"weight"|"bfp"|"food", "confidence": number 0-1, "source": "heuristic"|"llm", ...}. Kandidaten liefern bereits konsistente Werte. Nutze sie als Ausgangspunkt und passe sie an.\n\nInput:\n${JSON.stringify(sanitizedPayload, null, 2)}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
            events: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  ts: { type: SchemaType.NUMBER },
                  kind: {
                    type: SchemaType.STRING,
                    enum: ['drink', 'protein', 'pushups', 'workout', 'rest', 'weight', 'bfp', 'food'],
                  },
                  confidence: { type: SchemaType.NUMBER },
                  source: { type: SchemaType.STRING, enum: ['heuristic', 'llm'] },
                },
                required: ['id', 'ts', 'kind', 'confidence', 'source'],
              },
            },
          },
          required: ['summary', 'events'],
        },
      },
    });

    let result: Awaited<typeof generationPromise> | undefined;
    try {
      result = (await Promise.race([generationPromise, timeoutPromise])) as Awaited<
        typeof generationPromise
      >;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }

    if (!result) {
      throw new Error('Gemini request did not resolve');
    }

    const text = result.response.text();
    const parsed = JSON.parse(text);

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : input.raw;

    const events = Array.isArray(parsed.events)
      ? normalizeGeneratedEvents(parsed.events as unknown[])
      : [];

    return {
      summary,
      events,
    };
  } catch (error) {
    console.error('Gemini summarization failed', error);
    throw error;
  }
}
