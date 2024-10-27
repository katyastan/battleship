import { Player, players } from '../models/player';
import WebSocket from 'ws';
import { sendMessage } from '../utils/helpers';

export function handleRegistration(ws: WebSocket, data: any, clientId: string) {
  const { name, password } = JSON.parse(data);
  console.log('handleRegistration', name, password, data, players.keys());
  let player = Array.from(players.values()).find((p) => p.name === name);

  if (player) {
    if (player.password !== password) {
      sendMessage(ws, {
        type: 'reg',
        data: {
          name,
          index: clientId,
          error: true,
          errorText: 'Invalid password',
        },
        id: 0,
      });
      return;
    }
    player.ws = ws; 
    player.clientId = clientId;
  } else {
    player = new Player(name, password, clientId, ws);
    players.set(clientId, player);
  }

  sendMessage(ws, {
    type: 'reg',
    data: {
      name,
      index: clientId,
      error: false,
      errorText: '',
    },
    id: 0,
  });

  // Optionally, send updated winners list
//   sendUpdateWinners();
}
