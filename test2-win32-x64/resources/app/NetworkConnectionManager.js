"use strict";
exports.__esModule = true;
var UiElementHandler_1 = require("./UiElementHandler");
var NetworkConnectionManager = /** @class */ (function () {
    function NetworkConnectionManager() {
        var _this = this;
        this.configuration = {
            iceServers: [{ url: "stun:stun2.1.google.com:19302" }]
        };
        this.addUiListeners = function () {
            UiElementHandler_1.UiElementHandler.login_button.addEventListener("click", _this.loginLogic);
            UiElementHandler_1.UiElementHandler.connectToUserButton.addEventListener("click", _this.connectToUser);
            UiElementHandler_1.UiElementHandler.sendMsgButton.addEventListener("click", _this.sendMessageToUser);
        };
        this.addWsEventListeners = function () {
            _this.ws.addEventListener("open", function () {
                console.log("Connected to the signaling server");
            });
            _this.ws.addEventListener("error", function (err) {
                console.error(err);
            });
            _this.ws.addEventListener("message", function (msg) {
                console.log("Got message", msg.data);
                var data = JSON.parse(msg.data);
                switch (data.type) {
                    case "login":
                        _this.handleLogin(data.success);
                        break;
                    case "offer":
                        _this.handleOffer(data.offer, data.username);
                        break;
                    case "answer":
                        _this.handleAnswer(data.answer);
                        break;
                    case "candidate":
                        _this.handleCandidate(data.candidate);
                        break;
                }
            });
        };
        this.handleCandidate = function (candidate) {
            _this.connection.addIceCandidate(new RTCIceCandidate(candidate));
        };
        this.handleAnswer = function (answer) {
            _this.connection.setRemoteDescription(new RTCSessionDescription(answer));
        };
        this.handleOffer = function (offer, username) {
            _this.otherUsername = username;
            _this.connection.setRemoteDescription(new RTCSessionDescription(offer));
            _this.connection.createAnswer(function (answer) {
                _this.connection.setLocalDescription(answer);
                _this.sendMessage({
                    type: "answer",
                    otherUsername: _this.otherUsername,
                    answer: answer
                });
            }, function (error) {
                alert("Error when creating an answer");
                console.error(error);
            });
        };
        this.handleLogin = function (loginSuccess) {
            if (loginSuccess) {
                console.log("Login succesfully done");
                _this.createRTCConnection();
                console.log("COnnection at Login: ", _this.connection);
            }
            else {
                console.log("Login failed, username taken");
            }
        };
        this.loginLogic = function (event) {
            // this.usernameField =  document.getElementById("username") as HTMLInputElement;
            // this.username = this.usernameField.value;
            _this.username = UiElementHandler_1.UiElementHandler.login_nameInput.value;
            console.log(_this.username);
            if (_this.username.length < 0) {
                console.log("Please enter username");
                return;
            }
            _this.sendMessage({
                type: "login",
                username: _this.username
            });
        };
        this.createRTCConnection = function () {
            _this.connection = new RTCPeerConnection();
            _this.connection.configuration = _this.configuration;
            _this.peerConnection = _this.connection.createDataChannel("testChannel");
            _this.connection.ondatachannel = function (event) {
                console.log("Data channel is created!");
                event.channel.addEventListener("open", function () {
                    console.log("Data channel is open and ready to be used.");
                });
                event.channel.addEventListener("message", function (event) {
                    console.log("Received message: " + event.data);
                    UiElementHandler_1.UiElementHandler.chatbox.innerHTML += "\n" + _this.otherUsername + ": " + event.data;
                });
            };
            _this.peerConnection.onmessage = function (event) {
                console.log("Received message from other peer:", event.data);
                document.getElementById("chatbox").innerHTML += "<br>" + event.data;
            };
            _this.connection.onicecandidate = function (event) {
                if (event.candidate) {
                    _this.sendMessage({
                        type: "candidate",
                        otherUsername: _this.otherUsername,
                        candidate: event.candidate
                    });
                }
            };
        };
        this.connectToUser = function () {
            // const callUsernameElement =  document.querySelector("input#username-to-call") as HTMLInputElement;
            // const callToUsername = callUsernameElement.value;
            var callToUsername = UiElementHandler_1.UiElementHandler.usernameToConnectTo.value;
            if (callToUsername.length === 0) {
                alert("Enter a username 😉");
                return;
            }
            _this.otherUsername = callToUsername;
            // create an offer
            _this.connection.createOffer(function (offer) {
                _this.sendMessage({
                    type: "offer",
                    otherUsername: _this.otherUsername,
                    offer: offer
                });
                _this.connection.setLocalDescription(offer);
            }, function (error) {
                alert("Error when creating an offer");
                console.error(error);
            });
        };
        this.sendMessage = function (message) {
            _this.ws.send(JSON.stringify(message));
        };
        this.sendMessageToUser = function () {
            // const messageField =  document.getElementById("msgInput") as HTMLInputElement;
            // const message = messageField.value;
            var message = UiElementHandler_1.UiElementHandler.msgInput.value;
            UiElementHandler_1.UiElementHandler.chatbox.innerHTML += "\n" + _this.username + ": " + message;
            _this.peerConnection.send(message);
        };
        this.addUiListeners();
    }
    NetworkConnectionManager.prototype.createWebsocketForSignaling = function (signalingUrl) {
        try {
            this.ws = new WebSocket("ws://" + signalingUrl);
        }
        catch (error) {
            console.log("Signaling-Server Verbindungsfehler. Serverstatus prüfen, URL überprüfen");
            return;
        }
        this.addWsEventListeners();
    };
    return NetworkConnectionManager;
}());
exports.NetworkConnectionManager = NetworkConnectionManager;
