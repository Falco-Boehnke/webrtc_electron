"use strict";
exports.__esModule = true;
var UiElementHandler_1 = require("./UiElementHandler");
var NetworkConnectionManager = /** @class */ (function () {
    function NetworkConnectionManager() {
        var _this = this;
        this.sendChatMessageToUsers = function () {
            console.log("Why dis called");
            var val = UiElementHandler_1.UiElementHandler.msgInput.textContent;
            UiElementHandler_1.UiElementHandler.chatbox.textContent += " : " + val + "<br />";
            console.log("Datachannel send: " + _this.dataChannel);
            _this.dataChannel.send(val);
            // sending a message to a connected peer
            console.log();
            UiElementHandler_1.UiElementHandler.msgInput.textContent = "";
        };
        this.getUrlAndCreateConnection = function () {
            var url = UiElementHandler_1.UiElementHandler.signaling_url.value;
            console.log(url);
            _this.establishWebsocketConnection(url);
        };
        this.establishWebsocketConnection = function (url) {
            console.log("Attemtping to connect to server: ");
            _this.signalingConn = new WebSocket("ws://" + url);
            ///////////////////////////////
            ///// Event handling block/////
            _this.signalingConn.addEventListener("open", function () {
                console.log("Connected to the signaling server");
            });
            // Getting message from signaling server
            console.log("Context: " + _this);
            _this.signalingConn.addEventListener("message", _this.switchMessageHandlingDependingOnType);
            _this.signalingConn.addEventListener("error", function (err) {
                console.log("Error happened" + err);
            });
        };
        this.switchMessageHandlingDependingOnType = function (msg) {
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
                // When remote peer gives us ice iceCandidates
                case "iceCandidate":
                    _this.handleIceCandidate(data.Candidate);
                    break;
                case "leave":
                    _this.handleLeave();
                    break;
                default:
                    break;
            }
        };
        this.userNameAndSend = function () {
            // TODO what the frack
            console.log();
            console.log("UserNameAndSend Context: ", _this);
            console.log(_this);
            console.log(UiElementHandler_1.UiElementHandler.login_nameInput);
            var username = UiElementHandler_1.UiElementHandler.login_nameInput.value;
            console.log("Sending Username: " + username);
            _this.send({
                type: "login",
                userName: username
            });
        };
        UiElementHandler_1.UiElementHandler.getAllUiElements();
        this.addEventListenersToUiElements();
    }
    NetworkConnectionManager.prototype.addEventListenersToUiElements = function () {
        UiElementHandler_1.UiElementHandler.sendMsgButton.addEventListener("click", this.sendChatMessageToUsers);
        UiElementHandler_1.UiElementHandler.signaling_submit.addEventListener("click", this.getUrlAndCreateConnection);
        UiElementHandler_1.UiElementHandler.login_button.addEventListener("click", this.userNameAndSend);
        UiElementHandler_1.UiElementHandler.connectToUserButton.addEventListener("click", this.initiateCallToUser);
        UiElementHandler_1.UiElementHandler.disconnectButton.addEventListener("click", this.disconnectFromChat);
    };
    NetworkConnectionManager.prototype.disconnectFromChat = function () {
        this.send({
            type: "leave"
        });
        this.handleLeave();
    };
    // alias for sending JSON encoded messages
    NetworkConnectionManager.prototype.send = function (message) {
        // attach the other peer username to our messages
        if (this.connectedUser) {
            message.userName = this.connectedUser;
        }
        this.signalingConn.send(JSON.stringify(message));
    };
    NetworkConnectionManager.prototype.handleLogin = function (success) {
        var _this = this;
        if (success) {
            console.log("Username taken, refresh");
            return;
        }
        else {
            // Google offers a public Stun, which is good because that means
            // we don't need to create a Stun server for Fudge
            var configuration = {
                iceServers: [{ url: "stun:stun2.1.google.com:19302" }]
            };
            console.log("Connection config: " + configuration);
            this.localConn = new RTCPeerConnection();
            this.localConn.iceServers = configuration;
            console.log(this.localConn);
            // Handling the ice better than GoT
            this.localConn.addEventListener("icecandidate", function (event) {
                console.log("IceCandidate event called");
                if (event.iceCandidate) {
                    _this.send({
                        Candidate: event.iceCandidate,
                        type: "iceCandidate"
                    });
                }
            });
            this.localConn.addEventListener("iceconnectionstatechange", function (event) {
                console.log(_this.localConn.iceConnectionState);
            });
            this.localConn.addEventListener("datachannel", function (event) {
                console.log("Data channel is created!");
                event.channel.addEventListener("open", function () {
                    console.log("Data channel is open and ready to be used.");
                });
            });
        }
    };
    NetworkConnectionManager.prototype.openDataChannel = function () {
        var dataChannelOptions = {
            reliable: true
        };
        this.dataChannel = this.localConn.createDataChannel("myDataChannel", dataChannelOptions);
        this.dataChannel.addEventListener("error", function (err) {
            console.log("Error:", err);
        });
        this.dataChannel.addEventListener("message", function (event) {
            console.log("new message received");
            console.log("Got message:", event.data);
        });
        this.dataChannel.addEventListener("open", function () {
            console.log("channel opened");
        });
    };
    NetworkConnectionManager.prototype.initiateCallToUser = function () {
        console.log("Initiating call to userName" + document.getElementById("connectToUsername").textContent);
        var callToUsername = document.getElementById("connectToUsername").textContent;
        if (callToUsername.length > 0) {
            this.connectedUser = callToUsername;
            this.localConn.createOffer(function (offer) {
                this.send({
                    offer: offer,
                    type: "offer"
                });
                this.localConn.setLocalDescription(offer);
            }, function (error) {
                console.error("Error when creating offer" + error);
            });
            this.openDataChannel();
        }
    };
    // when somebody sends us an offer
    NetworkConnectionManager.prototype.handleOffer = function (offer, userName) {
        var _this = this;
        console.log("Handling received offer: " + offer + " " + userName);
        this.connectedUser = userName;
        this.localConn.setRemoteDescription(new RTCSessionDescription(offer));
        // create an answer to an offer
        this.localConn.createAnswer(function (answer) {
            _this.localConn.setLocalDescription(answer);
            _this.send({
                answer: answer,
                type: "answer"
            });
        }, function (error) {
            console.error("Error creating answer: " + error);
        });
    };
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
