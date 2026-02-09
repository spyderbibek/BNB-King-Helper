// Kingdom data as returned by the contract
export interface KingdomData {
  gold: number;
  gems: number;
  perHour: number;
  alliesCount: number;
  alliesEarned: number;
  claimTime: number;
  battleTime: number;
  tiles: number[];
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: string;
}

export interface BuildingType {
  type: number;
  name: string;
  cost: number;
  yield: number;
  icon: string;
}

export interface ActiveBuilding {
  id: number;
  raw: number;
  baseType: number;
  upgrades: number;
  level: number;
}

export interface StrategicAction {
  name: string;
  cost: number;
  totalGems: number;
  hoursToSave: number;
  icon: string;
  type: 'BUY' | 'UPGRADE' | 'STOP';
  payload: any[];
}
