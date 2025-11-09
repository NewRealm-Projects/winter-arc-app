import { Event, EventKind } from '../types/events';

const beverageKeywords: Record<string, 'water' | 'protein' | 'coffee' | 'tea' | 'other'> = {
  wasser: 'water',
  water: 'water',
  'stilles wasser': 'water',
  'sparkling water': 'water',
  protein: 'protein',
  proteinshake: 'protein',
  shake: 'protein',
  kaffee: 'coffee',
  coffee: 'coffee',
  espresso: 'coffee',
  tee: 'tea',
  tea: 'tea',
};

const workoutKeywords: Record<string, 'hiit_hyrox' | 'cardio' | 'gym' | 'swimming' | 'football' | 'other'> = {
  hiit: 'hiit_hyrox',
  hyrox: 'hiit_hyrox',
  cardio: 'cardio',
  laufen: 'cardio',
  joggen: 'cardio',
  run: 'cardio',
  running: 'cardio',
  jog: 'cardio',
  cycling: 'cardio',
  rad: 'cardio',
  bike: 'cardio',
  radfahren: 'cardio',
  schwimmen: 'swimming',
  swimming: 'swimming',
  schwimm: 'swimming',
  gym: 'gym',
  kraft: 'gym',
  krafttraining: 'gym',
  workout: 'gym',
  training: 'gym',
  fußball: 'football',
  fussball: 'football',
  football: 'football',
  soccer: 'football',
};

const foodKeywords = [
  'porridge',
  'oatmeal',
  'haferbrei',
  'tofu',
  'reis',
  'rice',
  'nudeln',
  'pasta',
  'salat',
  'salad',
  'smoothie',
  'burger',
  'sandwich',
  'wrap',
  'quark',
  'yogurt',
  'joghurt',
];

const intensityMap: Record<string, 'easy' | 'moderate' | 'hard'> = {
  locker: 'easy',
  leicht: 'easy',
  easy: 'easy',
  moderat: 'moderate',
  moderate: 'moderate',
  hart: 'hard',
  streng: 'hard',
  hard: 'hard',
  intense: 'hard',
};

const DECIMAL_REGEX = /,/g;

const FOOD_CALORIES_REGEX = /(\d+(?:[.,]\d+)?)\s?(kcal|cal(?:orien)?)\b/i;
const FOOD_PROTEIN_REGEX = /(\d+(?:[.,]\d+)?)\s?(g|gramm|grams?)\b.*(protein|eiweiß)/i;
const LETTER_BOUNDARY_REGEX = /[a-zäöüß]/i;

function containsKeyword(text: string, keyword: string): boolean {
  let index = text.indexOf(keyword);
  if (index === -1) return false;
  while (index !== -1) {
    const before = index > 0 ? text[index - 1] : '';
    const afterIndex = index + keyword.length;
    const after = afterIndex < text.length ? text[afterIndex] : '';
    // Guard: LETTER_BOUNDARY_REGEX.test expects string, we already coerce empty when absent
  // Explicit guards to satisfy strict null/undefined checks
  const beforeIsLetter = typeof before === 'string' && before.length === 1 && LETTER_BOUNDARY_REGEX.test(before);
  const afterIsLetter = typeof after === 'string' && after.length === 1 && LETTER_BOUNDARY_REGEX.test(after);
    if (!(beforeIsLetter && afterIsLetter)) return true;
    index = text.indexOf(keyword, index + keyword.length);
  }
  return false;
}

const DEFAULT_CONFIDENCE = 0.6;

function toNumber(value: string): number {
  return Number.parseFloat(value.replace(',', '.'));
}

function createEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildBase<K extends EventKind>(kind: K, confidence: number) {
  return {
    id: createEventId(),
    ts: Date.now(),
    kind,
    confidence,
    source: 'heuristic' as const,
  };
}

function detectBeverage(raw: string): 'water' | 'protein' | 'coffee' | 'tea' | 'other' {
  const lower = raw.toLowerCase();
  for (const [keyword, value] of Object.entries(beverageKeywords)) {
    if (lower.includes(keyword)) {
      return value;
    }
  }
  if (lower.includes('protein')) {
    return 'protein';
  }
  return 'other';
}

function findDuration(raw: string): number | undefined {
  const durationMatch = raw.match(/(\d+(?:[.,]\d+)?)\s?(min|minutes?|mins?|h|stunden?|hours?)/i);
  if (!durationMatch) return undefined;
  const valueRaw = durationMatch[1];
  const unitRaw = durationMatch[2];
  if (!valueRaw || !unitRaw) return undefined;
  const value = toNumber(valueRaw);
  const unit = unitRaw.toLowerCase();
  return unit.startsWith('h') ? Math.round(value * 60) : Math.round(value);
}

function findIntensity(raw: string): 'easy' | 'moderate' | 'hard' | undefined {
  const lower = raw.toLowerCase();
  for (const [keyword, intensity] of Object.entries(intensityMap)) {
    if (lower.includes(keyword)) {
      return intensity;
    }
  }
  return undefined;
}

