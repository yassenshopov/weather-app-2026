import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTheme } from '@/components/theme-provider';
import type { Theme } from '@/components/theme-provider';
import type { AppSettings } from '@/types/settings';

type SettingsDialogProps = {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
};

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl">Settings</DialogTitle>
          <DialogDescription>Customize how the forecast is displayed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Appearance</p>
              <p className="text-xs text-muted-foreground">Switch between light, dark, or system theme.</p>
            </div>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }
                setTheme(value as Theme);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="light" aria-label="Light theme">
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Dark theme">
                Dark
              </ToggleGroupItem>
              <ToggleGroupItem value="system" aria-label="System theme">
                System
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Units</p>
              <p className="text-xs text-muted-foreground">Choose how temperatures and wind speed appear.</p>
            </div>
            <ToggleGroup
              type="single"
              value={settings.unit}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }
                updateSetting('unit', value as AppSettings['unit']);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="metric" aria-label="Metric units">
                Metric (°C, m/s)
              </ToggleGroupItem>
              <ToggleGroupItem value="imperial" aria-label="Imperial units">
                Imperial (°F, mph)
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Time format</p>
              <p className="text-xs text-muted-foreground">Controls sunrise and sunset times.</p>
            </div>
            <ToggleGroup
              type="single"
              value={settings.timeFormat}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }
                updateSetting('timeFormat', value as AppSettings['timeFormat']);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="12h" aria-label="12-hour time">
                12-hour
              </ToggleGroupItem>
              <ToggleGroupItem value="24h" aria-label="24-hour time">
                24-hour
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
