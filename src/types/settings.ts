export type TimeFormat = '12h' | '24h';

export type AppSettings = {
  unit: 'metric' | 'imperial';
  timeFormat: TimeFormat;
};

export const defaultSettings: AppSettings = {
  unit: 'metric',
  timeFormat: '12h',
};
