import { getAI, getGenerativeModel, GoogleAIBackend, type GenerativeModel } from '@firebase/ai';
import { app, isFirebaseConfigured } from './firebase';

export interface TagesspruchStats {
  pushUps: number;
  water: number;
  protein: number;
  sport: boolean;
}

export interface TagesspruchContext {
  userId: string;
  name?: string;
  nickname?: string;
  stats: TagesspruchStats;
}

const MODEL_NAME = 'models/gemini-1.5-flash';
const FALLBACK_GO_MODE = [
  'Stark dran bleiben – Gewohnheit entsteht durch Wiederholung.',
  'Heute zählt jeder Schritt. Halte den Fokus und bleib am Ball.',
  'Energie folgt der Handlung: Beweg dich und die Motivation folgt.',
];
const FALLBACK_PUSH_MODE = [
  'Noch ist Zeit für deinen Einsatz – leg jetzt los.',
  'Dein Körper wartet auf das Signal. Starte klein, bleib konsequent.',
  'Ein entschlossener Moment heute schafft den Vorsprung von morgen.',
];

let cachedModel: GenerativeModel | null = null;
let lastCacheKey: string | null = null;
let lastTagesspruch: string | null = null;

const ensureModel = (): GenerativeModel => {
  if (!isFirebaseConfigured || !app) {
    throw new Error('Firebase AI is not configured.');
  }

  if (!cachedModel) {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    cachedModel = getGenerativeModel(ai, {
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 256,
      },
    });
  }

  return cachedModel;
};

const makeCacheKey = (context: TagesspruchContext): string => {
  const date = new Date().toISOString().slice(0, 10);
  const { pushUps, water, protein, sport } = context.stats;

  return [
    date,
    context.userId,
    pushUps,
    water,
    protein,
    sport ? '1' : '0',
  ].join('|');
};

const hashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return hash;
};

const chooseFallback = (context: TagesspruchContext): string => {
  const { pushUps, water, protein, sport } = context.stats;
  const keySeed = [
    context.userId,
    context.nickname ?? '',
    context.name ?? '',
    pushUps.toString(),
    water.toString(),
    protein.toString(),
    sport ? '1' : '0',
  ].join('|');

  const pool = sport || pushUps > 0 || water >= 2000 || protein >= 50 ? FALLBACK_GO_MODE : FALLBACK_PUSH_MODE;
  const index = Math.abs(hashString(keySeed)) % pool.length;

  return pool[index];
};

const buildPrompt = (context: TagesspruchContext): string => {
  const { stats } = context;
  const name = context.nickname?.trim() || context.name?.trim() || 'Athlet';
  const formattedDate = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return [
    'Du bist ein motivierender deutschsprachiger Fitness-Coach.',
    `Datum: ${formattedDate}`,
    `Name: ${name}`,
    'Tagesdaten:',
    `- Push-ups: ${stats.pushUps}`,
    `- Wasser (ml): ${stats.water}`,
    `- Protein (g): ${stats.protein}`,
    `- Sport erledigt: ${stats.sport ? 'Ja' : 'Nein'}`,
    'Formuliere einen einzigen prägnanten Tagesspruch mit maximal 28 Wörtern.',
    'Sprich die Person direkt mit "du" an, nutze keine Emojis, keine Aufzählung, keine Anführungszeichen und keinen Smalltalk.',
    'Gib nur den Satz zurück.',
  ].join('\n');
};

const cleanResponse = (value: string): string => {
  const trimmed = value.trim();
  const withoutQuotes = trimmed.replace(/^["'„“]+|["'„“]+$/g, '');

  return withoutQuotes.replace(/\s+/g, ' ');
};

export const generateTagesspruch = async (context: TagesspruchContext): Promise<string> => {
  const fallback = chooseFallback(context);

  if (!isFirebaseConfigured || !app) {
    return fallback;
  }

  const cacheKey = makeCacheKey(context);
  if (cacheKey === lastCacheKey && lastTagesspruch) {
    return lastTagesspruch;
  }

  try {
    const model = ensureModel();
    const result = await model.generateContent(buildPrompt(context));
    const message = cleanResponse(result.response.text()) || fallback;

    lastCacheKey = cacheKey;
    lastTagesspruch = message;

    return message;
  } catch (error) {
    console.warn('[Tagesspruch] Firebase AI request failed', error);
    lastCacheKey = cacheKey;
    lastTagesspruch = fallback;

    return fallback;
  }
};
