import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react';

// Map OpenWeatherMap condition codes to Lucide icons
export function getWeatherIcon(conditionId: number, className: string = 'h-8 w-8') {
  // Weather condition codes: https://openweathermap.org/weather-conditions
  if (conditionId >= 200 && conditionId < 300) {
    return <CloudLightning className={className} />;
  } else if (conditionId >= 300 && conditionId < 400) {
    return <CloudDrizzle className={className} />;
  } else if (conditionId >= 500 && conditionId < 600) {
    return <CloudRain className={className} />;
  } else if (conditionId >= 600 && conditionId < 700) {
    return <CloudSnow className={className} />;
  } else if (conditionId >= 700 && conditionId < 800) {
    return <CloudFog className={className} />;
  } else if (conditionId === 800) {
    return <Sun className={className} />;
  } else if (conditionId === 801) {
    return <CloudSun className={className} />;
  } else {
    return <Cloud className={className} />;
  }
}
