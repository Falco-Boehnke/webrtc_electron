"use strict";
exports.__esModule = true;
var Client = /** @class */ (function () {
    function Client(websocketConnection, uniqueClientId, loginName, connectedToRoom) {
        this.clientConnection = websocketConnection || null;
        this.id = uniqueClientId || "";
        this.userName = loginName || "";
        this.connectedRoom = connectedToRoom || null;
    }
    return Client;
}());
exports.Client = Client;
