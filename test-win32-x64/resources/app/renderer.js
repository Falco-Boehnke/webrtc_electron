// Researched some ideas here https://www.tutorialspoint.com/webrtc/webrtc_text_demo.htm
var name;
var connectedUser;
let signaling_url = document.getElementById('signaling_uri');
let signaling_submit = document.getElementById('submit_button');
let login_nameInput = document.getElementById('login_name');
let login_button = document.getElementById('login_button');
let msgInput = document.getElementById('msgInput');
let chatbox = document.getElementById('chatbox');
let sendMsgButton = document.getElementById('sendMessage');
let connectToUserButton = document.getElementById('userConnect');
let usernameToConnectTo = document.getElementById('connectToUsername');
let disconnectButton = document.getElementById('disconnectBtn');
let signalingConn;
let localConn;
let dataChannel;
signaling_submit.onclick = getUrlAndCreateConnection;
login_button.onclick = userNameAndSend;
connectToUserButton.onclick = initiateCallToUser;
disconnectButton.addEventListener("click", function () {
    send({
        type: "leave"
    });
    handleLeave();
});
// when user clicks the "send message" button 
sendMsgButton.addEventListener("click", function (event) {
    var val = msgInput.value;
    chatbox.innerHTML += " : " + val + "<br />";
    console.log("Datachannel send: " + dataChannel);
    dataChannel.send("Test");
    //sending a message to a connected peer 
    console.log();
    msgInput.value = "";
});
function getUrlAndCreateConnection() {
    var url = signaling_url.value;
    establishWebsocketConnection(url);
}
function establishWebsocketConnection(url) {
    console.log("Attemtping to connect to server: ");
    signalingConn = new WebSocket('ws://' + url);
    ///////////////////////////////
    ///// Event handling block/////
    signalingConn.onopen = function () {
        console.log("Connected to the signaling server");
    };
    // Getting message from signaling server
    signalingConn.onmessage = function (msg) {
        console.log("Got message" + msg.data);
        var data = JSON.parse(msg.data);
        switch (data.type) {
            case "login":
                handleLogin(data.success);
                break;
            case "offer":
                handleOffer(data.offer, data.name);
                break;
            case "answer":
                handleAnswer(data.answer);
                break;
            //When remote peer gives us ice candidates
            case "iceCandidate":
                handleIceCandidate(data.candidate);
                break;
            case "leave":
                handleLeave();
                break;
            default:
                break;
        }
    };
    signalingConn.onerror = function (err) {
        console.log("Error happened" + err);
    };
}
//alias for sending JSON encoded messages 
function send(message) {
    //attach the other peer username to our messages
    if (connectedUser) {
        message.name = connectedUser;
    }
    signalingConn.send(JSON.stringify(message));
}
;
function userNameAndSend() {
    var username = login_nameInput.value;
    send({
        type: "login",
        name: username
    });
}
function handleLogin(success) {
    if (success == false) {
        console.log("Username taken, refresh");
        return;
    }
    else
        (success == true);
    {
        // Google offers a public Stun, which is good because that means
        // we don't need to create a Stun server for Fudge
        var configuration = {
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
        };
        console.log("Connection config: " + configuration);
        localConn = new RTCPeerConnection(configuration);
        console.log(localConn);
        // Handling the ice better than GoT
        localConn.onicecandidate = function (event) {
            if (event.candidate) {
                send({
                    type: "iceCandidate",
                    candidate: event.candidate
                });
            }
        };
        localConn.oniceconnectionstatechange = e => console.log(localConn.iceConnectionState);
        localConn.ondatachannel = function (event) {
            console.log('Data channel is created!');
            event.channel.onopen = function () {
                console.log('Data channel is open and ready to be used.');
            };
        };
    }
}
function openDataChannel() {
    var dataChannelOptions = {
        reliable: true
    };
    dataChannel = localConn.createDataChannel("myDataChannel", dataChannelOptions);
    dataChannel.onerror = function (error) {
        console.log("Error:", error);
    };
    dataChannel.onmessage = function (event) {
        console.log("new message received");
        console.log("Got message:", event.data);
    };
    dataChannel.onopen = function () {
        console.log("channel opened");
    };
}
function initiateCallToUser() {
    console.log("Initiating call to user" + usernameToConnectTo.value);
    var callToUsername = usernameToConnectTo.value;
    if (callToUsername.length > 0) {
        connectedUser = callToUsername;
        localConn.createOffer(function (offer) {
            send({
                type: "offer",
                offer: offer
            });
            localConn.setLocalDescription(offer);
        }, function (error) {
            console.error("Error when creating offer" + error);
        });
        openDataChannel();
    }
}
//when somebody sends us an offer 
function handleOffer(offer, name) {
    console.log("Handling received offer: " + offer + " " + name);
    connectedUser = name;
    localConn.setRemoteDescription(new RTCSessionDescription(offer));
    //create an answer to an offer 
    localConn.createAnswer(function (answer) {
        localConn.setLocalDescription(answer);
        send({
            type: "answer",
            answer: answer
        });
    }, function (error) {
        console.error("Error creating answer: " + error);
    });
}
;
// What to do with an answer
function handleAnswer(answer) {
    console.log("Handling Answer");
    localConn.setRemoteDescription(new RTCSessionDescription(answer));
}
function handleIceCandidate(candidate) {
    localConn.addIceCandidate(new RTCIceCandidate(candidate));
}
function handleLeave() {
    connectedUser = null;
    localConn.close();
    localConn.onicecandidate = null;
}
//# sourceMappingURL=renderer.js.map