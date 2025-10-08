import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeatherForAachen } from '../weatherService';

describe('getWeatherForAachen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns normalized weather data when the API succeeds', async () => {
    const json = vi.fn().mockResolvedValue({
      current: {
        temperature_2m: 9.7,
        weather_code: 1,
      },
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json } as unknown);
    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeatherForAachen();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      temperature: 10,
      weatherDescription: 'Partly cloudy',
      weatherEmoji: '⛅',
    });
  });

  it.each([
    { code: 0, emoji: '☀️', description: 'Clear sky' },
    { code: 3, emoji: '⛅', description: 'Partly cloudy' },
    { code: 48, emoji: '🌫️', description: 'Foggy' },
    { code: 57, emoji: '🌧️', description: 'Drizzle' },
    { code: 67, emoji: '🌧️', description: 'Rain' },
    { code: 77, emoji: '❄️', description: 'Snow' },
    { code: 82, emoji: '🌧️', description: 'Rain showers' },
    { code: 86, emoji: '🌨️', description: 'Snow showers' },
    { code: 99, emoji: '⛈️', description: 'Thunderstorm' },
    { code: 120, emoji: '🌤️', description: 'Unknown' },
  ])('normalizes weather code $code to $description', async ({ code, emoji, description }) => {
    const json = vi.fn().mockResolvedValue({
      current: {
        temperature_2m: 5,
        weather_code: code,
      },
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json } as unknown);
    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeatherForAachen();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      weatherCode: code,
      weatherEmoji: emoji,
      weatherDescription: description,
    });
  });

  it('returns null when the API is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    );

    const result = await getWeatherForAachen();

    expect(result).toBeNull();
  });

  it('returns null when the API responds with an error status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeatherForAachen();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });
});
