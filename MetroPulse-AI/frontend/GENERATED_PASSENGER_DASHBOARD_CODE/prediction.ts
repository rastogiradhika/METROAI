export type PredictionHorizon = 5 | 10 | 15;

export interface PredictionRecord {
  stationId: string;
  platformId: string;
  horizon: PredictionHorizon;
  generatedAt: string;
  forecastAt: string;
  predictedCount: number | null;
  predictedLevel: import('./crowd').CrowdLevel;
  confidenceScore?: number | null;
  status: import('./crowd').PredictionStatus;
  isDemo: true;
}

