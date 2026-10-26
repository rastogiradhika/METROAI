export interface Platform {
  id: string;
  name: string;
  direction?: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  lineNames: string[];
  platforms: Platform[];
  coordinates?: { lat: number; lng: number };
  interchange?: boolean;
}

export interface Route {
  id: string;
  sourceStationId: string;
  destinationStationId: string;
  stationSequence: RouteStop[];
  totalStops: number;
  estimatedDurationMinutes?: number;
  interchanges: InterchangeInfo[];
  lineNames: string[];
}

export interface RouteStop {
  stationId: string;
  stationName: string;
  stationCode: string;
  lineName: string;
  isInterchange: boolean;
  platformId?: string;
}

export interface InterchangeInfo {
  stationId: string;
  stationName: string;
  fromLine: string;
  toLine: string;
}
