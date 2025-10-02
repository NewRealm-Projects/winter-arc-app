import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DailyTracking } from '../types';
import { calculateStreak } from '../utils/calculations';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

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
  birthday?: string
): Promise<{ quote: string; subtext: string }> {
  try {
    // Check if it's the user's birthday
    if (birthday) {
      const today = new Date().toISOString().split('T')[0];
      const [, todayMonth, todayDay] = today.split('-');
      const [, birthdayMonth, birthdayDay] = birthday.split('-');

      if (todayMonth === birthdayMonth && todayDay === birthdayDay) {
        return {
          quote: `🎉 Alles Gute zum Geburtstag, ${nickname}!`,
          subtext: 'Heute ist dein besonderer Tag - trainiere wie ein Champion! 💪🎂',
        };
      }
    }

    // Check if API key is available
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn('Gemini API key not found, using fallback quote');
      return getFallbackQuote();
    }

    const stats = analyzeTrackingData(tracking);

    const prompt = `Du bist ein motivierender Fitness-Coach für die "Winter Arc Challenge".
Erstelle einen kurzen, motivierenden Tagesspruch auf Deutsch für ${nickname}.

**Aktuelle Stats:**
- Streak: ${stats.currentStreak} Tage
- Gesamt Liegestütze: ${stats.totalPushups}
- Sport-Sessions: ${stats.sportSessions}
- Ø Wasser: ${Math.round(stats.avgWater)}ml
- Ø Protein: ${Math.round(stats.avgProtein)}g
- Heute abgeschlossen: ${stats.completedToday ? 'Ja' : 'Nein'}

**Anforderungen:**
1. Kurzer, prägnanter Hauptspruch (max. 10 Wörter)
2. Unterstützender Subtext (max. 15 Wörter)
3. Basierend auf den aktuellen Stats personalisiert
4. Motivierend und ermutigend
5. Bezug zum Winter Arc Thema

**Format (JSON):**
{
  "quote": "Hauptspruch hier",
  "subtext": "Unterstützender Text hier"
}

Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        quote: parsed.quote || 'Der Winter formt Champions!',
        subtext: parsed.subtext || 'Bleib fokussiert und tracke deine Fortschritte jeden Tag.',
      };
    }

    return getFallbackQuote();
  } catch (error) {
    console.error('Error generating AI motivation:', error);
    return getFallbackQuote();
  }
}

function getFallbackQuote(): { quote: string; subtext: string } {
  const fallbackQuotes = [
    {
      quote: 'Der Winter formt Champions!',
      subtext: 'Bleib fokussiert und tracke deine Fortschritte jeden Tag.',
    },
    {
      quote: 'Jeder Tag zählt im Winter Arc!',
      subtext: 'Deine Konsistenz bringt dich ans Ziel.',
    },
    {
      quote: 'Stärke kommt von innen!',
      subtext: 'Nutze die kalte Jahreszeit für deine Transformation.',
    },
    {
      quote: 'Dein Winter Arc beginnt jetzt!',
      subtext: 'Kleine Schritte führen zu großen Erfolgen.',
    },
  ];

  return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
}
