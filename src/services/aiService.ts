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

    // Check cache first (saves API tokens)
    const cachedQuote = getCachedQuote();
    if (cachedQuote) {
      return cachedQuote;
    }

    // Check if API key is available
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Gemini API key not found, using fallback quote');
      return getFallbackQuote();
    }

    console.log('🔑 Gemini API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : '✗ Missing');

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

    // Try different model names in order of preference (newest first)
    const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
    let text = '';
    let lastError: Error | null = null;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Trying Gemini model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        console.log(`✅ Successfully used model: ${modelName}`);
        break; // Success, exit loop
      } catch (error: any) {
        console.warn(`⚠️ Model ${modelName} failed:`, error.message);
        lastError = error;
        continue; // Try next model
      }
    }

    // If all models failed, throw the last error
    if (!text && lastError) {
      console.error('❌ All Gemini models failed, using fallback quote');
      console.error('📋 Possible solutions:');
      console.error('   1. Check if Generative Language API is enabled: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com');
      console.error('   2. Verify your API key is correct: https://makersuite.google.com/app/apikey');
      console.error('   3. Make sure the API key has no usage restrictions');
      console.error('   Last error:', lastError.message);
      return getFallbackQuote();
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const result = {
        quote: parsed.quote || 'Der Winter formt Champions!',
        subtext: parsed.subtext || 'Bleib fokussiert und tracke deine Fortschritte jeden Tag.',
      };
      // Cache the generated quote
      setCachedQuote(result.quote, result.subtext);
      return result;
    }

    const fallback = getFallbackQuote();
    setCachedQuote(fallback.quote, fallback.subtext);
    return fallback;
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
