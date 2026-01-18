import { describe, expect, it, beforeEach } from 'vitest';
import { defaultSettings } from '@/types/settings';
import { readSettingsCookie, writeSettingsCookie } from '@/utils/settings';

const clearSettingsCookie = () => {
  document.cookie = 'weather-app-settings=; max-age=0; path=/';
};

describe('settings cookie helpers', () => {
  beforeEach(() => {
    clearSettingsCookie();
  });

  it('returns null when no cookie exists', () => {
    expect(readSettingsCookie()).toBeNull();
  });

  it('persists and reads settings', () => {
    writeSettingsCookie({ unit: 'imperial', timeFormat: '24h' });
    const settings = readSettingsCookie();

    expect(settings).toEqual({ unit: 'imperial', timeFormat: '24h' });
  });

  it('falls back to defaults for invalid values', () => {
    const payload = encodeURIComponent(JSON.stringify({ unit: 'kelvin', timeFormat: 'am' }));
    document.cookie = `weather-app-settings=${payload}; path=/`;

    expect(readSettingsCookie()).toEqual(defaultSettings);
  });

  it('returns null for invalid JSON', () => {
    document.cookie = 'weather-app-settings=%E0%A4%A; path=/';

    expect(readSettingsCookie()).toBeNull();
  });
});
