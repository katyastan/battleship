import { WebSocket } from "ws";

export class Player {
  name: string;
  password: string;
  wins: number;
  clientId: string;
  ws: WebSocket | null;

  constructor(
    name: string,
    password: string,
    clientId: string,
    ws: WebSocket | null
  ) {
    this.name = name;
    this.password = password;
    this.wins = 0;
    this.clientId = clientId;
    this.ws = ws;
  }
}

export const players = new Map<string, Player>();
