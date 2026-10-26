import { DEMO_PREDICTIONS } from '../mocks/sampleData';
import type { CrowdPrediction, PredictionHorizon } from '../types/crowd';

export function getPrediction(
  stationId: string,
  platformId: string,
  horizon: PredictionHorizon
): CrowdPrediction | undefined {
  return DEMO_PREDICTIONS.find(
    p => p.stationId === stationId && p.platformId === platformId && p.horizonMinutes === horizon
  );
}

export function getPredictionsByStation(stationId: string): CrowdPrediction[] {
  return DEMO_PREDICTIONS.filter(p => p.stationId === stationId);
}

export function getStationPlatformPredictions(
  stationId: string,
  platformId: string
): CrowdPrediction[] {
  return DEMO_PREDICTIONS.filter(
    p => p.stationId === stationId && p.platformId === platformId
  );
}

export function getAllPredictions(): CrowdPrediction[] {
  return DEMO_PREDICTIONS;
}

