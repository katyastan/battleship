import { WebSocketServer, WebSocket } from 'ws';
import { handleMessage } from './messageHandler';
import { IncomingMessage } from 'http';

const clients = new Map<string, WebSocket>();
let clientIdCounter = 0; 


export function startWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = (clientIdCounter++).toString();
    clients.set(clientId, ws);
    console.log(`Client connected: ${clientId}`);

    ws.on('message', (message: string) => {
      console.log(`Received message from ${clientId}: ${message}`);
      handleMessage(ws, message, clientId);
    });

    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });
  });

  console.log(`WebSocket server started on ws://localhost:${port}`);
}
