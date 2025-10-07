import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DailyTracking } from '../types';
import { calculateStreak } from '../utils/calculations';
import { countActiveSports } from '../utils/sports';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Cache configuration

// Time periods for quote generation (3x daily)



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
  const today = new Date().toISOString().split('T')[0];

  const totalPushups = Object.values(tracking).reduce(
    (sum, day) => sum + (day.pushups?.total || 0),
    0
  );

  const sportSessions = Object.values(tracking).reduce(
    (sum, day) => sum + countActiveSports(day.sports),
    0
  );

  const waterEntries = Object.values(tracking).filter((day) => day.water > 0);
  const avgWater = waterEntries.length > 0
    ? waterEntries.reduce((sum, day) => sum + day.water, 0) / waterEntries.length
    : 0;

  const proteinEntries = Object.values(tracking).filter((day) => day.protein > 0);
  const avgProtein = proteinEntries.length > 0
    ? proteinEntries.reduce((sum, day) => sum + day.protein, 0) / proteinEntries.length
    : 0;

  const currentStreak = calculateStreak(tracking);

  // Get most recent weight
  const weightEntries = Object.entries(tracking)
    .filter(([_, day]) => day.weight && day.weight.value > 0)
    .sort(([a], [b]) => b.localeCompare(a));

  const trackingDates = Object.keys(tracking).sort();
  const recentWeight = weightEntries.length > 0 ? weightEntries[0][1].weight?.value : undefined;
  const lastWorkoutDate = trackingDates.length > 0 ? trackingDates[trackingDates.length - 1] : undefined;
  const todayEntry = Object.prototype.hasOwnProperty.call(tracking, today)
    const todayEntry = Object.prototype.hasOwnProperty.call(tracking, today) ? tracking[today] : undefined;
    : undefined;
  const completedToday = todayEntry?.completed || false;

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
    const last7Days = Array.from({ length: 7 }, (_, i) => {
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
    const weatherInfo = weatherContext || '';
    const stats = analyzeTrackingData(trackingLast7);
    const todayKey = now.toISOString().split('T')[0];
    const todayTrackingEntry = Object.prototype.hasOwnProperty.call(trackingLast7, todayKey)
      const todayTrackingEntry = Object.prototype.hasOwnProperty.call(trackingLast7, todayKey) ? trackingLast7[todayKey] : undefined;
      : undefined;
    const todayReps = todayTrackingEntry?.pushups?.workout?.reps;

    // Prompt-Variablen vorbereiten
    // (bereits oben deklariert)

    // Prompt-String deklarieren
    // Feedback-Kontext (letzte 7 Feedbacks, falls vorhanden)
    let feedbackHistory: Array<{ quote: string; thumbsUp: boolean; timestamp: number }> = [];
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('ai_feedback_history');
      if (raw) {
        try {
          feedbackHistory = JSON.parse(raw);
        } catch {
          // Invalid JSON, keep empty array
        }
      }
    }

    const prompt = `Du bist ein motivierender Fitness-Coach für die "Winter Arc Challenge".
Schreibe jeden Tag einen kurzen, klaren 3-Zeiler auf Deutsch für den Nutzer.
Sprache: direkt, ermutigend, mit natürlichem Fluss – keine Aufzählungen, keine Stichpunkte, keine Emojis.
Ton: ernsthaft motivierend, ohne Pathos, mit Bezug auf Disziplin und Ausdauer im Winter-Arc-Thema.

WICHTIG: Schreibe GENAU 3 Zeilen (3 Sätze, keine Absätze, keine Listen, keine Aufzählungen, keine Sonderformatierung). Jede Zeile = 1 Satz. Kein Fettdruck, keine Markierung.

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
GENAU 3 Zeilen (3 Sätze, keine Absätze, keine Listen, keine Aufzählungen, keine Sonderformatierung, kein Fettdruck, keine Markierung, keine JSON-Hülle).`;

    // Prompt an Google Generative AI senden
    // Nur Gemini 2.5 Flash verwenden
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    // Entferne doppelte Leerzeilen im Output
    let text = response.text().trim();
    text = text.replace(/\n{3,}/g, '\n\n');
    return {
      quote: text,
      subtext: '',
    };
  } catch (error) {
    console.error('[AI PROMPT ERROR]', error);
    return {
      quote: 'Fehler beim Generieren der Motivation.',
      subtext: '',
    };
  }
}
