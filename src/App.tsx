import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CloudOff,
  CloudRain,
  Droplets,
  MapPin,
  Search,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  Loader2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeToggle } from '@/components/mode-toggle';
import { SettingsDialog } from '@/components/settings-dialog';
import { LoadingOverlay } from '@/components/loading-overlay';
import { DayDetailsDialog } from '@/components/day-details-dialog';
import { getWeatherIcon } from '@/components/weather-icon';
import { WeatherIndicator } from '@/components/weather-indicator';
import Footer from '@/components/footer';
import { SunArc } from '@/components/sun-arc';
import { defaultSettings, type AppSettings } from '@/types/settings';
import {
  get5DayForecast,
  get5DayForecastByCoords,
  processForecastData,
  formatTemperature,
  formatWindSpeed,
  formatTime,
  getLocalTime,
} from '@/utils/weather';
import { readSettingsCookie, writeSettingsCookie } from '@/utils/settings';
import type { CurrentWeather, DailyForecast } from '@/types/weather';

const STORAGE_KEY = 'weather-app-city';
const RECENT_CITIES_KEY = 'weather-app-recent-cities';
const RECENT_CITY_LIMIT = 5;

type RecentCity = {
  city: string;
  country: string;
};

const readRecentCities = (): RecentCity[] => {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(RECENT_CITIES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        if (typeof item === 'string') {
          return { city: item, country: '' };
        }
        if (item && typeof item === 'object') {
          const maybeCity = typeof item.city === 'string' ? item.city : '';
          const maybeCountry = typeof item.country === 'string' ? item.country : '';
          if (!maybeCity) {
            return null;
          }
          return { city: maybeCity, country: maybeCountry };
        }
        return null;
      })
      .filter((item): item is RecentCity => Boolean(item?.city));
  } catch {
    return [];
  }
};

