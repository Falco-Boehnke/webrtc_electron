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
        switch (data.type) {
            case "login":
                serverHandleLogin(clientToServerWebsocket, data);
                break;
            case "offer":
                var requestedClient = searchForPropertyValueInCollection(data.otherUsername, "userName", usersCollection);
                console.log("Sending offer to: ", requestedClient);
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
                if (requestedClient != null) {
                    console.log("User for offer found", requestedClient);
                    sendTo(requestedClient.clientConnection, {
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
                var clientToSendAnswerTo = searchForPropertyValueInCollection(data.otherUsername, "userName", usersCollection);
                if (clientToSendAnswerTo != null) {
                    sendTo(clientToSendAnswerTo.clientConnection, {
                        type: "answer",
                        answer: data.answer
                    });
                }
                break;
            case "candidate":
                console.log("Sending candidate to:", data.otherUsername);
                // let clientToShareCandidatesWith = searchForPropertyValueInCollection
                //     (data.otherUsername,
                //         "userName",
                //         usersCollection);
                // if (clientToShareCandidatesWith != null) {
                //     sendTo(clientToShareCandidatesWith.clientConnection, {
                //         type: "candidate",
                //         candidate: data.candidate,
                //     });
                // }
                break;
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
// Helper function for searching through a collection, finding objects by key and value, returning
// Object that has that value
function searchForPropertyValueInCollection(propertyValue, key, collectionToSearch) {
    for (var propertyObject in collectionToSearch) {
        if (usersCollection.hasOwnProperty(propertyObject)) {
            var objectToSearchThrough = collectionToSearch[propertyObject];
            if (objectToSearchThrough[key] === propertyValue) {
                return objectToSearchThrough;
            }
        }
    }
    return null;
}
function serverHandleLogin(websocketConnection, messageData) {
    var usernameTaken = false;
    usernameTaken = searchForPropertyValueInCollection(messageData.username, "userName", usersCollection) != null;
    if (!usernameTaken) {
        var associatedWebsocketConnectionClient = searchForPropertyValueInCollection(websocketConnection, "clientConnection", usersCollection);
        if (associatedWebsocketConnectionClient != null) {
            associatedWebsocketConnectionClient.userName = messageData.username;
            console.log("Changed name of client object");
            sendTo(websocketConnection, {
                type: "login",
                success: true,
                id: associatedWebsocketConnectionClient.id
            });
        }
    }
    else {
        sendTo(websocketConnection, { type: "login", success: false });
        usernameTaken = true;
        console.log("UsernameTaken");
    }
}
