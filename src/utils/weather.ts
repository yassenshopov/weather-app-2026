import type { ForecastResponse, DailyForecast, CurrentWeather, ForecastItem } from '@/types/weather';

const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function get5DayForecast(
  city: string,
  apiKey: string,
  units: 'metric' | 'imperial' = 'metric'
): Promise<ForecastResponse> {
  const url = `${API_BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
    }
    if (response.status === 404) {
      throw new Error('City not found. Please check the city name.');
    }
    throw new Error(`Failed to fetch weather data: ${response.statusText}`);
  }
  
  return response.json();
}

export async function get5DayForecastByCoords(
  lat: number,
  lon: number,
  apiKey: string,
  units: 'metric' | 'imperial' = 'metric'
): Promise<ForecastResponse> {
  const url = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch weather data: ${response.statusText}`);
  }
  
  return response.json();
}

export function processForecastData(data: ForecastResponse): {
  current: CurrentWeather;
  daily: DailyForecast[];
} {
  const { list, city } = data;
  
  // Get current weather from first forecast item
  const currentItem = list[0];
  const current: CurrentWeather = {
    temp: Math.round(currentItem.main.temp),
    feels_like: Math.round(currentItem.main.feels_like),
    humidity: currentItem.main.humidity,
    windSpeed: currentItem.wind.speed,
    condition: currentItem.weather[0],
    city: city.name,
    country: city.country,
    sunrise: new Date(city.sunrise * 1000),
    sunset: new Date(city.sunset * 1000),
    timezone: city.timezone,
  };
  
  // Group forecast items by day
  const dailyMap = new Map<string, ForecastItem[]>();
  
  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, []);
    }
    dailyMap.get(dateKey)!.push(item);
  });
  
  // Process each day's data
  const daily: DailyForecast[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  dailyMap.forEach((items, dateKey) => {
    const date = new Date(dateKey);
    const temps = items.map((item) => item.main.temp);
    const humidities = items.map((item) => item.main.humidity);
    const windSpeeds = items.map((item) => item.wind.speed);
    const pops = items.map((item) => item.pop);
    const hourlyItems = [...items].sort((a, b) => a.dt - b.dt);
    
    // Get the most common weather condition (around midday if possible)
    const middayItem = items.find((item) => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 11 && hour <= 14;
    }) || items[Math.floor(items.length / 2)];
    
    daily.push({
      date,
      dayName: dayNames[date.getDay()],
      temp: {
        min: Math.round(Math.min(...temps)),
        max: Math.round(Math.max(...temps)),
        avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
      },
      humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
      windSpeed: Math.round((windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10) / 10,
      condition: middayItem.weather[0],
      pop: Math.round(Math.max(...pops) * 100),
      hourly: hourlyItems.map((item) => ({
        time: new Date(item.dt * 1000),
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 10) / 10,
        pop: Math.round(item.pop * 100),
        condition: item.weather[0],
      })),
    });
  });
  
  // Sort by date and take first 5 days
  daily.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return {
    current,
    daily: daily.slice(0, 5),
  };
}

export function getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

export function formatTemperature(temp: number, unit: 'metric' | 'imperial' = 'metric'): string {
  return `${temp}°${unit === 'metric' ? 'C' : 'F'}`;
}

export function formatWindSpeed(speed: number, unit: 'metric' | 'imperial' = 'metric'): string {
  return unit === 'metric' ? `${speed} m/s` : `${speed} mph`;
}

export function formatTime(date: Date, timeFormat: '12h' | '24h' = '12h'): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });
}

export function getLocalTime(timezoneOffset: number, date: Date = new Date()): Date {
  // timezoneOffset is in seconds from UTC
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + timezoneOffset * 1000);
}
