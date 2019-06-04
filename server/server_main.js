// TODO replace requires with import
// Reason it's not: Error, "Cannot read property 'Server' of undefined"
var testSocket = require("ws");
// Fucked up, need to use client.Client() To create a client, otherwise error
var client = require("./../DataObjects/Client");
var wss = new testSocket.Server({ port: 8080 });
var availableRooms = {};
var usersCollection = new Array();
wss.on("connection", function (clientToServerWebsocket) {
    console.log("User connected FRESH");
    var uniqueIdOnConnection = createID();
    var freshlyConnectedClient = new client.Client(clientToServerWebsocket, uniqueIdOnConnection);
    usersCollection.push(freshlyConnectedClient);
    clientToServerWebsocket.on("message", function (message) {
        var data = null;
        try {
            data = JSON.parse(message);
        }
        catch (error) {
            console.error("Invalid JSON", error);
            data = {};
        }
        var otherUser = null;
        switch (data.type) {
            case "login":
                var usernameTaken = false;
                for (var currentClient in usersCollection) {
                    if (usersCollection.hasOwnProperty(currentClient)) {
                        if (data.username === usersCollection[currentClient].userName) {
                            sendTo(clientToServerWebsocket, { type: "login", success: false });
                            usernameTaken = true;
                            console.log("UsernameTaken");
                        }
                    }
                }
                if (!usernameTaken) {
                    var relevantClient = void 0;
                    for (var currentClient in usersCollection) {
                        if (usersCollection.hasOwnProperty(currentClient)) {
                            if (clientToServerWebsocket === usersCollection[currentClient].clientConnection) {
                                usersCollection[currentClient].userName = data.username;
                                console.log("Added username to collection");
                                console.log("All connected users", usersCollection);
                                sendTo(clientToServerWebsocket, {
                                    type: "login",
                                    success: true,
                                    id: usersCollection[currentClient].id
                                });
                            }
                        }
                    }
                }
                break;
            case "offer":
                console.log("Sending offer to: ", data.otherUsername);
                for (var currentClient in usersCollection) {
                    if (usersCollection.hasOwnProperty(currentClient)) {
                        console.log("Testlog otherusername" + data.otherUsername);
                        console.log("Testlot usercollection ", usersCollection[currentClient]);
                        console.log("Testslot bool" + data.otherUsername === usersCollection[currentClient].userName);
                        if (data.otherUsername === usersCollection[currentClient].userName) {
                            console.log("User for offer found", currentClient);
                            // otherUser = users[currentClient];
                        }
                    }
                }
                //#region backup
                // for (let userWithThatName in users) {
                //     if (users.hasOwnProperty(userWithThatName)) {
                //         if (users[userWithThatName].userName === data.otherUsername) {
                //             otherUser = users[userWithThatName];
                //             console.log("User " + users[userWithThatName].userName + " exists");
                //             return;
                //         }
                //     }
                // }
                //#endregion
                if (otherUser != null) {
                    clientToServerWebsocket.otherUsername = data.otherUsername;
                    sendTo(otherUser.clientConnection, {
                        type: "offer",
                        offer: data.offer,
                        username: clientToServerWebsocket.username
                    });
                }
                else {
                    console.log("Username to connect to doesn't exist");
                }
                break;
            case "answer":
                console.log("Sending answer to: ", data.otherUsername);
                // if (users[data.otherUsername] != null) {
                //     clientToServerWebsocket.otherUsername = data.otherUsername;
                //     sendTo(users[data.otherUsername], {
                //         type: "answer",
                //         answer: data.answer,
                //     });
                // }
                break;
            case "candidate":
                console.log("Sending candidate to:", data.otherUsername);
                // if (users[data.otherUsername] != null) {
                //     sendTo(users[data.otherUsername], {
                //         type: "candidate",
                //         candidate: data.candidate,
                //     });
                // }
                // for (const userWithThatName in users) {
                //     if (users.hasOwnProperty(userWithThatName)) {
                //         console.log("Also Other Username: " + users[userWithThatName].userName);
                //         if (users[userWithThatName].userName === data.otherUsername) {
                //             otherUser = users[userWithThatName];
                //             console.log("User " + users[userWithThatName].userName + " exists");
                //             return;
                //         }
                //     }
                // }
                break;
            case "idRequest":
            // let id = "";
            // if (users[clientToServerWebsocket].id === "" || null) {
            //     id = createID();
            //     users[clientToServerWebsocket].id = id;
            // } else {
            //     id = users[clientToServerWebsocket].id;
            // }
            // sendTo(users[clientToServerWebsocket].clientConnection, {
            //     type: "requestedId",
            //     id,
            // });
        }
    });
    clientToServerWebsocket.on("close", function () {
        // delete users[clientToServerWebsocket.username];
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
