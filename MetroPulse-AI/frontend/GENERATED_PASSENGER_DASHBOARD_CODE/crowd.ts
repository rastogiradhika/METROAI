export type CrowdLevel = 'low' | 'moderate' | 'high' | 'critical' | 'unavailable';
export type DataSource = 'demo' | 'ml_pipeline' | 'passenger_report';
export type ProcessingStatus = 'processed' | 'processing' | 'failed' | 'pending';

export type CrowdTrendDirection = 'rising' | 'stable' | 'falling' | 'insufficient_data';

export interface CrowdObservation {
  id: string;
  stationId: string;
  platformId: string;
  observedAt: string; // ISO string
  personCount: number | null;
  crowdLevel: CrowdLevel;
  source: DataSource;
  sourceName?: string; // Human-friendly data source
  trend?: CrowdTrendDirection;
  processingStatus: ProcessingStatus;
  isDemo: true;
}

export interface CrowdTrendPoint {
  time: string; // HH:mm
  observedCount: number | null;
  crowdLevel: CrowdLevel;
}

export type PredictionStatus = 'available' | 'insufficient_data' | 'unavailable';
export type PredictionHorizon = 5 | 10 | 15;

export interface CrowdPrediction {
  id: string;
  stationId: string;
  platformId: string;
  generatedAt: string; // ISO string
  forecastAt: string;  // ISO string — when the prediction is FOR
  horizonMinutes: PredictionHorizon;
  predictedCount: number | null;
  predictedLevel: CrowdLevel;
  confidenceScore?: number | null; // e.g. 0.94 for 94%, or null when model does not supply
  status: PredictionStatus;
  isDemo: true;
}

