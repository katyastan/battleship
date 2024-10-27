import { Game } from "../models/game";
import { players } from "../models/player";
import { Message, ShipData } from "../types/types";
import WebSocket from 'ws';


// Messages
export function sendMessage(ws: WebSocket, message: Message) {
  console.log("sendMessage", message);
  ws.send(JSON.stringify({ ...message, data: JSON.stringify(message.data) }));
}

export function sendError(ws: WebSocket, errorText: string) {
  sendMessage(ws, { type: 'error', data: { errorText }, id: 0 });
}


export function broadcastMessage(message: Message) {
  for (const player of players.values()) {
    console.log("broadcastMessage", message, player.name);
    player.ws?.send(
      JSON.stringify({ ...message, data: JSON.stringify(message.data) })
    );
  }
}

export function broadcastGameMessage(game: Game, message: Message) {
    for (const clientId in game.players) {
      const player = players.get(clientId);
      if (player) {
        console.log("broadcastGameMessage", message, player.name);
        player.ws?.send(JSON.stringify({...message, data: JSON.stringify(message.data)}));
      }
    }
  }
  

// Coordinates
export function isShipSunk(ship: ShipData, shotsReceived: { x: number; y: number }[]): boolean {
    const shipCells = getShipCells(ship);
    return shipCells.every((cell) =>
      shotsReceived.some((shot) => shot.x === cell.x && shot.y === cell.y)
    );
  }

export function getShipCells(ship: ShipData): { x: number; y: number }[] {
    const cells = [];
    for (let i = 0; i < ship.length; i++) {
      const x = ship.direction ? ship.position.x : ship.position.x + i;
      const y = ship.direction ? ship.position.y + i : ship.position.y;
      cells.push({ x, y });
    }
    return cells;
  }

export function shipContainsCoordinate(ship: ShipData, x: number, y: number): boolean {
    const cells = getShipCells(ship);
    return cells.some((cell) => cell.x === x && cell.y === y);
  }

export function isPlayerDefeated(playerData: any): boolean {
    for (const ship of playerData.ships) {
      if (!isShipSunk(ship, playerData.shotsReceived)) {
        return false;
      }
    }
    return true;
  }

export function updatePlayerWin(clientId: string) {
    const player = players.get(clientId);
    if (player) {
      player.wins += 1;
      sendUpdateWinners();
    }
  }

export function sendUpdateWinners() {
    const winnerList = Array.from(players.values())
      .filter((p) => !p.name.startsWith('Bot'))
      .sort((a, b) => b.wins - a.wins)
      .map((p) => ({ name: p.name, wins: p.wins }));
  
    const message: Message = {
      type: 'update_winners',
      data: winnerList,
      id: 0,
    };
  
    broadcastMessage(message);
  }

  