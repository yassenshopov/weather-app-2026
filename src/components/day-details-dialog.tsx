import { Droplets, Wind, CloudRain, ArrowUp, ArrowDown, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getWeatherIcon } from '@/components/weather-icon';
import { WeatherIndicator } from '@/components/weather-indicator';
import type { DailyForecast } from '@/types/weather';
import { formatTemperature, formatWindSpeed, formatTime, getLocalTime } from '@/utils/weather';

type DayDetailsDialogProps = {
  day: DailyForecast | null;
  unit: 'metric' | 'imperial';
  location: { city: string; country: string } | null;
  timezone: number | null;
  timeFormat: '12h' | '24h';
  onClose: () => void;
};

export function DayDetailsDialog({ day, unit, location, timezone, timeFormat, onClose }: DayDetailsDialogProps) {
  if (!day) {
    return null;
  }

  const formattedDate = day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const hourlyForecasts = day.hourly ?? [];
  const localNow = timezone !== null ? getLocalTime(timezone, new Date()) : new Date();
  const localDayDate = timezone !== null ? getLocalTime(timezone, day.date) : day.date;
  const isToday = localDayDate.toDateString() === localNow.toDateString();
  const firstForecastTime = hourlyForecasts[0]
    ? timezone !== null
      ? getLocalTime(timezone, hourlyForecasts[0].time)
      : hourlyForecasts[0].time
    : null;
  const isBeforeFirstForecast = firstForecastTime ? localNow < firstForecastTime : false;

  return (
    <Dialog open={!!day} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="flex min-h-[28rem] flex-col overflow-hidden p-8 sm:max-w-2xl md:max-w-3xl md:p-10 lg:min-h-[32rem]">
        <div className="relative flex flex-1 flex-col">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 top-0 -translate-y-1/4 text-primary opacity-50 sm:right-8 sm:top-1/3 sm:-translate-y-1/2"
          >
            <WeatherIndicator 
              conditionId={day.condition.id} 
              className="absolute left-1/2 top-1/2 -z-10 h-[12rem] w-[12rem] -translate-x-1/4 -translate-y-3/4 opacity-50 sm:h-[40rem] sm:w-[40rem]" 
            />
            {getWeatherIcon(day.condition.id, 'h-10 w-10 sm:h-48 sm:w-48')}
          </div>

          <div className="relative z-10 flex flex-1 flex-col">
            <DialogHeader>
              {location && (
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-heading text-sm font-medium">
                    {location.city}, {location.country}
                  </span>
                  <img
                    src={`https://flagcdn.com/w40/${location.country.toLowerCase()}.png`}
                    alt=""
                    className="h-3 w-auto rounded-[2px] shadow-sm"
                    aria-hidden="true"
                  />
                </div>
              )}
              <DialogTitle className="font-heading text-2xl sm:text-3xl mb-2">{formattedDate}</DialogTitle>
              <DialogDescription className="font-heading capitalize">
                {day.condition.description}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              <div className="inline-flex items-center gap-4 text-sm sm:text-base mb-3">
                <span className="inline-flex items-center gap-1 font-heading">
                  <ArrowUp className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-foreground">{formatTemperature(day.temp.max, unit)}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-heading">
                  <ArrowDown className="h-4 w-4 text-sky-500" />
                  <span className="font-semibold text-foreground">{formatTemperature(day.temp.min, unit)}</span>
                </span>
              </div>
              <p className="font-heading text-sm text-muted-foreground">
                Avg {formatTemperature(day.temp.avg, unit)}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="font-heading text-sm font-semibold text-foreground sm:text-base">Hourly details</h3>
              {hourlyForecasts.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Hourly details are unavailable for this day.</p>
              ) : (
                <div className="mt-3 max-h-72 overflow-y-auto overflow-x-auto pb-2 sm:max-h-none sm:overflow-y-visible">
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    {hourlyForecasts.map((hour, index) => {
                      const localTime = timezone !== null ? getLocalTime(timezone, hour.time) : hour.time;
                      const nextHour = hourlyForecasts[index + 1];
                      const localNextTime = nextHour
                        ? timezone !== null
                          ? getLocalTime(timezone, nextHour.time)
                          : nextHour.time
                        : null;
                      const isCurrentSlot = isToday
                        ? isBeforeFirstForecast
                          ? index === 0
                          : localNow >= localTime && (localNextTime ? localNow < localNextTime : true)
                        : false;
                      return (
                        <div
                          key={hour.time.toISOString()}
                          className={`w-full rounded-lg border p-2 sm:min-w-[8.5rem] sm:p-3 ${
                            isCurrentSlot ? 'border-primary/40 bg-primary/10' : 'border-muted/40 bg-muted/30'
                          }`}
                        >
                          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:gap-2">
                              <p className="font-heading text-sm font-semibold text-foreground">
                                {formatTime(localTime, timeFormat)}
                              </p>
                              <div className="text-primary">{getWeatherIcon(hour.condition.id, 'h-6 w-6')}</div>
                            </div>
                            <p className="text-xs capitalize text-muted-foreground">{hour.condition.description}</p>
                            <p className="font-heading text-sm font-semibold text-foreground">
                              {formatTemperature(hour.temp, unit)}
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1">
                                <Wind className="h-3.5 w-3.5 text-primary/70" />
                                {formatWindSpeed(hour.windSpeed, unit)}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Droplets className="h-3.5 w-3.5 text-primary/70" />
                                {hour.humidity}%
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CloudRain className="h-3.5 w-3.5 text-primary/70" />
                                {hour.pop}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
