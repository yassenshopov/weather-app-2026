import { cn } from '@/lib/utils';

interface WeatherIndicatorProps {
  conditionId: number;
  className?: string;
}

export function WeatherIndicator({ conditionId, className }: WeatherIndicatorProps) {
  const getColorClass = (id: number) => {
    // Thunderstorm
    if (id >= 200 && id < 300) return 'bg-purple-500';
    // Drizzle
    if (id >= 300 && id < 400) return 'bg-sky-400';
    // Rain
    if (id >= 500 && id < 600) return 'bg-blue-500';
    // Snow
    if (id >= 600 && id < 700) return 'bg-cyan-200';
    // Atmosphere
    if (id >= 700 && id < 800) return 'bg-slate-400';
    // Clear
    if (id === 800) return 'bg-yellow-400';
    // Clouds
    if (id > 800 && id < 900) return 'bg-gray-400';
    
    return 'bg-muted';
  };

  return (
    <div
      className={cn(
        'rounded-[30%]',
        getColorClass(conditionId),
        className
      )}
      aria-hidden="true"
    />
  );
}
