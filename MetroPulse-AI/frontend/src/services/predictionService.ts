import { DEMO_PREDICTIONS } from '../mocks/sampleData';
import type { CrowdPrediction, PredictionHorizon } from '../types/crowd';
import { apiGet } from './apiClient';

let _predictions: CrowdPrediction[] = [...DEMO_PREDICTIONS];

export function getPrediction(
  stationId: string,
  platformId: string,
  horizon: PredictionHorizon
): CrowdPrediction | undefined {
  return _predictions.find(
    p => p.stationId === stationId && p.platformId === platformId && p.horizonMinutes === horizon
  );
}

export function getPredictionsByStation(stationId: string): CrowdPrediction[] {
  return _predictions.filter(p => p.stationId === stationId);
}

export function getStationPlatformPredictions(
  stationId: string,
  platformId: string
): CrowdPrediction[] {
  return _predictions.filter(
    p => p.stationId === stationId && p.platformId === platformId
  );
}

export function getAllPredictions(): CrowdPrediction[] {
  return _predictions;
}

export async function fetchLivePredictions(
  stationId: string,
  platformId: string
): Promise<CrowdPrediction[]> {
  try {
    const res = await apiGet<{ predictions: CrowdPrediction[]; overallStatus: string }>(`/predictions/${stationId}/${platformId}`);
    if (res?.predictions && res.predictions.length > 0) {
      // Update local cache
      _predictions = [
        ..._predictions.filter(p => !(p.stationId === stationId && p.platformId === platformId)),
        ...res.predictions
      ];
      return res.predictions;
    }
  } catch (err) {
    console.warn(`Live predictions fetch failed for ${stationId}/${platformId}:`, err);
  }
  return getStationPlatformPredictions(stationId, platformId);
}
