import { DEMO_OBSERVATIONS, DEMO_TREND_DATA } from '../mocks/sampleData';
import type { CrowdObservation, CrowdTrendPoint } from '../types/crowd';
import { apiGet } from './apiClient';

let _observations: CrowdObservation[] = [...DEMO_OBSERVATIONS];

// Auto-sync current observations across network
apiGet<CrowdObservation[]>('/crowd')
  .then(data => {
    if (data && data.length > 0) {
      _observations = data;
    }
  })
  .catch(err => {
    console.debug('CrowdService: Using default observations:', err.message);
  });

export function getObservationsByStation(stationId: string): CrowdObservation[] {
  return _observations.filter(o => o.stationId === stationId);
}

export function getObservationsByPlatform(stationId: string, platformId: string): CrowdObservation | undefined {
  return _observations.find(o => o.stationId === stationId && o.platformId === platformId);
}

export function getCrowdTrend(stationId: string, platformId: string): CrowdTrendPoint[] {
  const key = `${stationId}-${platformId}`;
  return DEMO_TREND_DATA[key] ?? [];
}

export function getAllCurrentObservations(): CrowdObservation[] {
  return _observations;
}

export async function fetchLivePlatformCrowd(stationId: string, platformId: string): Promise<CrowdObservation | undefined> {
  try {
    const res = await apiGet<{ observation: CrowdObservation | null; status: string }>(`/crowd/${stationId}/${platformId}/current`);
    if (res?.observation) {
      const idx = _observations.findIndex(o => o.stationId === stationId && o.platformId === platformId);
      if (idx >= 0) {
        _observations[idx] = res.observation;
      } else {
        _observations.push(res.observation);
      }
      return res.observation;
    }
  } catch (err) {
    console.warn(`Live crowd fetch failed for ${stationId}/${platformId}:`, err);
  }
  return getObservationsByPlatform(stationId, platformId);
}
