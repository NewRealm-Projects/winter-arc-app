import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DailyTracking } from '../types';
import { calculateStreak } from '../utils/calculations';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Cache configuration
const CACHE_KEY = 'winter_arc_daily_quote';
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

// Time periods for quote generation (3x daily)
type TimePeriod = 'morning' | 'noon' | 'evening';

function getCurrentTimePeriod(): TimePeriod {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'noon';
  return 'evening';
}

function getCachedQuote(): { quote: string; subtext: string } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { quote, subtext, timestamp, period } = JSON.parse(cached);
    const currentPeriod = getCurrentTimePeriod();

    // Check if cache is from the same time period
    if (period !== currentPeriod) {
      console.log(`🔄 Time period changed from ${period} to ${currentPeriod}, generating new quote`);
      return null;
    }

    // Check if cache is still valid (additional safety check)
    const age = Date.now() - timestamp;
    if (age > CACHE_DURATION_MS) {
      console.log('⏰ Cache expired, generating new quote');
      return null;
    }

    console.log(`✅ Using cached quote from ${period} period (${Math.round(age / 1000 / 60)}min ago)`);
    return { quote, subtext };
  } catch (error) {
    console.error('❌ Error reading quote cache:', error);
    return null;
  }
}

function setCachedQuote(quote: string, subtext: string) {
  try {
    const cacheData = {
      quote,
      subtext,
      timestamp: Date.now(),
      period: getCurrentTimePeriod(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(`💾 Quote cached for ${getCurrentTimePeriod()} period`);
  } catch (error) {
    console.error('❌ Error saving quote cache:', error);
  }
}

interface UserTrackingStats {
  currentStreak: number;
  totalPushups: number;
  sportSessions: number;
  avgWater: number;
  avgProtein: number;
  recentWeight?: number;
  lastWorkoutDate?: string;
  completedToday: boolean;
}

function analyzeTrackingData(tracking: Record<string, DailyTracking>): UserTrackingStats {
  const trackingDates = Object.keys(tracking).sort();
  const today = new Date().toISOString().split('T')[0];

  const totalPushups = Object.values(tracking).reduce(
    (sum, day) => sum + (day.pushups?.total || 0),
    0
  );

  const sportSessions = Object.values(tracking).reduce(
    (sum, day) => sum + Object.values(day.sports || {}).filter(Boolean).length,
    0
  );

  const waterEntries = Object.values(tracking).filter(day => day.water > 0);
  const avgWater = waterEntries.length > 0
    ? waterEntries.reduce((sum, day) => sum + day.water, 0) / waterEntries.length
    : 0;

  const proteinEntries = Object.values(tracking).filter(day => day.protein > 0);
  const avgProtein = proteinEntries.length > 0
    ? proteinEntries.reduce((sum, day) => sum + day.protein, 0) / proteinEntries.length
    : 0;

  const currentStreak = calculateStreak(trackingDates);

  // Get most recent weight
  const weightEntries = Object.entries(tracking)
    .filter(([_, day]) => day.weight && day.weight.value > 0)
    .sort(([a], [b]) => b.localeCompare(a));

  const recentWeight = weightEntries.length > 0 ? weightEntries[0][1].weight?.value : undefined;
  const lastWorkoutDate = trackingDates.length > 0 ? trackingDates[trackingDates.length - 1] : undefined;
  const completedToday = tracking[today]?.completed || false;

  return {
    currentStreak,
    totalPushups,
    sportSessions,
    avgWater,
    avgProtein,
    recentWeight,
    lastWorkoutDate,
    completedToday,
  };
}

export async function generateDailyMotivation(
  tracking: Record<string, DailyTracking>,
  nickname: string,
  birthday?: string,
  weatherContext?: string
): Promise<{ quote: string; subtext: string }> {
  try {
    // Nur Tracking-Daten der letzten 7 Tage verwenden
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    const trackingLast7: Record<string, DailyTracking> = {};
    for (const date of last7Days) {
      if (tracking[date]) trackingLast7[date] = tracking[date];
    }
    // Debug: Logge alle AI-relevanten Userdaten für das Prompt
    console.log('[AI PROMPT DEBUG] Userdaten für Motivation (letzte 7 Tage):', {
      nickname,
      birthday,
      weatherContext,
      tracking: trackingLast7,
    });

    // Prompt-Variablen vorbereiten
    const now = new Date();
    const isoDatetime = now.toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const weatherInfo = weatherContext || '';
    const stats = analyzeTrackingData(trackingLast7);
    const todayReps = trackingLast7[now.toISOString().split('T')[0]]?.pushups?.workout?.reps;

    // Prompt-Variablen vorbereiten
    // (bereits oben deklariert)

    // Prompt-String deklarieren
    // Feedback-Kontext (letzte 7 Feedbacks, falls vorhanden)
    let feedbackHistory: any[] = [];
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('ai_feedback_history');
      if (raw) {
        try {
          feedbackHistory = JSON.parse(raw);
        } catch {}
      }
    }

    const prompt = `Du bist ein motivierender Fitness-Coach für die \"Winter Arc Challenge\".
Schreibe jeden Tag einen kurzen, klaren 3–8-Zeiler auf Deutsch für den Nutzer.
Sprache: direkt, ermutigend, mit natürlichem Fluss – keine Aufzählungen, keine Stichpunkte, keine Emojis.
Ton: ernsthaft motivierend, ohne Pathos, mit Bezug auf Disziplin und Ausdauer im Winter-Arc-Thema.

WICHTIG: Verwende KEINEN Fettdruck, keine Markierungen, keine Sonderformatierung. Schreibe nur normalen Text.
Wenn sinnvoll, setze Absätze (Leerzeile) für Übersichtlichkeit.

Daten, die du erhältst:
${JSON.stringify({
  nickname,
  weatherContext: weatherInfo,
  stats: {
    currentStreak: stats.currentStreak,
    totalPushups: stats.totalPushups,
    sportSessions: stats.sportSessions,
    avgWater: Math.round(stats.avgWater),
    avgProtein: Math.round(stats.avgProtein),
    completedToday: stats.completedToday,
    today: todayReps ? { reps: todayReps } : undefined,
    rest: false
  },
  timeContext: isoDatetime,
  feedbackHistory // z.B. [{date, quote, feedback: 'up'|'down'}]
}, null, 2)}

Logik:
- Bestimme aus der Uhrzeit, ob es Morgen (05–10 Uhr), Mittag (11–16 Uhr) oder Abend (17–23 Uhr) ist.
- Passe den Text an die Tageszeit an:
  - Morgen: Aufbruch, Energie, Zielsetzung.
  - Mittag: Dranbleiben, Zwischenbilanz, Korrektur (z. B. mehr trinken, Protein snacken).
  - Abend: Bilanz, Disziplin sichern, evtl. kleiner Finisher.
- Nutze die Stats für personalisierte Hinweise:
  - Streak hoch → Stolz betonen, Momentum halten.
  - Streak niedrig → Neubeginn betonen, Motivation aufbauen.
  - completedToday = false → kleinstes lieferbares Ergebnis vorschlagen (z. B. 1 Satz).
  - avgWater < 2000 → erinnere ans Trinken.
  - avgProtein < 120 → erinnere an Protein.
  - Rest = true → Fokus auf Regeneration.
- Wetter nur kurz einbauen (z. B. kühle Luft, klare Gedanken).
- Schreibe in einem natürlichen Fluss, nicht stichpunktartig.

Berücksichtige das FeedbackHistory-Array: Wenn mehrere Daumen runter in Folge, ändere Stil oder Inhalt, um besser zu motivieren. Bei Daumen hoch, halte den Stil ähnlich.

Ausgabe:
Nur den 3–8-Zeiler im Plaintext, keine JSON-Hülle. Kein Fettdruck, keine Markierung. Absätze (Leerzeile) sind erlaubt, wenn sinnvoll.`;

    // Prompt an Google Generative AI senden
    // Modell-Priorität: 2.5 Pro → 2.5 Flash → 2.5 Flash-Lite
    const modelOrder = [
      'gemini-2.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ];
    let lastError = null;
    for (const modelName of modelOrder) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();
        if (text) {
          return {
            quote: text,
            subtext: '',
          };
        }
      } catch (err) {
        lastError = err;
        // Versuche nächstes Modell
      }
    }
    // Wenn alle Modelle fehlschlagen
    throw lastError || new Error('Kein Gemini-Modell verfügbar');
  } catch (error) {
    console.error('[AI PROMPT ERROR]', error);
    return {
      quote: 'Fehler beim Generieren der Motivation.',
      subtext: '',
    };
  }
}
