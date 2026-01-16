import { Droplets, Wind, CloudRain, ArrowUp, ArrowDown, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getWeatherIcon } from '@/components/weather-icon';
import { WeatherIndicator } from '@/components/weather-indicator';
import type { DailyForecast } from '@/types/weather';
import { formatTemperature, formatWindSpeed } from '@/utils/weather';

type DayDetailsDialogProps = {
  day: DailyForecast | null;
  unit: 'metric' | 'imperial';
  location: { city: string; country: string } | null;
  onClose: () => void;
};

export function DayDetailsDialog({ day, unit, location, onClose }: DayDetailsDialogProps) {
  if (!day) {
    return null;
  }

  const formattedDate = day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

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

            <div className="mt-auto grid grid-cols-3 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 sm:gap-3 sm:p-4">
                <Droplets className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Humidity</p>
                  <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{day.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 sm:gap-3 sm:p-4">
                <Wind className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Wind</p>
                  <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{formatWindSpeed(day.windSpeed, unit)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 sm:gap-3 sm:p-4">
                <CloudRain className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Rain</p>
                  <p className="font-heading text-sm font-semibold text-foreground sm:text-base">{day.pop}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
