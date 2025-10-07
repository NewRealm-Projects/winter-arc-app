import { SmartNote, Event } from '../types/events';

export class GeminiUnavailableError extends Error {
  status?: number;

  constructor(status?: number, message = 'Gemini endpoint unavailable') {
    super(message);
    this.name = 'GeminiUnavailableError';
    this.status = status;
  }
}

export class GeminiTimeoutError extends Error {
  constructor(message = 'Gemini timeout') {
    super(message);
    this.name = 'GeminiTimeoutError';
  }
}

export interface SummarizeInput {
  raw: string;
  recentNotes: SmartNote[];
  candidates: Event[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const SYSTEM_PROMPT =
  "Du bist ein präziser Fitness-Assistent. Fasse die Eingabe in 1–2 Sätzen aktiv zusammen (ohne Emojis).\nNormalisiere Events exakt auf dieses Schema und liefere NUR JSON:\n{ 'summary':'...', 'events':[ ...Event-Objekte wie spezifiziert... ] }\nEinheiten konsistent (l→ml, Dezimalkomma zulassen), keine Halluzinationen, bei Unsicherheit confidence senken oder Feld weglassen. Sprache der summary = Sprache der Eingabe.";

function serializeNotes(notes: SmartNote[]) {
  return notes.map((note) => ({
    id: note.id,
    ts: note.ts,
    summary: note.summary,
    events: note.events,
  }));
}

export async function summarizeAndValidate(
  input: SummarizeInput
): Promise<{ summary: string; events: Event[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    if (!GEMINI_API_KEY) {
      throw new GeminiUnavailableError(undefined, 'Gemini API key missing');
    }

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: JSON.stringify({
                  raw: input.raw,
                  candidates: input.candidates,
                  recentNotes: serializeNotes(input.recentNotes),
                }),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new GeminiUnavailableError(response.status);
      }
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const text =
      payload?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) =>
        typeof part?.text === 'string'
      )?.text ?? '';

    if (!text) {
      throw new Error('Gemini response missing text payload');
    }

    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary ?? input.raw,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new GeminiTimeoutError();
    }
    if (error instanceof GeminiUnavailableError) {
      throw error;
    }
    if (
      typeof (error as { message?: string })?.message === 'string' &&
      (error as Error).message.includes('Gemini API key missing')
    ) {
      throw new GeminiUnavailableError(undefined, (error as Error).message);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