function detectSport(raw: string): 'hiit_hyrox' | 'cardio' | 'gym' | 'swimming' | 'football' | 'other' {
  const lower = raw.toLowerCase();
  for (const [keyword, sport] of Object.entries(workoutKeywords)) {
    if (containsKeyword(lower, keyword)) {
      return sport;
    }
  }
  return 'other';
}

export function parseHeuristic(raw: string): { raw: string; candidates: Event[] } {
  const normalized = raw.replace(DECIMAL_REGEX, '.');
  const lower = normalized.toLowerCase();
  const candidates: Event[] = [];

  const drinkRegex = /(\d+(?:\.\d+)?)\s?(ml|l)\b/gi;
  let drinkMatch: RegExpExecArray | null;
  while ((drinkMatch = drinkRegex.exec(normalized))) {
    const valueRaw = drinkMatch[1];
    const unitRaw = drinkMatch[2];
    if (!valueRaw || !unitRaw) continue;
    const value = Number.parseFloat(valueRaw);
    const unit = unitRaw.toLowerCase();
    const volumeMl = unit === 'l' ? Math.round(value * 1000) : Math.round(value);
    const drinkEvent = {
      ...buildBase('drink', DEFAULT_CONFIDENCE),
      volumeMl,
      beverage: detectBeverage(lower),
    } satisfies Event;
    candidates.push(drinkEvent);
  }

  const proteinRegex = /(\d+(?:\.\d+)?)\s?(g|gramm|grams?)\b/gi;
  let proteinMatch: RegExpExecArray | null;
  let foundProteinValue = false;
  while ((proteinMatch = proteinRegex.exec(normalized))) {
    const gramsRaw = proteinMatch[1];
    if (!gramsRaw) continue;
    const grams = Math.round(Number.parseFloat(gramsRaw));
    const proteinEvent = {
      ...buildBase('protein', DEFAULT_CONFIDENCE),
      grams,
      sourceLabel: lower.includes('shake') || lower.includes('protein') ? 'protein' : undefined,
    } satisfies Event;
    candidates.push(proteinEvent);
    foundProteinValue = true;
  }

  if (lower.includes('proteinshake') && !foundProteinValue) {
    const shakeEvent = {
      ...buildBase('protein', 0.5),
      grams: 25,
      sourceLabel: 'proteinshake',
    } satisfies Event;
    candidates.push(shakeEvent);
  }

  const pushupRegex = /(\d+)\s?(liegestütze|liegestuetze|push[- ]?ups?)\b/gi;
  let pushupMatch: RegExpExecArray | null;
  while ((pushupMatch = pushupRegex.exec(lower))) {
    const countRaw = pushupMatch[1];
    if (!countRaw) continue;
    const count = Number.parseInt(countRaw, 10);
    const pushupEvent = {
      ...buildBase('pushups', DEFAULT_CONFIDENCE),
      count,
    } satisfies Event;
    candidates.push(pushupEvent);
  }

  const workoutMatch = Object.keys(workoutKeywords).some((keyword) => containsKeyword(lower, keyword));
  if (workoutMatch) {
    const workoutEvent = {
      ...buildBase('workout', DEFAULT_CONFIDENCE),
      sport: detectSport(lower),
      durationMin: findDuration(lower),
      intensity: findIntensity(lower),
      notes: raw,
    } satisfies Event;
    candidates.push(workoutEvent);
  }

  if (/(ausruhen|rest ?day|pause)/i.test(lower)) {
    const restEvent = {
      ...buildBase('rest', DEFAULT_CONFIDENCE),
      reason: /wegen\s+([^.,;]+)/i.exec(normalized)?.[1],
    } satisfies Event;
    candidates.push(restEvent);
  }

  const weightRegex = /(\d+(?:\.\d+)?)\s?kg\b/i;
  const weightMatch = weightRegex.exec(normalized);
  if (weightMatch && weightMatch[1]) {
    const weightEvent = {
      ...buildBase('weight', DEFAULT_CONFIDENCE),
      kg: Number.parseFloat(weightMatch[1]),
    } satisfies Event;
    candidates.push(weightEvent);
  }

  const bfpRegex = /(\d+(?:\.\d+)?)\s?%\b/i;
  const bfpMatch = bfpRegex.exec(normalized);
  if (bfpMatch && bfpMatch[1]) {
    const bfpEvent = {
      ...buildBase('bfp', DEFAULT_CONFIDENCE),
      percent: Number.parseFloat(bfpMatch[1]),
    } satisfies Event;
    candidates.push(bfpEvent);
  }

  for (const keyword of foodKeywords) {
    if (lower.includes(keyword)) {
      const caloriesMatch = FOOD_CALORIES_REGEX.exec(lower);
      const proteinInfo = FOOD_PROTEIN_REGEX.exec(lower);
      const calorieRaw = caloriesMatch?.[1];
      const proteinRaw = proteinInfo?.[1];
      const foodEvent = {
        ...buildBase('food', DEFAULT_CONFIDENCE),
        label: keyword,
        calories: calorieRaw ? Math.round(toNumber(calorieRaw)) : undefined,
        proteinG: proteinRaw ? Math.round(toNumber(proteinRaw)) : undefined,
      } satisfies Event;
      candidates.push(foodEvent);
      break;
    }
  }

  return { raw, candidates };
}


