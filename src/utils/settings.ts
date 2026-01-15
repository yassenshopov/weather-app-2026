import { defaultSettings, type AppSettings, type TimeFormat } from '@/types/settings';

const SETTINGS_COOKIE = 'weather-app-settings';
const SETTINGS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const isValidUnit = (value: unknown): value is AppSettings['unit'] =>
  value === 'metric' || value === 'imperial';

const isValidTimeFormat = (value: unknown): value is TimeFormat =>
  value === '12h' || value === '24h';

const normalizeSettings = (value: Partial<AppSettings>): AppSettings => ({
  unit: isValidUnit(value.unit) ? value.unit : defaultSettings.unit,
  timeFormat: isValidTimeFormat(value.timeFormat) ? value.timeFormat : defaultSettings.timeFormat,
});

export function readSettingsCookie(): AppSettings | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${SETTINGS_COOKIE}=`));

  if (!cookie) {
    return null;
  }

  const rawValue = cookie.slice(`${SETTINGS_COOKIE}=`.length);

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as Partial<AppSettings>;
    return normalizeSettings(parsed);
  } catch {
    return null;
  }
}

export function writeSettingsCookie(settings: AppSettings): void {
  if (typeof document === 'undefined') {
    return;
  }

  const serialized = encodeURIComponent(JSON.stringify(settings));
  document.cookie = `${SETTINGS_COOKIE}=${serialized}; path=/; max-age=${SETTINGS_COOKIE_MAX_AGE}; samesite=lax`;
}
