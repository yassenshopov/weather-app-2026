import { cn } from '@/lib/utils';

type Rgb = [number, number, number];

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

function getWeatherColor(conditionId: number): Rgb {
  if (conditionId >= 200 && conditionId < 300) {
    return [99, 102, 241]; // thunderstorm: indigo
  }
  if (conditionId >= 300 && conditionId < 500) {
    return [45, 212, 191]; // drizzle: teal
  }
  if (conditionId >= 500 && conditionId < 600) {
    return [59, 130, 246]; // rain: blue
  }
  if (conditionId >= 600 && conditionId < 700) {
    return [56, 189, 248]; // snow: icy blue
  }
  if (conditionId >= 700 && conditionId < 800) {
    return [148, 163, 184]; // atmosphere: slate
  }
  if (conditionId === 800) {
    return [250, 204, 21]; // clear: sunny
  }
  return [100, 116, 139]; // clouds: slate/gray
}

function getTemperatureColor(temp: number, unit: 'metric' | 'imperial' = 'metric'): Rgb {
  const thresholds =
    unit === 'metric'
      ? { cold: 0, cool: 10, mild: 20, warm: 28 }
      : { cold: 32, cool: 50, mild: 68, warm: 82 };

  if (temp <= thresholds.cold) {
    return [56, 189, 248]; // icy
  }
  if (temp <= thresholds.cool) {
    return [59, 130, 246]; // cool blue
  }
  if (temp <= thresholds.mild) {
    return [34, 197, 94]; // mild green
  }
  if (temp <= thresholds.warm) {
    return [250, 204, 21]; // warm yellow
  }
  return [249, 115, 22]; // hot orange
}

function getTimeOfDayColor(timeOfDay: TimeOfDay): Rgb {
  switch (timeOfDay) {
    case 'morning':
      return [251, 191, 36];
    case 'noon':
      return [56, 189, 248];
    case 'evening':
      return [251, 113, 133];
    case 'night':
    default:
      return [99, 102, 241];
  }
}

export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) {
    return 'morning';
  }
  if (hour >= 11 && hour < 16) {
    return 'noon';
  }
  if (hour >= 16 && hour < 20) {
    return 'evening';
  }
  return 'night';
}

function formatRgb([r, g, b]: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function blendColors(colors: Rgb[]): Rgb {
  const count = colors.length || 1;
  const [r, g, b] = colors.reduce(
    (acc, color) => [acc[0] + color[0], acc[1] + color[1], acc[2] + color[2]],
    [0, 0, 0]
  );
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

interface DayCardTintProps {
  conditionId: number;
  temperature: number;
  timeOfDay: TimeOfDay;
  unit?: 'metric' | 'imperial';
  className?: string;
}

export function DayCardTint({
  conditionId,
  temperature,
  timeOfDay,
  unit = 'metric',
  className,
}: DayCardTintProps) {
  const weatherColor = getWeatherColor(conditionId);
  const tempColor = getTemperatureColor(temperature, unit);
  const timeColor = getTimeOfDayColor(timeOfDay);
  const blendedColor = blendColors([weatherColor, tempColor, timeColor]);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 opacity-50', className)}
      style={{
        backgroundColor: formatRgb(blendedColor),
      }}
    />
  );
}
