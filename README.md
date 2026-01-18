# Weather App 2026

A modern weather dashboard that shows current conditions, daily outlooks, and hourly drill-downs using the OpenWeather API.

## Setup

- Install dependencies: `npm install`
- Create a `.env.local` file in the project root (see API configuration below)

## Run locally

- Start the dev server: `npm run dev`
- Build for production: `npm run build`
- Preview the production build: `npm run preview`

## Run tests

- Run unit tests: `npm test`
- Watch mode: `npm run test:watch` (press `q` to quit)
- Run the lint checks: `npm run lint`

## API configuration

This app uses the OpenWeather API. You need an API key and a Vite env var.

1) Create a `.env.local` file in the project root.
2) Add the key:

```
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

3) Restart the dev server if it's already running.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- lucide-react icons
- OpenWeather API
