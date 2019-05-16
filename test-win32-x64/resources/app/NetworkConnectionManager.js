import { UiElementHandler } from "./UiElementHandler";
export class NetworkConnectionManager {
    constructor() {
        UiElementHandler.getAllUiElements();
        this.addEventListenersToUiElements();
    }
    addEventListenersToUiElements() {
        // when userName clicks the "send message" button 
        UiElementHandler.sendMsgButton.addEventListener("click", () => this.sendChatMessageToUsers());
        UiElementHandler.signaling_submit.addEventListener("click", () => this.getUrlAndCreateConnection());
        UiElementHandler.login_button.addEventListener("click", () => this.userNameAndSend());
        UiElementHandler.connectToUserButton.addEventListener("click", () => this.initiateCallToUser());
        UiElementHandler.disconnectButton.addEventListener("click", () => this.disconnectFromChat());
        //document.getElementById('sendMessage').addEventListener("click", () => this.sendChatMessageToUsers());
        // document.getElementById('submit_button').addEventListener("click", () => this.getUrlAndCreateConnection());
        // document.getElementById('login_button').addEventListener("click", () => this.userNameAndSend());
        // document.getElementById('userConnect').addEventListener("click", () => this.initiateCallToUser());
        // document.getElementById('disconnectBtn').addEventListener("click", () => this.disconnectFromChat());
    }
    disconnectFromChat() {
        this.send({
            type: "leave"
        });
        this.handleLeave();
    }
    sendChatMessageToUsers() {
        let val = UiElementHandler.msgInput.textContent;
        UiElementHandler.chatbox.textContent += " : " + val + "<br />";
        console.log("Datachannel send: " + this.dataChannel);
        this.dataChannel.send(val);
        //sending a message to a connected peer 
        console.log();
        UiElementHandler.msgInput.textContent = "";
    }
    getUrlAndCreateConnection() {
        let url = UiElementHandler.signaling_url.value;
        console.log(url);
        this.establishWebsocketConnection(url);
        () => this.establishWebsocketConnection;
    }
    establishWebsocketConnection(url) {
        console.log("Attemtping to connect to server: ");
        this.signalingConn = new WebSocket('ws://' + url);
        ///////////////////////////////
        ///// Event handling block/////
        this.signalingConn.addEventListener('open', () => {
            console.log("Connected to the signaling server");
        });
        // Getting message from signaling server
        this.signalingConn.addEventListener('message', (msg) => {
            {
                console.log("Got message" + msg.data);
                let data = JSON.parse(msg.data);
                switch (data.type) {
                    case "login":
                        this.handleLogin(data.success);
                        break;
                    case "offer":
                        this.handleOffer(data.offer, data.userName);
                        break;
                    case "answer":
                        this.handleAnswer(data.answer);
                        break;
                    //When remote peer gives us ice iceCandidates
                    case "iceCandidate":
                        this.handleIceCandidate(data.Candidate);
                        break;
                    case "leave":
                        this.handleLeave();
                        break;
                    default:
                        break;
                }
            }
            ;
        });
        this.signalingConn.addEventListener('error', (err) => {
            console.log("Error happened" + err);
        });
    }
    //alias for sending JSON encoded messages 
    send(message) {
        //attach the other peer username to our messages
        if (this.connectedUser) {
            message.userName = this.connectedUser;
        }
        this.signalingConn.send(JSON.stringify(message));
    }
    ;
    userNameAndSend() {
        console.log();
        console.log(this);
        console.log(UiElementHandler.login_nameInput);
        console.log(UiElementHandler.login_nameInput.textContent);
        let username = UiElementHandler.login_nameInput.textContent;
        console.log("Sending Username: " + username);
        this.send({
            type: "login",
            userName: username
        });
    }
    handleLogin(success) {
        if (success == false) {
            console.log("Username taken, refresh");
            return;
        }
        else
            (success == true);
        {
            // Google offers a public Stun, which is good because that means
            // we don't need to create a Stun server for Fudge
            let configuration = {
                "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
            };
            console.log("Connection config: " + configuration);
            this.localConn = new RTCPeerConnection();
            this.localConn.iceServers = configuration;
            console.log(this.localConn);
            // Handling the ice better than GoT
            this.localConn.addEventListener('icecandidate', (event) => {
                console.log("IceCandidate event called");
                if (event.iceCandidate) {
                    this.send({
                        type: "iceCandidate",
                        Candidate: event.iceCandidate
                    });
                }
            });
            this.localConn.addEventListener('iceconnectionstatechange', (event) => {
                console.log(this.localConn.iceConnectionState);
            });
            this.localConn.addEventListener('datachannel', (event) => {
                console.log('Data channel is created!');
                event.channel.addEventListener('open', () => {
                    console.log('Data channel is open and ready to be used.');
                });
            });
        }
    }
    openDataChannel() {
        let dataChannelOptions = {
            reliable: true
        };
        this.dataChannel = this.localConn.createDataChannel("myDataChannel", dataChannelOptions);
        this.dataChannel.onerror = function (error) {
            console.log("Error:", error);
        };
        this.dataChannel.onmessage = function (event) {
            console.log("new message received");
            console.log("Got message:", event.data);
        };
        this.dataChannel.onopen = function () {
            console.log("channel opened");
        };
    }
    initiateCallToUser() {
        console.log("Initiating call to userName" + document.getElementById('connectToUsername').textContent);
        let callToUsername = document.getElementById('connectToUsername').textContent;
        if (callToUsername.length > 0) {
            this.connectedUser = callToUsername;
            this.localConn.createOffer(function (offer) {
                this.send({
                    type: "offer",
                    offer: offer
                });
                this.localConn.setLocalDescription(offer);
            }, function (error) {
                console.error("Error when creating offer" + error);
            });
            this.openDataChannel();
        }
    }
    //when somebody sends us an offer 
    handleOffer(offer, userName) {
        console.log("Handling received offer: " + offer + " " + userName);
        this.connectedUser = userName;
        this.localConn.setRemoteDescription(new RTCSessionDescription(offer));
        //create an answer to an offer 
        this.localConn.createAnswer(function (answer) {
            this.localConn.setLocalDescription(answer);
            this.send({
                type: "answer",
                answer: answer
            });
        }, function (error) {
            console.error("Error creating answer: " + error);
        });
    }
    ;
    // What to do with an answer
    handleAnswer(answer) {
        console.log("Handling Answer");
        this.localConn.setRemoteDescription(new RTCSessionDescription(answer));
    }
    handleIceCandidate(Candidate) {
        this.localConn.addIceCandidate(new RTCIceCandidate(Candidate));
    }
    handleLeave() {
        this.connectedUser = null;
        this.localConn.close();
        this.localConn.oniceCandidate = null;
    }
}
//# sourceMappingURL=NetworkConnectionManager.js.map