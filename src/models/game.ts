import { ShipData } from '../types/types';

export class Game {
  idGame: string;
  players: { [clientId: string]: PlayerGameData };
  currentTurn: string;

  constructor(idGame: string, playerIds: string[]) {
    this.idGame = idGame;
    this.players = {};
    for (const id of playerIds) {
      this.players[id] = {
        ships: [],
        shotsReceived: [],
      };
    }
    this.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
  }
}

export interface PlayerGameData {
  ships: ShipData[];
  shotsReceived: { x: number; y: number }[];
}

export const games = new Map<string, Game>(); // Key: idGame
