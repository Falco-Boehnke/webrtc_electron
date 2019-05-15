"use strict";
exports.__esModule = true;
var NetworkConnectionManager = /** @class */ (function () {
    function NetworkConnectionManager() {
        this.getAllUiElements();
        this.addEventListenersToUiElements();
    }
    NetworkConnectionManager.prototype.getAllUiElements = function () {
        this.login_button = document.getElementById('login_button');
        console.log(this.login_button);
        this.sendMsgButton = document.getElementById('sendMessage');
        console.log(this.sendMsgButton);
        this.connectToUserButton = document.getElementById('userConnect');
        console.log(this.connectToUserButton);
        this.disconnectButton = document.getElementById('disconnectBtn');
        console.log(this.disconnectButton);
    };
    NetworkConnectionManager.prototype.addEventListenersToUiElements = function () {
        // when userName clicks the "send message" button 
        document.getElementById('sendMessage').addEventListener("click", this.sendChatMessageToUsers);
        document.getElementById('submit_button').addEventListener("click", this.getUrlAndCreateConnection);
        document.getElementById('login_button').addEventListener("click", this.userNameAndSend);
        document.getElementById('userConnect').addEventListener("click", this.initiateCallToUser);
        document.getElementById('disconnectBtn').addEventListener("click", this.disconnectFromChat);
    };
    NetworkConnectionManager.prototype.disconnectFromChat = function () {
        this.send({
            type: "leave"
        });
        this.handleLeave();
    };
    NetworkConnectionManager.prototype.sendChatMessageToUsers = function (event) {
        var val = document.getElementById('msgInput').textContent;
        document.getElementById('chatbox').textContent += " : " + val + "<br />";
        console.log("Datachannel send: " + this.dataChannel);
        this.dataChannel.send(val);
        //sending a message to a connected peer 
        console.log();
        document.getElementById('msgInput').textContent = "";
    };
    NetworkConnectionManager.prototype.getUrlAndCreateConnection = function () {
        var url = document.getElementById('signaling_uri').textContent;
        console.log("Attempting to establish");
        this.establishWebsocketConnection;
    };
    NetworkConnectionManager.prototype.establishWebsocketConnection = function (url) {
        console.log("Attemtping to connect to server: ");
        this.signalingConn = new WebSocket('ws://' + url);
        ///////////////////////////////
        ///// Event handling block/////
        this.signalingConn.onopen = function () {
            console.log("Connected to the signaling server");
        };
        // Getting message from signaling server
        this.signalingConn.onmessage = function (msg) {
            console.log("Got message" + msg.data);
            var data = JSON.parse(msg.data);
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
        };
        this.signalingConn.onerror = function (err) {
            console.log("Error happened" + err);
        };
    };
    //alias for sending JSON encoded messages 
    NetworkConnectionManager.prototype.send = function (message) {
        //attach the other peer username to our messages
        if (this.connectedUser) {
            message.userName = this.connectedUser;
        }
        this.signalingConn.send(JSON.stringify(message));
    };
    ;
    NetworkConnectionManager.prototype.userNameAndSend = function () {
        var username = document.getElementById('login_name').textContent;
        this.send({
            type: "login",
            userName: username
        });
    };
    NetworkConnectionManager.prototype.handleLogin = function (success) {
        var _this = this;
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
            this.localConn = new RTCPeerConnection();
            this.localConn.iceServers = configuration;
            console.log(this.localConn);
            // Handling the ice better than GoT
            this.localConn.oniceCandidate = function (event) {
                if (event.iceCandidate) {
                    this.send({
                        type: "iceCandidate",
                        Candidate: event.iceCandidate
                    });
                }
            };
            this.localConn.oniceconnectionstatechange = function (e) { return console.log(_this.localConn.iceConnectionState); };
            this.localConn.ondatachannel = function (event) {
                console.log('Data channel is created!');
                event.channel.onopen = function () {
                    console.log('Data channel is open and ready to be used.');
                };
            };
        }
    };
    NetworkConnectionManager.prototype.openDataChannel = function () {
        var dataChannelOptions = {
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
    };
    NetworkConnectionManager.prototype.initiateCallToUser = function () {
        console.log("Initiating call to userName" + document.getElementById('connectToUsername').textContent);
        var callToUsername = document.getElementById('connectToUsername').textContent;
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
    };
    //when somebody sends us an offer 
    NetworkConnectionManager.prototype.handleOffer = function (offer, userName) {
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
    };
    ;
    // What to do with an answer
    NetworkConnectionManager.prototype.handleAnswer = function (answer) {
        console.log("Handling Answer");
        this.localConn.setRemoteDescription(new RTCSessionDescription(answer));
    };
    NetworkConnectionManager.prototype.handleIceCandidate = function (Candidate) {
        this.localConn.addIceCandidate(new RTCIceCandidate(Candidate));
    };
    NetworkConnectionManager.prototype.handleLeave = function () {
        this.connectedUser = null;
        this.localConn.close();
        this.localConn.oniceCandidate = null;
    };
    return NetworkConnectionManager;
}());
exports.NetworkConnectionManager = NetworkConnectionManager;
