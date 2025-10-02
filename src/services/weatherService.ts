/**
 * Weather Service using Open-Meteo API (free, no API key required)
 * Location: Aachen, Germany (50.7753, 6.0839)
 */

interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherEmoji: string;
  weatherDescription: string;
}

const AACHEN_LAT = 50.7753;
const AACHEN_LON = 6.0839;

// Weather code to emoji mapping (WMO Weather interpretation codes)
const weatherCodeToEmoji = (code: number): { emoji: string; description: string } => {
  if (code === 0) return { emoji: '☀️', description: 'Clear sky' };
  if (code <= 3) return { emoji: '⛅', description: 'Partly cloudy' };
  if (code <= 48) return { emoji: '🌫️', description: 'Foggy' };
  if (code <= 57) return { emoji: '🌧️', description: 'Drizzle' };
  if (code <= 67) return { emoji: '🌧️', description: 'Rain' };
  if (code <= 77) return { emoji: '❄️', description: 'Snow' };
  if (code <= 82) return { emoji: '🌧️', description: 'Rain showers' };
  if (code <= 86) return { emoji: '🌨️', description: 'Snow showers' };
  if (code <= 99) return { emoji: '⛈️', description: 'Thunderstorm' };
  return { emoji: '🌤️', description: 'Unknown' };
};

export async function getWeatherForAachen(): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${AACHEN_LAT}&longitude=${AACHEN_LON}&current=temperature_2m,weather_code&timezone=Europe%2FBerlin`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    const temperature = Math.round(data.current.temperature_2m);
    const weatherCode = data.current.weather_code;
    const { emoji, description } = weatherCodeToEmoji(weatherCode);

    return {
      temperature,
      weatherCode,
      weatherEmoji: emoji,
      weatherDescription: description,
    };
  } catch (error) {
    console.error('❌ Error fetching weather:', error);
    return null;
  }
}
