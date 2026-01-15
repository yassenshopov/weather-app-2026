import React, { useEffect, useState } from 'react';

interface SunArcProps {
  sunrise: Date;
  sunset: Date;
}

export const SunArc: React.FC<SunArcProps> = ({ sunrise, sunset }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const sunriseTime = sunrise.getTime();
  const sunsetTime = sunset.getTime();
  const nowTime = now.getTime();

  // Progress is 0 at sunrise, 1 at sunset
  const totalDaylight = sunsetTime - sunriseTime;
  const elapsed = nowTime - sunriseTime;
  const progress = Math.min(Math.max(elapsed / totalDaylight, 0), 1);

  const isDay = nowTime >= sunriseTime && nowTime <= sunsetTime;

  if (nowTime > sunsetTime) {
    return null;
  }

  const angle = 180 - (progress * 180);
  const rx = 40;
  const ry = 15;
  const centerX = 50;
  const centerY = 20; 
  
  const sunX = centerX + rx * Math.cos((angle * Math.PI) / 180);
  const sunY = centerY - ry * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-20 select-none">
      <svg
        viewBox="0 0 100 20"
        className="absolute bottom-0 left-1/2 w-[120%] -translate-x-1/2"
        preserveAspectRatio="xMidYMax meet"
      >
        
        {/* The Arc (Elliptical) */}
        <path
          d="M 10 20 A 40 15 0 0 1 90 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground/40"
        />

        {/* The Sun Icon (Simple Circle) */}
        {isDay && (
          <circle
            cx={sunX}
            cy={sunY}
            r="2"
            fill="currentColor"
            className="text-foreground"
          />
        )}
      </svg>
    </div>
  );
};
