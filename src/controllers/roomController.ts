import { Room, rooms } from '../models/room';
import { players } from '../models/player';
import { WebSocket } from 'ws';
import { Message } from '../types/types';
import { broadcastMessage, sendMessage } from '../utils/helpers';
import { initNewGame } from './gameController';


export function initNewRoom(): Room {
  const lastRoomId = rooms.size > 0 ? Math.max(...Array.from(rooms.keys()).map((roomId) => parseInt(roomId))) : -1;
  const room = new Room((lastRoomId+1).toString());
  rooms.set(room.roomId, room);
  return room;
}

export function handleCreateRoom(ws: WebSocket, clientId: string) {
  const room = initNewRoom();
  room.players.push(clientId);
  sendUpdateRoom();
}

export function handleAddUserToRoom(ws: WebSocket, data: any, clientId: string) {
  const { indexRoom } = JSON.parse(data);
  const room = rooms.get(indexRoom);
  if (room && room.players.length < 2) {
    room.players.push(clientId);
    sendUpdateRoom();
    startGame(room);
  } else {
    sendMessage(ws, {
      type: 'error',
      data: { errorText: 'Room not available' },
      id: 0,
    });
  }
}

function sendUpdateRoom() {
  const roomList = Array.from(rooms.values())
    .filter((room) => room.players.length === 1)
    .map((room) => ({
      roomId: room.roomId,
      roomUsers: room.players.map((clientId) => {
        const player = players.get(clientId);
        return {
          name: player?.name,
          index: clientId,
        };
      }),
    }));

  const message: Message = {
    type: 'update_room',
    data: roomList,
    id: 0,
  };

  broadcastMessage(message);
}

function startGame(room: Room) {
  room.gameStarted = true;

  const game = initNewGame(room.players);
  const [player1Id, player2Id] = room.players;
  const player1 = players.get(player1Id);
  const player2 = players.get(player2Id);

  const message: Message = {
    type: 'create_game',
    data: {
      idGame: game.idGame,
      idPlayer: player1Id,
    },
    id: 0,
  };

  player1?.ws ? sendMessage(player1.ws, message) : null;

  message.data.idPlayer = player2Id;
  player2?.ws ? sendMessage(player2.ws, message) : null;
}
