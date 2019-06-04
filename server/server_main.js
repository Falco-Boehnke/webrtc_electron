// TODO replace requires with import
// Reason it's not: Error, "Cannot read property 'Server' of undefined"
var testSocket = require("ws");
// Fucked up, need to use client.Client() To create a client, otherwise error
var client = require("./../DataObjects/Client");
var server_main = /** @class */ (function () {
    function server_main() {
        var _this = this;
        this.availableRooms = {};
        this.usersCollection = new Array();
        this.serverEventHandler = function () {
            _this.wss.on("connection", function (clientToServerWebsocket) {
                console.log("User connected FRESH");
                var uniqueIdOnConnection = _this.createID();
                var freshlyConnectedClient = new client.Client(clientToServerWebsocket, uniqueIdOnConnection);
                _this.usersCollection.push(freshlyConnectedClient);
                clientToServerWebsocket.on("message", function (message) {
                    var data = null;
                    try {
                        data = JSON.parse(message);
                    }
                    catch (error) {
                        console.error("Invalid JSON", error);
                        data = {};
                    }
                    switch (data.type) {
                        case "login":
                            _this.serverHandleLogin(clientToServerWebsocket, data);
                            break;
                        case "offer":
                            var requestedClient = _this.searchForPropertyValueInCollection(data.otherUsername, "userName", _this.usersCollection);
                            if (requestedClient != null) {
                                console.log("User for offer found", requestedClient);
                                clientToServerWebsocket.otherUsername = requestedClient.userName;
                                _this.sendTo(requestedClient.clientConnection, {
                                    type: "offer",
                                    offer: data.offer,
                                    username: requestedClient.userName
                                });
                            }
                            else {
                                console.log("Username to connect to doesn't exist");
                            }
                            break;
                        case "answer":
                            console.log("Sending answer to: ", data.otherUsername);
                            var clientToSendAnswerTo = _this.searchForPropertyValueInCollection(data.otherUsername, "userName", _this.usersCollection);
                            if (clientToSendAnswerTo != null) {
                                clientToServerWebsocket.otherUsername = clientToSendAnswerTo.userName;
                                _this.sendTo(clientToSendAnswerTo.clientConnection, {
                                    type: "answer",
                                    answer: data.answer
                                });
                            }
                            break;
                        case "candidate":
                            console.log("Sending candidate to:", data.otherUsername);
                            var clientToShareCandidatesWith = _this.searchForPropertyValueInCollection(data.otherUsername, "userName", _this.usersCollection);
                            if (clientToShareCandidatesWith != null) {
                                _this.sendTo(clientToShareCandidatesWith.clientConnection, {
                                    type: "candidate",
                                    candidate: data.candidate
                                });
                            }
                            break;
                    }
                });
                clientToServerWebsocket.on("close", function () {
                    // delete users[clientToServerWebsocket.username];
                    clientToServerWebsocket.close();
                });
            });
        };
        this.createID = function () {
            // Math.random should be random enough because of it's seed
            // convert to base 36 and pick the first few digits after comma
            return "_" + Math.random().toString(36).substr(2, 7);
        };
        this.wss = new testSocket.Server({ port: 8080 });
        this.serverEventHandler();
    }
    server_main.prototype.sendTo = function (connection, message) {
        connection.send(JSON.stringify(message));
    };
    // Helper function for searching through a collection, finding objects by key and value, returning
    // Object that has that value
    server_main.prototype.searchForPropertyValueInCollection = function (propertyValue, key, collectionToSearch) {
        for (var propertyObject in collectionToSearch) {
            if (this.usersCollection.hasOwnProperty(propertyObject)) {
                var objectToSearchThrough = collectionToSearch[propertyObject];
                if (objectToSearchThrough[key] === propertyValue) {
                    return objectToSearchThrough;
                }
            }
        }
        return null;
    };
    server_main.prototype.serverHandleLogin = function (websocketConnection, messageData) {
        var usernameTaken = true;
        usernameTaken = this.searchForPropertyValueInCollection(messageData.username, "userName", this.usersCollection) != null;
        if (!usernameTaken) {
            var associatedWebsocketConnectionClient = this.searchForPropertyValueInCollection(websocketConnection, "clientConnection", this.usersCollection);
            if (associatedWebsocketConnectionClient != null) {
                associatedWebsocketConnectionClient.userName = messageData.username;
                console.log("Changed name of client object");
                this.sendTo(websocketConnection, {
                    type: "login",
                    success: true,
                    id: associatedWebsocketConnectionClient.id
                });
            }
        }
        else {
            this.sendTo(websocketConnection, { type: "login", success: false });
            usernameTaken = true;
            console.log("UsernameTaken");
        }
    };
    return server_main;
}());
var defaultServer = new server_main();
