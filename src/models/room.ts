export class Room {
    roomId: string;
    players: string[];
    gameStarted: boolean;
  
    constructor(roomId: string) {
      this.roomId = roomId;
      this.players = [];
      this.gameStarted = false;
    }
}

export const rooms = new Map<string, Room>();

