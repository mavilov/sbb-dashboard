# SBB Timetable Dashboard

This application displays a timetable dashboard for up to 4 SBB stations, designed in the original SBB UI style.

## Features

- Displays departures for 4 configurable stations.
- Highlights delays in red.
- Auto-refreshes every 5 minutes.
- Language support: English and German.
- Uses `transport.opendata.ch` (Swiss Public Transport API) as the public data source.

## Setup & Run

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run locally:**

   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Configuration

On first launch, you will be prompted to select your language and enter the names of 4 stations (e.g., "Zürich HB", "Bern"). To change these later, click the settings icon (⚙️) in the header.

## Tech Stack

- Vite + Vanilla TypeScript
- CSS (SBB Style)
- Node.js environment
