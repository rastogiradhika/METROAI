import { DEMO_STATIONS, DEMO_ROUTES } from '../mocks/sampleData';
import type { Station, Route } from '../types/station';
import { apiGet } from './apiClient';

let _stations: Station[] = [...DEMO_STATIONS];

// Auto-sync stations from backend
apiGet<Station[]>('/stations')
  .then(data => {
    if (data && data.length > 0) {
      _stations = data;
    }
  })
  .catch(err => {
    console.debug('StationService: Using default station catalog:', err.message);
  });

export function getStations(): Station[] {
  return _stations;
}

export function getStationById(id: string): Station | undefined {
  return _stations.find(s => s.id === id);
}

export async function fetchStationsAsync(): Promise<Station[]> {
  try {
    const data = await apiGet<Station[]>('/stations');
    if (data && data.length > 0) {
      _stations = data;
    }
  } catch (err) {
    console.warn('Backend stations fetch failed:', err);
  }
  return _stations;
}

export function findRoute(sourceId: string, destId: string): Route | undefined {
  const forward = DEMO_ROUTES.find(
    r => r.sourceStationId === sourceId && r.destinationStationId === destId
  );
  if (forward) return forward as Route;

  // Try reverse
  const reverse = DEMO_ROUTES.find(
    r => r.sourceStationId === destId && r.destinationStationId === sourceId
  );
  if (reverse) {
    return {
      ...reverse,
      sourceStationId: sourceId,
      destinationStationId: destId,
      stationSequence: [...reverse.stationSequence].reverse(),
    } as Route;
  }
  return undefined;
}
