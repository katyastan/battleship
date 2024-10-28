export interface Message {
  type: string;
  data: any;
  id: number;
}

export interface PlayerData {
  name: string;
  password: string;
  index?: string;
}

export interface RoomData {
  roomId: string;
  roomUsers: PlayerData[];
}

export interface ShipData {
  position: { x: number; y: number };
  direction: boolean;
  length: 1 | 2 | 3 | 4;
  type: "small" | "medium" | "large" | "huge";
}

export interface ShipDefinition {
  type: "small" | "medium" | "large" | "huge";
  length: 1 | 2 | 3 | 4;
}

export interface GameData {
  idGame: string;
  idPlayer: string;
  ships?: ShipData[];
}

export interface AttackData {
  gameId: string;
  x: number;
  y: number;
  indexPlayer: string;
}
