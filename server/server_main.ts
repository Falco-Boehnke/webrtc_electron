// TODO replace requires with import
// Reason it's not: Error, "Cannot read property 'Server' of undefined"
let testSocket = require("ws");
// Fucked up, need to use client.Client() To create a client, otherwise error
let client = require("./../DataObjects/Client");
let wss = new testSocket.Server({ port: 8080 });
let users = {};
let availableRooms = {};

wss.on("connection", (clientToServerWebsocket) => {
    console.log("User connected FRESH");

    const uniqueIdOnConnection = createID();
    const freshlyConnectedClient = new client.Client(clientToServerWebsocket, uniqueIdOnConnection);
    users[clientToServerWebsocket] = freshlyConnectedClient;

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
                let usernameTaken: boolean = false;

                for (let clientAlreadyConnected in users) {
                    if (users.hasOwnProperty(clientAlreadyConnected)) {
                        if (users[clientAlreadyConnected].userName === data.username) {
                            if (users[clientToServerWebsocket].userName != null || "") {
                                sendTo(clientToServerWebsocket, { type: "login", success: false });
                                usernameTaken = true;
                                return;
                            }
                        }
                    }
                }
                if (!usernameTaken) {
                    users[clientToServerWebsocket].userName = data.username;
                    sendTo(clientToServerWebsocket, { type: "login", success: true });
                    console.log(users[clientToServerWebsocket]);
                }
                // }
                break;


            case "offer":
                console.log("Sending offer to: ", data.otherUsername);

                let otherUser = null;

                for (let userWithThatName in users) {
                    if (users.hasOwnProperty(userWithThatName)) {
                        console.log("Other USername: " + data.otherUsername);
                        console.log("Also Other Username: " + users[userWithThatName].userName);
                        if (users[userWithThatName].userName === data.otherUsername) {
                            otherUser = users[userWithThatName];
                            console.log("User " + users[userWithThatName].userName + " exists");
                            return;
                        }
                    }
                }

                if (otherUser != null) {
                    clientToServerWebsocket.otherUsername = data.otherUsername;

                    sendTo(users[data.otherUsername], {
                        type: "offer",
                        offer: data.offer,
                        username: clientToServerWebsocket.username,
                    });
                } else {
                    console.log("Username to connect to doesn't exist");
                }
                break;
            case "answer":
                console.log("Sending answer to: ", data.otherUsername);
                if (users[data.otherUsername] != null) {
                    clientToServerWebsocket.otherUsername = data.otherUsername;
                    sendTo(users[data.otherUsername], {
                        type: "answer",
                        answer: data.answer,
                    });
                }
                break;
            case "candidate":
                console.log("Sending candidate to:", data.otherUsername);
                if (users[data.otherUsername] != null) {
                    sendTo(users[data.otherUsername], {
                        type: "candidate",
                        candidate: data.candidate,
                    });
                }
                break;
            case "idRequest":

                let id = "";
                console.log("Generation and sending ID to User " + users[clientToServerWebsocket].userName);

                if (users[clientToServerWebsocket].id === "" || null) {
                    id = createID();
                    users[clientToServerWebsocket].id = id;
                } else {
                    id = users[clientToServerWebsocket].id;
                }
                sendTo(users[clientToServerWebsocket].clientConnection, {
                    type: "requestedId",
                    id,
                });
        }
    });
    clientToServerWebsocket.on("close", () => {
        delete users[clientToServerWebsocket.username];
        clientToServerWebsocket.close();
    });
});
function createID() {
    // Math.random should be random enough because of it's seed
    // convert to base 36 and pick the first few digits after comma
    return "_" + Math.random().toString(36).substr(2, 7);
}
function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
}

