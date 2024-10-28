import { WebSocket } from "ws";
import { Message } from "../types/types";
import { handleRegistration } from "../controllers/playerController";
import {
  handleCreateRoom,
  handleAddUserToRoom,
} from "../controllers/roomController";
import { handleAddShips, handleAttack } from "../controllers/gameController";
import { handleSinglePlay } from "../controllers/botController";
import { sendError } from "../utils/helpers";

export function handleMessage(
  ws: WebSocket,
  message: string,
  clientId: string
) {
  try {
    const msg: Message = JSON.parse(message);
    const { type, data } = msg;

    switch (type) {
      case "reg":
        handleRegistration(ws, data, clientId);
        break;
      case "single_play":
        handleSinglePlay(ws, clientId);
        break;
      case "create_room":
        handleCreateRoom(ws, clientId);
        break;
      case "add_user_to_room":
        handleAddUserToRoom(ws, data, clientId);
        break;
      case "add_ships":
        handleAddShips(ws, data);
        break;
      case "attack":
        handleAttack(ws, data);
        break;
      default:
        sendError(ws, "Unknown message type");
        break;
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendError(ws, "Invalid message format");
  }
}
