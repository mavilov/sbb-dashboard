export interface Connection {
  stop: {
    departure: string;
    delay: number | null;
    platform: string;
  };
  to: string;
  category: string;
  number: string;
  operator: string;
}

export interface StationBoard {
  station: {
    id: string;
    name: string;
  };
  stationboard: Connection[];
}

const API_BASE = "https://transport.opendata.ch/v1/stationboard";

export async function getStationBoard(
  stationName: string,
  limit: number = 10
): Promise<StationBoard> {
  const url = `${API_BASE}?station=${encodeURIComponent(
    stationName
  )}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch timetable for ${stationName}`);
  }
  return response.json();
}
