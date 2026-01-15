import { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  MapPin,
  Search,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  CloudSun,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { LoadingOverlay } from '@/components/loading-overlay';
import {
  get5DayForecast,
  processForecastData,
  formatTemperature,
  formatWindSpeed,
  formatTime,
} from '@/utils/weather';
import type { CurrentWeather, DailyForecast } from '@/types/weather';

// Map OpenWeatherMap condition codes to Lucide icons
function getWeatherIcon(conditionId: number, className: string = 'h-8 w-8') {
  // Weather condition codes: https://openweathermap.org/weather-conditions
  if (conditionId >= 200 && conditionId < 300) {
    return <CloudLightning className={className} />;
  } else if (conditionId >= 300 && conditionId < 400) {
    return <CloudDrizzle className={className} />;
  } else if (conditionId >= 500 && conditionId < 600) {
    return <CloudRain className={className} />;
  } else if (conditionId >= 600 && conditionId < 700) {
    return <CloudSnow className={className} />;
  } else if (conditionId >= 700 && conditionId < 800) {
    return <CloudFog className={className} />;
  } else if (conditionId === 800) {
    return <Sun className={className} />;
  } else if (conditionId === 801) {
    return <CloudSun className={className} />;
  } else {
    return <Cloud className={className} />;
  }
}

const STORAGE_KEY = 'weather-app-city';

function App() {
  const [city, setCity] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'London';
  });
  const [searchInput, setSearchInput] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'London';
  });
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit] = useState<'metric' | 'imperial'>('metric');
  const [showOverlay, setShowOverlay] = useState(false);

  // Replace with your OpenWeatherMap API key
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'YOUR_API_KEY_HERE';

  const fetchWeather = useCallback(async (cityName: string, isLocationChange: boolean = false) => {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      setError('Please set your OpenWeatherMap API key in the VITE_OPENWEATHER_API_KEY environment variable.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Show overlay only on location change, not initial load
    if (isLocationChange) {
      setShowOverlay(true);
    }

    try {
      const data = await get5DayForecast(cityName, API_KEY, unit);
      const processed = processForecastData(data);
      setCurrent(processed.current);
      setDaily(processed.daily);
      setCity(cityName);
      localStorage.setItem(STORAGE_KEY, cityName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setShowOverlay(false);
    } finally {
      setLoading(false);
    }
  }, [API_KEY, unit]);

  useEffect(() => {
    fetchWeather(city, false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && searchInput.trim().toLowerCase() !== city.toLowerCase()) {
      fetchWeather(searchInput.trim(), true);
    }
  };

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
  }, []);

  const today = daily[0];
  const upcomingDays = daily.slice(1);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <LoadingOverlay
        isVisible={showOverlay}
        duration={1500}
        text="Updating weather for new location..."
        onComplete={handleOverlayComplete}
      />
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header with Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-foreground">Weather Forecast</h1>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search city..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 sm:w-64"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>
            <ModeToggle />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {/* Weather Content */}
        {!loading && !error && current && today && (
          <>
            {/* Main Today Card - 16:9 Aspect Ratio */}
            <Card className="overflow-hidden border bg-card">
              <div className="aspect-video p-6 md:p-8">
                <div className="flex h-full flex-col justify-between">
                  {/* Top Section */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                        <span className="text-lg font-medium">
                          {current.city}, {current.country}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">Today, {today.dayName}</p>
                    </div>
                    <div className="text-primary">
                      {getWeatherIcon(current.condition.id, 'h-16 w-16 md:h-24 md:w-24')}
                    </div>
                  </div>

                  {/* Middle Section - Temperature */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-7xl font-light text-foreground md:text-9xl">
                        {formatTemperature(current.temp, unit)}
                      </div>
                      <p className="mt-2 text-xl capitalize text-muted-foreground md:text-2xl">
                        {current.condition.description}
                      </p>
                    </div>
                    <div className="hidden space-y-3 text-right md:block">
                      <div className="flex items-center justify-end gap-2 text-foreground">
                        <Thermometer className="h-5 w-5 text-muted-foreground" />
                        <span>Feels like {formatTemperature(current.feels_like, unit)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-muted-foreground">
                          H: {formatTemperature(today.temp.max, unit)} / L:{' '}
                          {formatTemperature(today.temp.min, unit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Stats */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                      <Wind className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Wind</p>
                        <p className="font-semibold text-foreground">{formatWindSpeed(current.windSpeed, unit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                      <Droplets className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Humidity</p>
                        <p className="font-semibold text-foreground">{current.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                      <Sunrise className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sunrise</p>
                        <p className="font-semibold text-foreground">{formatTime(current.sunrise)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                      <Sunset className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sunset</p>
                        <p className="font-semibold text-foreground">{formatTime(current.sunset)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Days */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {upcomingDays.map((day) => (
                <Card
                  key={day.date.toISOString()}
                  className="border bg-card transition-colors hover:bg-accent"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-lg font-medium text-foreground">
                      {day.dayName}
                    </CardTitle>
                    <p className="text-center text-sm text-muted-foreground">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center text-primary">
                      {getWeatherIcon(day.condition.id, 'h-12 w-12')}
                    </div>
                    <p className="text-center text-sm capitalize text-muted-foreground">
                      {day.condition.description}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-semibold text-foreground">
                        {formatTemperature(day.temp.max, unit)}
                      </span>
                      <span className="text-lg text-muted-foreground">
                        {formatTemperature(day.temp.min, unit)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Droplets className="h-3 w-3" />
                        <span>{day.humidity}%</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Wind className="h-3 w-3" />
                        <span>{day.windSpeed} m/s</span>
                      </div>
                    </div>
                    {day.pop > 0 && (
                      <div className="flex items-center justify-center gap-1 text-xs text-primary">
                        <CloudRain className="h-3 w-3" />
                        <span>{day.pop}% chance of rain</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default App;
