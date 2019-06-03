// TODO replace requires with import
// Reason it's not: Error, "Cannot read property 'Server' of undefined"
let testSocket = require("ws");
// Fucked up, need to use client.Client() To create a client, otherwise error
let client = require("./../DataObjects/Client");
let wss = new testSocket.Server({ port: 8080 });
let users = {};
let availableRooms = {};

wss.on("connection", (ws) => {
    console.log("User connected FRESH");

    const uniqueIdOnConnection = createID();
    const freshlyConnectedClient = new client.Client(ws, uniqueIdOnConnection);
    console.log("Id:", uniqueIdOnConnection, "Client: ", freshlyConnectedClient);
    users[ws] = freshlyConnectedClient;
    
    ws.on("message", (message) => {
        let data = null;
        try {
            data = JSON.parse(message);
        } catch (error) {
            console.error("Invalid JSON", error);
            data = {};
        }
        
        switch (data.type) {
            case "login":
                console.log("User logged", data.username);
                if (users[data.username]) {
                    sendTo(ws, { type: "login", success: false });
                } else {
                    // users[ws] = "wat";
                    ws.username = data.username;
                    sendTo(ws, { type: "login", success: true });
                    console.log(users[ws]);
                }
                break;
            case "offer":
                console.log("Sending offer to: ", data.otherUsername);
                if (users[data.otherUsername] != null) {
                    ws.otherUsername = data.otherUsername;
                    sendTo(users[data.otherUsername], {
                        type: "offer",
                        offer: data.offer,
                        username: ws.username,
                    });
                } else {
                    console.log("Username to connect to doesn't exist");
                }
                break;
            case "answer":
                console.log("Sending answer to: ", data.otherUsername);
                if (users[data.otherUsername] != null) {
                    ws.otherUsername = data.otherUsername;
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
                let id = void 0;
                console.log("Generation and sending ID to User " + ws.username);
                if (users[data.username].id != null) {
                    id = createID();
                }
                sendTo(users[data.username], {
                    type: "requestedId",
                    id,
                });
        }
    });
    ws.on("close", function() {
        delete users[ws.username];
        ws.close();
    });
});
function createID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return "_" + Math.random().toString(36).substr(2, 7);
}
function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
}
// const handleLogin = (data) => {
//     if (users[data.username]) {
//         sendTo(ws, { type: 'login', success: false })
//     }
//     else {
//         users
//     }
// }
