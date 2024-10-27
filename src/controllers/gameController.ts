import { games, Game } from '../models/game';
import { players } from '../models/player';
import { WebSocket } from 'ws';
import { Message } from '../types/types';
import { broadcastGameMessage, isPlayerDefeated, isShipSunk, sendMessage, shipContainsCoordinate, updatePlayerWin } from '../utils/helpers';
import { BOT_ID_PREFIX, botMakeMove } from './botController';


export function initNewGame(playerIds: string[]): Game {
  const lastGameId = games.size > 0 ? Math.max(...Array.from(games.keys()).map((gameId) => parseInt(gameId))) : -1;
  const gameId = (lastGameId + 1).toString();
  const game = new Game(gameId, playerIds);
  games.set(gameId, game);
  console.log('New game created', game);
  return game;
}

export function handleAddShips(ws: WebSocket, data: any) {
  const { gameId, ships, indexPlayer } = JSON.parse(data);
  console.log('handleAddShips', indexPlayer, gameId, ships);
  const game = games.get(gameId);

  if (game && game.players[indexPlayer]) {
    game.players[indexPlayer].ships = ships;

    const allPlayersReady = Object.values(game.players).every((p) => p.ships.length > 0);
    if (allPlayersReady) {
      sendStartGame(game);
      sendTurnMessage(game);
    } else {
      console.log('Waiting for other player to add ships', game.players);
    }
  } else {
    console.log('Game not found or player not in game');
  }
}

function sendStartGame(game: Game) {
  for (const clientId in game.players) {
    const player = players.get(clientId);
    if (player) {
      const message: Message = {
        type: 'start_game',
        data: {
          ships: game.players[clientId].ships,
          currentPlayerIndex: clientId,
        },
        id: 0,
      };
      player.ws ? sendMessage(player.ws, message) : null;
    }
  }
}

export function sendTurnMessage(game: Game) {
  const message: Message = {
    type: 'turn',
    data: {
      currentPlayer: game.currentTurn,
    },
    id: 0,
  };
  game.currentTurn.startsWith(`${BOT_ID_PREFIX}-`) ? setTimeout(() => botMakeMove(game, game.currentTurn), 1100) : broadcastGameMessage(game, message);
}

export function handleAttack(ws: WebSocket, data: any) {
  const { gameId, x, y, indexPlayer } = JSON.parse(data);
  const game = games.get(gameId);

  if (game && game.currentTurn === indexPlayer) {
    const opponentId = Object.keys(game.players).find((id) => id !== indexPlayer)!;
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

      if (isPlayerDefeated(opponentData)) {
        sendFinishMessage(game, indexPlayer);
        updatePlayerWin(indexPlayer);
        return;
      }
    }

    const attackMessage: Message = {
      type: 'attack',
      data: {
        position: { x, y },
        currentPlayer: indexPlayer,
        status,
      },
      id: 0,
    };

    broadcastGameMessage(game, attackMessage);

    if (status === 'miss') {
      game.currentTurn = opponentId;
    }
    sendTurnMessage(game);
  } else {
    // Handle invalid turn or game not found
  }
}

function sendFinishMessage(game: Game, winnerId: string) {
  const message: Message = {
    type: 'finish',
    data: {
      winPlayer: winnerId,
    },
    id: 0,
  };
  broadcastGameMessage(game, message);
}
