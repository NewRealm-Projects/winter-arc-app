/**
 * Lazy-loaded AI Service
 *
 * Delays loading of Google Generative AI library until actually needed
 * Saves ~245KB from initial bundle
 */

let geminiModule: typeof import('@google/generative-ai') | null = null;
let aiServiceModule: any = null;

/**
 * Lazy load the Gemini AI module
 */
async function loadGeminiModule() {
  if (!geminiModule) {
    geminiModule = await import('@google/generative-ai');
  }
  return geminiModule;
}

/**
 * Lazy load the AI service module
 */
async function loadAiService() {
  if (!aiServiceModule) {
    aiServiceModule = await import('./aiService');
  }
  return aiServiceModule;
}

/**
 * Generate AI content lazily
 */
export async function generateAiContent(prompt: string, options?: any) {
  // Check if API key exists before loading the module
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI] No Gemini API key configured');
    return null;
  }

  try {
    // Load modules only when needed
    const [gemini, aiService] = await Promise.all([
      loadGeminiModule(),
      loadAiService()
    ]);

    // Use the loaded service
    if (aiService.generateAiContent) {
      return await aiService.generateAiContent(prompt, options);
    }

    // Fallback to basic implementation
    const genAI = new gemini.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('[AI] Failed to generate content:', error);
    return null;
  }
}

/**
 * Generate AI quote lazily
 */
export async function generateAiQuote(userData: any) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const aiService = await loadAiService();
    if (aiService.generateMotivationalQuote) {
      return await aiService.generateMotivationalQuote(userData);
    }
    return null;
  } catch (error) {
    console.error('[AI] Failed to generate quote:', error);
    return null;
  }
}

/**
 * Check if AI is available
 */
export function isAiAvailable(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}