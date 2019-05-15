"use strict";
exports.__esModule = true;
var UiElementHandler_1 = require("./UiElementHandler");
var NetworkConnectionManager = /** @class */ (function () {
    function NetworkConnectionManager() {
        UiElementHandler_1.UiElementHandler.getAllUiElements();
        this.addEventListenersToUiElements();
    }
    NetworkConnectionManager.prototype.addEventListenersToUiElements = function () {
        var _this = this;
        // when userName clicks the "send message" button 
        UiElementHandler_1.UiElementHandler.sendMsgButton.addEventListener("click", function () { return _this.sendChatMessageToUsers(); });
        UiElementHandler_1.UiElementHandler.signaling_submit.addEventListener("click", function () { return _this.getUrlAndCreateConnection(); });
        UiElementHandler_1.UiElementHandler.login_button.addEventListener("click", function () { return _this.userNameAndSend(); });
        UiElementHandler_1.UiElementHandler.connectToUserButton.addEventListener("click", function () { return _this.initiateCallToUser(); });
        UiElementHandler_1.UiElementHandler.disconnectButton.addEventListener("click", function () { return _this.disconnectFromChat(); });
        //document.getElementById('sendMessage').addEventListener("click", () => this.sendChatMessageToUsers());
        // document.getElementById('submit_button').addEventListener("click", () => this.getUrlAndCreateConnection());
        // document.getElementById('login_button').addEventListener("click", () => this.userNameAndSend());
        // document.getElementById('userConnect').addEventListener("click", () => this.initiateCallToUser());
        // document.getElementById('disconnectBtn').addEventListener("click", () => this.disconnectFromChat());
    };
    NetworkConnectionManager.prototype.disconnectFromChat = function () {
        this.send({
            type: "leave"
        });
        this.handleLeave();
    };
    NetworkConnectionManager.prototype.sendChatMessageToUsers = function () {
        var val = UiElementHandler_1.UiElementHandler.msgInput.textContent;
        UiElementHandler_1.UiElementHandler.chatbox.textContent += " : " + val + "<br />";
        console.log("Datachannel send: " + this.dataChannel);
        this.dataChannel.send(val);
        //sending a message to a connected peer 
        console.log();
        UiElementHandler_1.UiElementHandler.msgInput.textContent = "";
    };
    NetworkConnectionManager.prototype.getUrlAndCreateConnection = function () {
        var _this = this;
        var url = UiElementHandler_1.UiElementHandler.signaling_url.value;
        console.log(url);
        this.establishWebsocketConnection(url);
        (function () { return _this.establishWebsocketConnection; });
    };
    NetworkConnectionManager.prototype.establishWebsocketConnection = function (url) {
        var _this = this;
        console.log("Attemtping to connect to server: ");
        this.signalingConn = new WebSocket('ws://' + url);
        ///////////////////////////////
        ///// Event handling block/////
        this.signalingConn.addEventListener('open', function () {
            console.log("Connected to the signaling server");
        });
        // Getting message from signaling server
        this.signalingConn.addEventListener('message', function (msg) {
            {
                console.log("Got message" + msg.data);
                var data = JSON.parse(msg.data);
                switch (data.type) {
                    case "login":
                        _this.handleLogin(data.success);
                        break;
                    case "offer":
                        _this.handleOffer(data.offer, data.userName);
                        break;
                    case "answer":
                        _this.handleAnswer(data.answer);
                        break;
                    //When remote peer gives us ice iceCandidates
                    case "iceCandidate":
                        _this.handleIceCandidate(data.Candidate);
                        break;
                    case "leave":
                        _this.handleLeave();
                        break;
                    default:
                        break;
                }
            }
            ;
        });
        this.signalingConn.addEventListener('error', function (err) {
            console.log("Error happened" + err);
        });
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
        console.log();
        console.log(this);
        console.log(UiElementHandler_1.UiElementHandler.login_nameInput);
        console.log(UiElementHandler_1.UiElementHandler.login_nameInput.textContent);
        var username = UiElementHandler_1.UiElementHandler.login_nameInput.textContent;
        console.log("Sending Username: " + username);
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
            this.localConn.addEventListener('icecandidate', function (event) {
                console.log("IceCandidate event called");
                if (event.iceCandidate) {
                    _this.send({
                        type: "iceCandidate",
                        Candidate: event.iceCandidate
                    });
                }
            });
            this.localConn.addEventListener('iceconnectionstatechange', function (event) {
                console.log(_this.localConn.iceConnectionState);
            });
            this.localConn.addEventListener('datachannel', function (event) {
                console.log('Data channel is created!');
                event.channel.addEventListener('open', function () {
                    console.log('Data channel is open and ready to be used.');
                });
            });
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