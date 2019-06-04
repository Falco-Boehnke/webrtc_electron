import { ServerRoom } from "../NetworkAccessories/ServerRoom";

export class Client {

    public clientConnection: WebSocket;
    public id: string;
    public userName: string;
    public connectedRoom: ServerRoom;

    constructor();
    constructor(websocketConnection?: WebSocket,
                uniqueClientId?: string,
                loginName?: string,
                connectedToRoom?: ServerRoom) {
        this.clientConnection = websocketConnection || null;
        this.id = uniqueClientId || "";
        this.userName = loginName || "";
        this.connectedRoom = connectedToRoom || null;
    }
}
