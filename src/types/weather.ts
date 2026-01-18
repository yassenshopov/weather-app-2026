export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MainWeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level?: number;
  grnd_level?: number;
}

export interface WindData {
  speed: number;
  deg: number;
  gust?: number;
}

export interface CloudsData {
  all: number;
}

export interface ForecastItem {
  dt: number;
  main: MainWeatherData;
  weather: WeatherCondition[];
  clouds: CloudsData;
  wind: WindData;
  visibility: number;
  pop: number; // Probability of precipitation
  dt_txt: string;
}

export interface City {
  id: number;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

export interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: City;
}

export interface HourlyForecast {
  time: Date;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pop: number;
  condition: WeatherCondition;
}

export interface DailyForecast {
  date: Date;
  dayName: string;
  temp: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  pop: number; // Max probability of precipitation for the day
  hourly: HourlyForecast[];
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  city: string;
  country: string;
  sunrise: Date;
  sunset: Date;
  timezone: number;
}
