// TODO replace requires with import
// Reason it's not: Error, "Cannot read property 'Server' of undefined"
let testSocket = require("ws");
// Fucked up, need to use client.Client() To create a client, otherwise error
let client = require("./../DataObjects/Client");

class server_main {
    public wss;
    public availableRooms = {};
    public usersCollection = new Array();

    constructor() {
        this.wss = new testSocket.Server({ port: 8080 });
        this.serverEventHandler();
    }

    public serverEventHandler = (): void => {
        this.wss.on("connection", (clientToServerWebsocket) => {
            console.log("User connected FRESH");

            const uniqueIdOnConnection = this.createID();
            const freshlyConnectedClient = new client.Client(clientToServerWebsocket, uniqueIdOnConnection);
            this.usersCollection.push(freshlyConnectedClient);

            clientToServerWebsocket.on("message", (message) => {
                let data = null;
                try {
                    data = JSON.parse(message);
                } catch (error) {
                    console.error("Invalid JSON", error);
                    data = {};
                }

                switch (data.type) {
                    case "login":
                        this.serverHandleLogin(clientToServerWebsocket, data);
                        break;

                    case "offer":
                        const requestedClient = this.searchForPropertyValueInCollection
                            (data.otherUsername,
                                "userName",
                                this.usersCollection);

                        if (requestedClient != null) {
                            console.log("User for offer found", requestedClient);
                            clientToServerWebsocket.otherUsername = requestedClient.userName;
                            this.sendTo(requestedClient.clientConnection, {
                                type: "offer",
                                offer: data.offer,
                                username: requestedClient.userName,
                            });
                        } else {
                            console.log("Username to connect to doesn't exist");
                        }
                        break;

                    case "answer":
                        console.log("Sending answer to: ", data.otherUsername);
                        const clientToSendAnswerTo = this.searchForPropertyValueInCollection
                            (data.otherUsername,
                                "userName",
                                this.usersCollection);
                        if (clientToSendAnswerTo != null) {
                            clientToServerWebsocket.otherUsername = clientToSendAnswerTo.userName;
                            this.sendTo(clientToSendAnswerTo.clientConnection, {
                                type: "answer",
                                answer: data.answer,
                            });
                        }
                        break;

                    case "candidate":
                        console.log("Sending candidate to:", data.otherUsername);
                        const clientToShareCandidatesWith = this.searchForPropertyValueInCollection
                            (data.otherUsername,
                                "userName",
                                this.usersCollection);

                        if (clientToShareCandidatesWith != null) {
                            this.sendTo(clientToShareCandidatesWith.clientConnection, {
                                type: "candidate",
                                candidate: data.candidate,
                            });
                        }
                        break;
                }
            });
            clientToServerWebsocket.on("close", () => {
                // delete users[clientToServerWebsocket.username];
                clientToServerWebsocket.close();
            });
        });
    }
    public createID = (): string => {
        // Math.random should be random enough because of it's seed
        // convert to base 36 and pick the first few digits after comma
        return "_" + Math.random().toString(36).substr(2, 7);
    }
    public sendTo(connection, message) {
        connection.send(JSON.stringify(message));
    }

    // Helper function for searching through a collection, finding objects by key and value, returning
    // Object that has that value
    public searchForPropertyValueInCollection(propertyValue: any, key: string, collectionToSearch: any[]) {
        for (const propertyObject in collectionToSearch) {
            if (this.usersCollection.hasOwnProperty(propertyObject)) {
                const objectToSearchThrough = collectionToSearch[propertyObject];
                if (objectToSearchThrough[key] === propertyValue) {
                    return objectToSearchThrough;
                }
            }
        }
        return null;
    }

    public serverHandleLogin(websocketConnection: WebSocket, messageData): void {
        let usernameTaken: boolean = true;
        usernameTaken = this.searchForPropertyValueInCollection(messageData.username, "userName", this.usersCollection) != null;

        if (!usernameTaken) {
            const associatedWebsocketConnectionClient =
                this.searchForPropertyValueInCollection
                    (websocketConnection,
                        "clientConnection",
                        this.usersCollection);

            if (associatedWebsocketConnectionClient != null) {
                associatedWebsocketConnectionClient.userName = messageData.username;
                console.log("Changed name of client object");

                this.sendTo(websocketConnection,
                    {
                        type: "login",
                        success: true,
                        id: associatedWebsocketConnectionClient.id,
                    },
                );
            }
        } else {
            this.sendTo(websocketConnection, { type: "login", success: false });
            usernameTaken = true;
            console.log("UsernameTaken");
        }
    }
}


let defaultServer = new server_main();
