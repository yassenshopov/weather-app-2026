import { describe, expect, it, vi } from 'vitest';
import type { ForecastResponse, ForecastItem } from '@/types/weather';
import {
  formatTemperature,
  formatTime,
  formatWindSpeed,
  get5DayForecast,
  getLocalTime,
  getWeatherIconUrl,
  processForecastData,
} from '@/utils/weather';

const makeItem = (overrides: Partial<ForecastItem>): ForecastItem => ({
  dt: 0,
  main: {
    temp: 0,
    feels_like: 0,
    temp_min: 0,
    temp_max: 0,
    pressure: 1013,
    humidity: 50,
  },
  weather: [
    {
      id: 800,
      main: 'Clear',
      description: 'clear sky',
      icon: '01d',
    },
  ],
  clouds: { all: 0 },
  wind: { speed: 1.2, deg: 180 },
  visibility: 10000,
  pop: 0,
  dt_txt: '',
  ...overrides,
});

const buildResponse = (list: ForecastItem[]): ForecastResponse => ({
  cod: '200',
  message: 0,
  cnt: list.length,
  list,
  city: {
    id: 1,
    name: 'Testville',
    coord: { lat: 1, lon: 2 },
    country: 'US',
    population: 10,
    timezone: 0,
    sunrise: 1737168000,
    sunset: 1737201600,
  },
});

describe('weather utils', () => {
  it('processes forecast data into current and daily summaries', () => {
    const day1Morning = makeItem({
      dt: Math.floor(Date.UTC(2026, 0, 18, 6, 0, 0) / 1000),
      main: { temp: 12, feels_like: 10, temp_min: 11, temp_max: 13, pressure: 1013, humidity: 45 },
      wind: { speed: 3.2, deg: 120 },
      pop: 0.1,
    });
    const day1Midday = makeItem({
      dt: Math.floor(Date.UTC(2026, 0, 18, 12, 0, 0) / 1000),
      main: { temp: 18, feels_like: 17, temp_min: 16, temp_max: 19, pressure: 1013, humidity: 40 },
      weather: [
        { id: 500, main: 'Rain', description: 'light rain', icon: '10d' },
      ],
      wind: { speed: 4.5, deg: 140 },
      pop: 0.6,
    });
    const day1Evening = makeItem({
      dt: Math.floor(Date.UTC(2026, 0, 18, 18, 0, 0) / 1000),
      main: { temp: 14, feels_like: 12, temp_min: 13, temp_max: 15, pressure: 1013, humidity: 55 },
      wind: { speed: 2.8, deg: 200 },
      pop: 0.2,
    });
    const day2Night = makeItem({
      dt: Math.floor(Date.UTC(2026, 0, 19, 0, 0, 0) / 1000),
      main: { temp: 9, feels_like: 7, temp_min: 8, temp_max: 10, pressure: 1013, humidity: 60 },
      wind: { speed: 2.4, deg: 170 },
      pop: 0.05,
    });
    const day2Midday = makeItem({
      dt: Math.floor(Date.UTC(2026, 0, 19, 12, 0, 0) / 1000),
      main: { temp: 16, feels_like: 14, temp_min: 15, temp_max: 17, pressure: 1013, humidity: 52 },
      wind: { speed: 3.7, deg: 190 },
      pop: 0.3,
    });
    const day2Evening = makeItem({
      dt: Math.floor(Date.UTC(2026, 0, 19, 21, 0, 0) / 1000),
      main: { temp: 11, feels_like: 9, temp_min: 10, temp_max: 12, pressure: 1013, humidity: 58 },
      wind: { speed: 2.1, deg: 210 },
      pop: 0.15,
    });

    const response = buildResponse([
      day1Morning,
      day1Midday,
      day1Evening,
      day2Night,
      day2Midday,
      day2Evening,
    ]);

    const result = processForecastData(response);

    expect(result.current.city).toBe('Testville');
    expect(result.current.temp).toBe(12);
    expect(result.current.condition.main).toBe('Clear');
    expect(result.daily).toHaveLength(2);
    expect(result.daily[0].dayName).toBe('Sunday');
    expect(result.daily[0].temp.min).toBe(12);
    expect(result.daily[0].temp.max).toBe(18);
    expect(result.daily[0].temp.avg).toBe(15);
    expect(result.daily[0].condition.main).toBe('Rain');
    expect(result.daily[0].pop).toBe(60);
    expect(result.daily[0].hourly).toHaveLength(3);
    expect(result.daily[0].hourly[0].time.toISOString()).toBe('2026-01-18T06:00:00.000Z');
    expect(result.daily[0].hourly[1].pop).toBe(60);
    expect(result.daily[0].hourly[2].windSpeed).toBe(2.8);
  });

  it('formats weather values consistently', () => {
    expect(getWeatherIconUrl('10d', '4x')).toBe(
      'https://openweathermap.org/img/wn/10d@4x.png'
    );
    expect(formatTemperature(12, 'metric')).toBe('12°C');
    expect(formatTemperature(55, 'imperial')).toBe('55°F');
    expect(formatWindSpeed(3.2, 'metric')).toBe('3.2 m/s');
    expect(formatWindSpeed(7.5, 'imperial')).toBe('7.5 mph');

    const sample = new Date(Date.UTC(2026, 0, 1, 13, 5, 0));
    expect(formatTime(sample, '12h')).toContain('01:05');
    expect(formatTime(sample, '12h')).toContain('PM');
    expect(formatTime(sample, '24h')).toContain('13:05');

    const local = getLocalTime(3600, sample);
    expect(local.toISOString()).toBe('2026-01-01T14:05:00.000Z');
  });

  it('throws friendly errors for get5DayForecast responses', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized' });
    await expect(get5DayForecast('Paris', 'bad-key')).rejects.toThrow(
      'Invalid API key. Please check your OpenWeatherMap API key.'
    );

    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
    await expect(get5DayForecast('Unknown', 'key')).rejects.toThrow(
      'City not found. Please check the city name.'
    );

    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });
    await expect(get5DayForecast('Paris', 'key')).rejects.toThrow(
      'Failed to fetch weather data: Server Error'
    );
  });

  it('returns data from get5DayForecast on success', async () => {
    const response = buildResponse([makeItem({ dt: 1 })]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(get5DayForecast('Paris', 'key')).resolves.toEqual(response);
  });
});