const writeRecentCities = (cities: RecentCity[]) => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(cities));
};

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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimeoutRef = useRef<number | null>(null);
  const didInitLocationRef = useRef(false);
  const [isLocating, setIsLocating] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => readSettingsCookie() ?? defaultSettings);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DailyForecast | null>(null);
  const [now, setNow] = useState(new Date());
  const [recentCities, setRecentCities] = useState<RecentCity[]>(() => readRecentCities());

  // Update current time every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  const prevUnitRef = useRef(settings.unit);

  const unit = settings.unit;

  // Replace with your OpenWeatherMap API key
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'YOUR_API_KEY_HERE';

  const addRecentCity = useCallback((cityName: string, country: string) => {
    const normalized = cityName.trim();
    if (!normalized) {
      return;
    }
    setRecentCities((prev) => {
      const next = [
        { city: normalized, country },
        ...prev.filter((item) => item.city.toLowerCase() !== normalized.toLowerCase()),
      ].slice(0, RECENT_CITY_LIMIT);
      writeRecentCities(next);
      return next;
    });
  }, []);

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
      const resolvedCity = processed.current.city || cityName;
      const resolvedCountry = processed.current.country || '';
      setCurrent(processed.current);
      setDaily(processed.daily);
      setSelectedDay(null);
      setCity(resolvedCity);
      setSearchInput(resolvedCity);
      localStorage.setItem(STORAGE_KEY, resolvedCity);
      addRecentCity(resolvedCity, resolvedCountry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setShowOverlay(false);
    } finally {
      setLoading(false);
    }
  }, [API_KEY, unit, addRecentCity]);

  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number) => {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      setError('Please set your OpenWeatherMap API key in the VITE_OPENWEATHER_API_KEY environment variable.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLocationError(null);
    setShowOverlay(true);

    try {
      const data = await get5DayForecastByCoords(lat, lon, API_KEY, unit);
      const processed = processForecastData(data);
      const resolvedCity = processed.current.city;
      const resolvedCountry = processed.current.country || '';
      setCurrent(processed.current);
      setDaily(processed.daily);
      setSelectedDay(null);
      setCity(resolvedCity);
      setSearchInput(resolvedCity);
      localStorage.setItem(STORAGE_KEY, resolvedCity);
      addRecentCity(resolvedCity, resolvedCountry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setShowOverlay(false);
    } finally {
      setLoading(false);
    }
  }, [API_KEY, unit, addRecentCity]);

  const requestLocation = useCallback((fallbackCityName?: string) => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      if (fallbackCityName) {
        fetchWeather(fallbackCityName, false);
      }
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
          } catch (err) {
            if (fallbackCityName) {
              await fetchWeather(fallbackCityName, false);
            } else {
              setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
            }
          } finally {
            setIsLocating(false);
          }
        })();
      },
      (geoError) => {
        setIsLocating(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setLocationError('Location access was denied. Allow permission to use your current location.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setLocationError('Unable to determine your location. Please try again.');
            break;
          case geoError.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('Unable to access your location.');
        }
        if (fallbackCityName) {
          fetchWeather(fallbackCityName, false);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [fetchWeather, fetchWeatherByCoords]);

  useEffect(() => {
    if (didInitLocationRef.current) {
      return;
    }
    didInitLocationRef.current = true;

    requestLocation(city);
  }, [requestLocation, city]);

  useEffect(() => {
    writeSettingsCookie(settings);
  }, [settings]);

  useEffect(() => {
    if (prevUnitRef.current === settings.unit) {
      return;
    }
    prevUnitRef.current = settings.unit;
    fetchWeather(city, false);
  }, [settings.unit, fetchWeather, city]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = searchInput.trim();

    if (!trimmedInput) {
      setSearchError('Please enter a city name.');
      setIsShaking(true);
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
      shakeTimeoutRef.current = window.setTimeout(() => {
        setIsShaking(false);
      }, 450);
      return;
    }

    setSearchError(null);

    fetchWeather(trimmedInput, true);
  };

  const handleUseLocation = () => {
    requestLocation();
  };

  const handleOverlayComplete = useCallback(() => {
    setShowOverlay(false);
  }, []);

  const today = daily[0];
  const upcomingDays = daily.slice(1);

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 md:p-8">
      <LoadingOverlay
        isVisible={showOverlay}
        duration={1500}
        text="Loading..."
        onComplete={handleOverlayComplete}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-6">
        {/* Header with Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">5-Day Weather Forecast</h1>
            <div className="sm:hidden">
              <SettingsDialog settings={settings} onSettingsChange={setSettings} />
            </div>
          </div>
          <div className="flex items-start gap-2 pt-4">
            <div className="flex flex-1 flex-col gap-1">
              <form onSubmit={handleSearch} className="flex flex-1 flex-wrap items-start gap-2">
                <div className="flex min-w-[220px] flex-1 flex-col">
                  <div className={`relative ${isShaking ? 'animate-input-shake' : ''}`}>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search city..."
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        if (searchError) {
                          setSearchError(null);
                        }
                      }}
                      className="w-full pl-9 pr-10 sm:w-64"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 gap-0.5"
                          disabled={recentCities.length === 0}
                          aria-label="Recent searches"
                        >
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-xs">Recent searches</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {recentCities.length === 0 ? (
                          <DropdownMenuItem disabled>No recent searches</DropdownMenuItem>
                        ) : (
                          recentCities.map((recentCity) => (
                            <DropdownMenuItem
                              key={`${recentCity.city}-${recentCity.country}`}
                              onSelect={() => {
                                const query = recentCity.country
                                  ? `${recentCity.city}, ${recentCity.country}`
                                  : recentCity.city;
                                setSearchInput(query);
                                setSearchError(null);
                                fetchWeather(query, true);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                {recentCity.country ? (
                                  <img
                                    src={`https://flagcdn.com/w40/${recentCity.country.toLowerCase()}.png`}
                                    alt=""
                                    className="h-3 w-auto rounded-[2px] shadow-sm"
                                  />
                                ) : null}
                                <span>
                                  {recentCity.city}
                                  {recentCity.country ? `, ${recentCity.country}` : ''}
                                </span>
                              </span>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-1 min-h-4 text-xs text-destructive">
                    {searchError ?? ''}
                  </p>
                </div>
                <Button type="submit" disabled={loading || isLocating} size="default">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseLocation}
                  disabled={loading || isLocating}
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Use my location
                    </span>
                  )}
                </Button>
              </form>
              <p className="min-h-4 text-xs text-destructive">
                {locationError ?? ''}
              </p>
            </div>
            <div className="hidden sm:block pt-0">
              <div className="flex items-center gap-2">
                <ModeToggle />
                <SettingsDialog settings={settings} onSettingsChange={setSettings} />
              </div>
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
              className="group relative cursor-pointer overflow-hidden bg-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              {now <= current.sunset && (
                <SunArc sunrise={current.sunrise} sunset={current.sunset} />
              )}
              <div className="relative z-10 p-4 sm:p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Top Section */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-heading flex items-center gap-2 text-base font-medium sm:text-lg">
                          {current.city}, {current.country}
                          <img
                            src={`https://flagcdn.com/w40/${current.country.toLowerCase()}.png`}
                            alt=""
                            className="h-3 w-auto rounded-[2px] shadow-sm sm:h-4"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="font-heading text-sm font-medium sm:text-base">
                          {formatTime(getLocalTime(current.timezone, now), settings.timeFormat)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground sm:text-base">Today, {today.dayName}</p>
                    </div>
                    <div className="relative text-primary">
                      <WeatherIndicator
                        conditionId={today.condition.id}
                        className="absolute left-1/4 top-3/4 -z-10 h-32 w-32 -translate-x-1/4 -translate-y-3/4 opacity-50 transition-all group-hover:opacity-40 sm:h-48 sm:w-48 md:h-64 md:w-64"
                      />
                      {getWeatherIcon(today.condition.id, 'h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24')}
                    </div>
                  </div>

                  {/* Middle Section - Temperature */}
                  <div className="flex flex-col gap-3">
                    <div className="inline-flex self-start items-center gap-3 text-sm sm:text-base">
                      <span className="inline-flex items-center gap-1 font-heading">
                        <ArrowUp className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold text-foreground">{formatTemperature(today.temp.max, unit)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-heading">
                        <ArrowDown className="h-4 w-4 text-sky-500" />
                        <span className="font-semibold text-foreground">{formatTemperature(today.temp.min, unit)}</span>
                      </span>
                    </div>
                    <div className="font-heading text-5xl font-light text-foreground sm:text-7xl md:text-9xl">
                      {formatTemperature(current.temp, unit)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
                      <Thermometer className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-heading">Feels like {formatTemperature(current.feels_like, unit)}</span>
                    </div>
                    <p className="font-heading text-lg capitalize text-muted-foreground sm:text-xl md:text-2xl">
                      {today.condition.description}
                    </p>
                  </div>

                  {/* Bottom Section - Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-lg border-0 bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Wind className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Wind</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{formatWindSpeed(current.windSpeed, unit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border-0 bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Droplets className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Humidity</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{current.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border-0 bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Sunrise className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Sunrise</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">
                          {formatTime(getLocalTime(current.timezone, current.sunrise), settings.timeFormat)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border-0 bg-muted/50 p-2 sm:gap-3 sm:p-3">
                      <Sunset className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      <div>
                        <p className="text-xs text-muted-foreground sm:text-sm">Sunset</p>
                        <p className="font-heading text-sm font-semibold text-foreground sm:text-base">
                          {formatTime(getLocalTime(current.timezone, current.sunset), settings.timeFormat)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Days */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {upcomingDays.map((day) => (
                <Card
                  key={day.date.toISOString()}
                  className="group relative cursor-pointer overflow-hidden bg-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <div className="relative z-10 flex h-full flex-col p-4 sm:p-6">
                    {/* Header: Day and Date + Icon */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground">
                          {day.dayName}
                        </h3>
                        <p className="font-heading text-xs text-muted-foreground">
                          {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="relative text-primary">
                        <WeatherIndicator 
                          conditionId={day.condition.id} 
                          className="absolute left-2/3 top-1/4 -z-10 h-24 w-24 -translate-x-1/2 -translate-y-[50%] opacity-50 transition-all group-hover:opacity-40 sm:h-32 sm:w-32" 
                        />
                        {getWeatherIcon(day.condition.id, 'h-10 w-10 sm:h-12 sm:w-12')}
                      </div>
                    </div>

                    {/* Middle: Temperatures and Description */}
                    <div className="mt-4 flex flex-1 flex-col justify-center">
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                          {formatTemperature(day.temp.max, unit)}
                        </span>
                        <span className="font-heading text-sm text-muted-foreground sm:text-base">
                          {formatTemperature(day.temp.min, unit)}
                        </span>
                      </div>
                      <p className="mt-1 font-heading text-sm capitalize text-muted-foreground line-clamp-1">
                        {day.condition.description}
                      </p>
                    </div>

                    {/* Bottom: Detailed Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-primary/70" />
                        <span className="font-heading">{day.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wind className="h-3.5 w-3.5 text-primary/70" />
                        <span className="font-heading text-[10px] sm:text-xs">{formatWindSpeed(day.windSpeed, unit)}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-primary">
                        <CloudRain className="h-3.5 w-3.5" />
                        <span className="font-heading font-medium">{day.pop}% precipitation</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <DayDetailsDialog
          day={selectedDay}
          unit={unit}
          location={current ? { city: current.city, country: current.country } : null}
          timezone={current ? current.timezone : null}
          timeFormat={settings.timeFormat}
          onClose={() => setSelectedDay(null)}
        />
      </div>
      <Footer />
    </div>
  );
}

export default App;
