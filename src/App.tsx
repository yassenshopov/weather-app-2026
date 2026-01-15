import { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudOff,
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
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { LoadingOverlay } from '@/components/loading-overlay';
import { DayDetailsDialog } from '@/components/day-details-dialog';
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
  const [selectedDay, setSelectedDay] = useState<DailyForecast | null>(null);

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
      setSelectedDay(null);
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
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Weather Forecast</h1>
            <div className="sm:hidden">
              <ModeToggle />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search city..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 sm:w-64"
                />
              </div>
              <Button type="submit" disabled={loading} size="default">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>
            <div className="hidden sm:block">
              <ModeToggle />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <Empty className="py-16 md:py-24">
            <EmptyHeader>
              <EmptyMedia>
                <CloudOff className="h-16 w-16 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Unable to find weather data</EmptyTitle>
              <EmptyDescription>
                {error.includes('city not found') || error.includes('404')
                  ? `We couldn't find a city matching "${searchInput}". Please check the spelling and try again.`
                  : error}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput(city);
                  setError(null);
                }}
              >
                Go back to "{city}"
              </Button>
            </EmptyContent>
          </Empty>
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
            {/* Main Today Card */}
            <Card
              className="cursor-pointer overflow-hidden border bg-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDay(today)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedDay(today);
                }
              }}
            >
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Top Section */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-heading text-base font-medium sm:text-lg">
                          {current.city}, {current.country}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground sm:text-base">Today, {today.dayName}</p>
                    </div>
                    <div className="text-primary">
                      {getWeatherIcon(current.condition.id, 'h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24')}
                    </div>
                  </div>

                  {/* Middle Section - Temperature */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-heading text-5xl font-light text-foreground sm:text-7xl md:text-9xl">
                        {formatTemperature(current.temp, unit)}
                      </div>
                      <p className="font-heading mt-1 text-lg capitalize text-muted-foreground sm:mt-2 sm:text-xl md:text-2xl">
                        {current.condition.description}
                      </p>
                    </div>
                    {/* Mobile: Show inline, Desktop: Show on right */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm sm:hidden">
                      <div className="flex items-center gap-1 text-foreground">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <span className="font-heading">Feels like {formatTemperature(current.feels_like, unit)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-heading text-muted-foreground">
                          H: {formatTemperature(today.temp.max, unit)} / L: {formatTemperature(today.temp.min, unit)}
                        </span>
                      </div>
                    </div>
                    <div className="hidden space-y-3 text-right sm:block">
                      <div className="flex items-center justify-end gap-2 text-foreground">
                        <Thermometer className="h-5 w-5 text-muted-foreground" />
                        <span className="font-heading">Feels like {formatTemperature(current.feels_like, unit)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-heading text-sm text-muted-foreground">
                          H: {formatTemperature(today.temp.max, unit)} / L:{' '}
                          {formatTemperature(today.temp.min, unit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Wind className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Wind</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{formatWindSpeed(current.windSpeed, unit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Droplets className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Humidity</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{current.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Sunrise className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Sunrise</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{formatTime(current.sunrise)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Sunset className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Sunset</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{formatTime(current.sunset)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Days */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
              {upcomingDays.map((day) => (
                <Card
                  key={day.date.toISOString()}
                  className="cursor-pointer border bg-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDay(day)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedDay(day);
                    }
                  }}
                >
                  <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                    <CardTitle className="font-heading text-center text-base font-medium text-foreground sm:text-lg">
                      {day.dayName}
                    </CardTitle>
                    <p className="font-heading text-center text-xs text-muted-foreground sm:text-sm">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
                    <div className="flex justify-center text-primary">
                      {getWeatherIcon(day.condition.id, 'h-8 w-8 sm:h-12 sm:w-12')}
                    </div>
                    <p className="font-heading line-clamp-1 text-center text-xs capitalize text-muted-foreground sm:text-sm">
                      {day.condition.description}
                    </p>
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <span className="font-heading text-lg font-semibold text-foreground sm:text-2xl">
                        {formatTemperature(day.temp.max, unit)}
                      </span>
                      <span className="font-heading text-sm text-muted-foreground sm:text-lg">
                        {formatTemperature(day.temp.min, unit)}
                      </span>
                    </div>
                    <div className="flex justify-center gap-2 text-[10px] text-muted-foreground sm:grid sm:grid-cols-2 sm:gap-2 sm:text-xs">
                      <div className="flex items-center justify-center gap-1">
                        <Droplets className="h-3 w-3" />
                        <span className="font-heading">{day.humidity}%</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Wind className="h-3 w-3" />
                        <span className="font-heading">{day.windSpeed} m/s</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-primary sm:text-xs">
                      <CloudRain className="h-3 w-3" />
                      <span className="font-heading">{day.pop}% rain</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <DayDetailsDialog
          day={selectedDay}
          unit={unit}
          onClose={() => setSelectedDay(null)}
        />
      </div>
    </div>
  );
}

export default App;
