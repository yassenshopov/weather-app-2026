import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  duration?: number;
  text?: string;
  onComplete?: () => void;
}

function LoadingOverlay({
  isVisible,
  duration = 1500,
  text = 'Fetching weather data...',
  onComplete,
}: LoadingOverlayProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-16 w-16 text-primary" />
        <p className="text-sm font-semibold text-foreground">{text}</p>
      </div>
    </div>
  );
}

export { LoadingOverlay };
