import { WebSocket } from 'ws';
import { players } from '../models/player';
import { Player } from '../models/player';
import { Room } from '../models/room';
import { Game, PlayerGameData } from '../models/game';
import { Message } from '../types/types';
import { ShipData, ShipDefinition } from '../types/types';
import { getShipCells, isPlayerDefeated, isShipSunk, sendError, sendMessage, shipContainsCoordinate, updatePlayerWin } from '../utils/helpers';
import { initNewRoom } from './roomController';
import { initNewGame, sendTurnMessage } from './gameController';

let botIdCounter = 0;
export const BOT_ID_PREFIX = '__bot-';

export function handleSinglePlay(ws: WebSocket, clientId: string) {
  const humanPlayer = players.get(clientId);
  if (!humanPlayer) {
    sendError(ws, 'Player not registered');
    return;
  }

  const botClientId = `${BOT_ID_PREFIX}-${botIdCounter++}`;
  const botPlayer = new Player('Bot', '', botClientId, null);
  players.set(botClientId, botPlayer);

  const room = initNewRoom();
  startGameWithBot(room, humanPlayer, botPlayer);
}

function startGameWithBot(room: Room, humanPlayer: Player, botPlayer: Player) {
  const game = initNewGame([humanPlayer.clientId, botPlayer.clientId]);
  const createGameMessage: Message = {
    type: 'create_game',
    data: {
      idGame: game.idGame,
      idPlayer: humanPlayer.clientId,
    },
    id: 0,
  };
  sendMessage(humanPlayer.ws!, createGameMessage);
  autoPlaceShips(game, botPlayer.clientId);
  game.currentTurn = Math.random() < 0.5 ? humanPlayer.clientId : botPlayer.clientId;
}

function autoPlaceShips(game: Game, clientId: string) {
  const ships = generateRandomShips();
  game.players[clientId].ships = ships;
}

function generateRandomShips(): ShipData[] {
  const ships: ShipData[] = [];

  const shipDefinitions: ShipDefinition[] = [
    { type: 'huge', length: 4 },
    ...[].concat(...Array(2).fill({ type: 'large', length: 3 })),
    ...[].concat(...Array(3).fill({ type: 'medium', length: 2 })),
    ...[].concat(...Array(4).fill({ type: 'small', length: 1 })),
  ];

  for (const shipDef of shipDefinitions) {
    let placed = false;
    while (!placed) {
      const direction = Math.random() < 0.5;
      const maxPosition = 10 - shipDef.length;
      const x = Math.floor(Math.random() * (direction ? 10 : maxPosition));
      const y = Math.floor(Math.random() * (direction ? maxPosition : 10));

      const newShip: ShipData = {
        position: { x, y },
        direction,
        length: shipDef.length,
        type: shipDef.type,
      };

      if (!isOverlap(ships, newShip)) {
        ships.push(newShip);
        placed = true;
      }
    }
  }
  return ships;
}

function isOverlap(existingShips: ShipData[], newShip: ShipData): boolean {
  for (const ship of existingShips) {
    if (doShipsOverlap(ship, newShip)) {
      return true;
    }
  }
  return false;
}

function doShipsOverlap(ship1: ShipData, ship2: ShipData): boolean {
  const ship1Cells = getShipCells(ship1);
  const ship2Cells = getShipCells(ship2);

  for (const cell1 of ship1Cells) {
    for (const cell2 of ship2Cells) {
      if (cell1.x === cell2.x && cell1.y === cell2.y) {
        return true;
      }
      if (Math.abs(cell1.x - cell2.x) <= 1 && Math.abs(cell1.y - cell2.y) <= 1) {
        return true;
      }
    }
  }
  return false;
}

export function botMakeMove(game: Game, botClientId: string) {
  const opponentId = Object.keys(game.players).find((id) => id !== botClientId)!;
  const opponentData = game.players[opponentId];

  const { x, y } = generateCoordinatesForAttack(opponentData);

  const result = processAttack(game, botClientId, x, y);

  const attackMessage: Message = {
    type: 'attack',
    data: {
      position: { x, y },
      currentPlayer: botClientId,
      status: result.status,
    },
    id: 0,
  };
  const humanPlayer = players.get(opponentId);
  if (humanPlayer && humanPlayer.ws) {
    sendMessage(humanPlayer.ws, attackMessage);
  }

  if (result.gameOver) {
    sendFinishMessage(game, botClientId);
    updatePlayerWin(botClientId);
  } if (result.status === 'miss') {
    game.currentTurn = opponentId;
  }

  sendTurnMessage(game);
}

function generateCoordinatesForAttack(data: PlayerGameData): { x: number; y: number } {
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
  } while (data.shotsReceived.some((shot) => shot.x === x && shot.y === y));
  return { x, y };
}

function processAttack(game: Game, attackerId: string, x: number, y: number): { status: 'miss' | 'shot' | 'killed'; gameOver: boolean } {
  const opponentId = Object.keys(game.players).find((id) => id !== attackerId)!;
  const opponentData = game.players[opponentId];

  const hitShip = opponentData.ships.find((ship) => {
    return shipContainsCoordinate(ship, x, y);
  });

  let status: 'miss' | 'shot' | 'killed' = 'miss';
  if (hitShip) {
    if (!opponentData.shotsReceived.some((shot) => shot.x === x && shot.y === y)) {
      opponentData.shotsReceived.push({ x, y });
    }
    const isKilled = isShipSunk(hitShip, opponentData.shotsReceived);
    status = isKilled ? 'killed' : 'shot';
  }

  const gameOver = isPlayerDefeated(opponentData);

  return { status, gameOver };
}

function sendFinishMessage(game: Game, winnerId: string) {
  const humanPlayerId = Object.keys(game.players).find((id) => !id.startsWith('bot'));
  const humanPlayer = players.get(humanPlayerId!);
  if (humanPlayer && humanPlayer.ws) {
    const message: Message = {
      type: 'finish',
      data: {
        winPlayer: winnerId,
      },
      id: 0,
    };
    sendMessage(humanPlayer.ws, message);
  }
}
