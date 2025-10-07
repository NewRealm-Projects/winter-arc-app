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

export async function summarizeAndValidate(
  input: SummarizeInput
): Promise<{ summary: string; events: Event[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemPrompt:
          "Du bist ein präziser Fitness-Assistent. Fasse die Eingabe in 1–2 Sätzen aktiv zusammen (ohne Emojis).\nNormalisiere Events exakt auf dieses Schema und liefere NUR JSON:\n{ 'summary':'...', 'events':[ ...Event-Objekte wie spezifiziert... ] }\nEinheiten konsistent (l→ml, Dezimalkomma zulassen), keine Halluzinationen, bei Unsicherheit confidence senken oder Feld weglassen. Sprache der summary = Sprache der Eingabe.",
        payload: input,
      }),
    });

    if (!response.ok) {
      if ([404, 405, 501].includes(response.status)) {
        throw new GeminiUnavailableError(response.status);
      }
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const text = await response.text();
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
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

