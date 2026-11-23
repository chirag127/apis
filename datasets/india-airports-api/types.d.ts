export interface IndiaAirportsRecord {
  id: string;
  name: string;
  [key: string]: unknown;
}

export type IndiaAirports = IndiaAirportsRecord[];
