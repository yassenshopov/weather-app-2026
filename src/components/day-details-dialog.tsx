import { Droplets, Wind, CloudRain } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getWeatherIcon } from '@/components/weather-icon';
import type { DailyForecast } from '@/types/weather';
import { formatTemperature, formatWindSpeed } from '@/utils/weather';

type DayDetailsDialogProps = {
  day: DailyForecast | null;
  unit: 'metric' | 'imperial';
  onClose: () => void;
};

export function DayDetailsDialog({ day, unit, onClose }: DayDetailsDialogProps) {
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
      <DialogContent className="overflow-hidden p-8 sm:max-w-2xl md:max-w-3xl md:p-10 lg:min-h-[32rem]">
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 translate-x-6 text-primary opacity-10"
          >
            {getWeatherIcon(day.condition.id, 'h-56 w-56 sm:h-64 sm:w-64')}
          </div>

          <div className="relative z-10">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl sm:text-3xl mb-8">{formattedDate}</DialogTitle>
            <DialogDescription className="font-heading capitalize">
              {day.condition.description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">High / Low / Avg</p>
              <p className="font-heading text-2xl font-semibold text-foreground">
                {formatTemperature(day.temp.max, unit)} / {formatTemperature(day.temp.min, unit)}
              </p>
              <p className="font-heading text-sm text-muted-foreground">
                Avg {formatTemperature(day.temp.avg, unit)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="font-heading text-sm font-semibold text-foreground">{day.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Wind</p>
                <p className="font-heading text-sm font-semibold text-foreground">{formatWindSpeed(day.windSpeed, unit)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Chance of rain</p>
                <p className="font-heading text-sm font-semibold text-foreground">{day.pop}%</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
