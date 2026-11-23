export interface IndiaParliamentRecord {
  id: string;
  name: string;
  [key: string]: unknown;
}

export type IndiaParliament = IndiaParliamentRecord[];
