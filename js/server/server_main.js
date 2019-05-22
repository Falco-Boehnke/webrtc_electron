const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })
const users = {}

wss.on('connection', ws => {
    console.log('User connected FRESH')

    ws.on('message', message => {
        let data = null

        try {
            data = JSON.parse(message);
        } catch (error) {
            console.error('Invalid JSON', error);
            data = {};
        }

        switch (data.type) {
            case 'login':
                console.log('User logged', data.username)
                if (users[data.username]) {
                    sendTo(ws, { type: 'login', success: false })
                } else {
                    users[data.username] = ws
                    ws.username = data.username
                    sendTo(ws, { type: 'login', success: true })
                }
                break;

            case 'offer':
                console.log('Sending offer to: ', data.otherUsername)
                if (users[data.otherUsername] != null) {
                    ws.otherUsername = data.otherUsername
                    sendTo(users[data.otherUsername], {
                        type: 'offer',
                        offer: data.offer,
                        username: ws.username
                    })
                }
                else {
                    console.log("Username to connect to doesn't exist");
                }
                break;

            case 'answer':
                console.log('Sending answer to: ', data.otherUsername)
                if (users[data.otherUsername] != null) {
                    ws.otherUsername = data.otherUsername
                    sendTo(users[data.otherUsername], {
                        type: 'answer',
                        answer: data.answer
                    })
                }
                break;

            case 'candidate':
                console.log('Sending candidate to:', data.otherUsername)

                if (users[data.otherUsername] != null) {
                    sendTo(users[data.otherUsername], {
                        type: 'candidate',
                        candidate: data.candidate
                    })
                }

                break


        }
    })

    ws.on('close', () => {
        //handle closing
    })
})

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

