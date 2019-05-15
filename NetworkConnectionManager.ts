import { UiElementHandler } from "./UiElementHandler";

export class NetworkConnectionManager {
    // Researched some ideas here https://www.tutorialspoint.com/webrtc/webrtc_text_demo.htm
    public userName;
    public connectedUser;
    public signalingConn;
    public localConn;
    public dataChannel;

    constructor() {

        UiElementHandler.getAllUiElements();
        this.addEventListenersToUiElements();
    }

    public addEventListenersToUiElements() {
        UiElementHandler.sendMsgButton.addEventListener("click", this.sendChatMessageToUsers);
        UiElementHandler.signaling_submit.addEventListener("click", this.getUrlAndCreateConnection);
        UiElementHandler.login_button.addEventListener("click", this.userNameAndSend);
        UiElementHandler.connectToUserButton.addEventListener("click", this.initiateCallToUser);
        UiElementHandler.disconnectButton.addEventListener("click", this.disconnectFromChat);
    }

    public disconnectFromChat() {
        this.send({
            type: "leave",
        });
        this.handleLeave();
    }

    public sendChatMessageToUsers = (): void => {
        console.log("Why dis called");
        const val = UiElementHandler.msgInput.textContent;
        UiElementHandler.chatbox.textContent += " : " + val + "<br />";

        console.log("Datachannel send: " + this.dataChannel);
        this.dataChannel.send(val);
        // sending a message to a connected peer
        console.log();
        UiElementHandler.msgInput.textContent = "";
    }

    public getUrlAndCreateConnection = (): void => {
        const url = UiElementHandler.signaling_url.value;
        console.log(url);
        this.establishWebsocketConnection(url);
    }

    public establishWebsocketConnection = (url): void => {
        console.log("Attemtping to connect to server: ");
        this.signalingConn = new WebSocket("ws://" + url);

        ///////////////////////////////
        ///// Event handling block/////
        this.signalingConn.addEventListener("open",
            () => {
                console.log("Connected to the signaling server");
            },
        );

        // Getting message from signaling server
        console.log("Context: " + this);
        this.signalingConn.addEventListener("message", this.switchMessageHandlingDependingOnType);

        this.signalingConn.addEventListener("error", (err) => {
            console.log("Error happened" + err);
        });
    }

    public switchMessageHandlingDependingOnType = (msg): void => {
        console.log("Got message" + msg.data);
        const data = JSON.parse(msg.data);

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
            // When remote peer gives us ice iceCandidates
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


    // alias for sending JSON encoded messages
    public send(message) {

        // attach the other peer username to our messages
        if (this.connectedUser) {
            message.userName = this.connectedUser;
        }

        this.signalingConn.send(JSON.stringify(message));
    }

    public userNameAndSend = (): void => {
        // TODO what the frack
        console.log();
        console.log("UserNameAndSend Context: " + this);
        console.log(UiElementHandler.login_nameInput);
        const username = UiElementHandler.login_nameInput.textContent;
        console.log("Sending Username: " + username);
        this.send({
            type: "login",
            userName: username,
        });
    }

    public handleLogin(success) {
        if (success) {
            console.log("Username taken, refresh");
            return;
        } else {

            // Google offers a public Stun, which is good because that means
            // we don't need to create a Stun server for Fudge
            const configuration = {
                iceServers: [{ url: "stun:stun2.1.google.com:19302" }],
            };
            console.log("Connection config: " + configuration);

            this.localConn = new RTCPeerConnection();
            this.localConn.iceServers = configuration;
            console.log(this.localConn);

            // Handling the ice better than GoT
            this.localConn.addEventListener("icecandidate", (event) => {
                console.log("IceCandidate event called");
                if (event.iceCandidate) {
                    this.send({
                        Candidate: event.iceCandidate,
                        type: "iceCandidate",
                    });
                }
            });

            this.localConn.addEventListener("iceconnectionstatechange", (event) => {

                console.log(this.localConn.iceConnectionState);
            });

            this.localConn.addEventListener("datachannel", (event) => {
                console.log("Data channel is created!");

                event.channel.addEventListener("open", () => {
                    console.log("Data channel is open and ready to be used.");
                });
            });

        }
    }

    public openDataChannel() {

        const dataChannelOptions = {
            reliable: true,
        };
        this.dataChannel = this.localConn.createDataChannel("myDataChannel", dataChannelOptions);

        this.dataChannel.addEventListener("error", (err) => {
            console.log("Error:", err);
        });

        this.dataChannel.addEventListener("message", (event) => {
            console.log("new message received");
            console.log("Got message:", event.data);
        });

        this.dataChannel.addEventListener("open", () => {
            console.log("channel opened");
        });
    }

    public initiateCallToUser() {
        console.log("Initiating call to userName" + document.getElementById("connectToUsername").textContent);
        const callToUsername = document.getElementById("connectToUsername").textContent;

        if (callToUsername.length > 0) {

            this.connectedUser = callToUsername;

            this.localConn.createOffer(function(offer) {
                this.send({
                    offer,
                    type: "offer",
                });

                this.localConn.setLocalDescription(offer);
            }, (error) => {
                console.error("Error when creating offer" + error);
            });
            this.openDataChannel();
        }
    }

    // when somebody sends us an offer
    public handleOffer(offer, userName) {
        console.log("Handling received offer: " + offer + " " + userName);
        this.connectedUser = userName;
        this.localConn.setRemoteDescription(new RTCSessionDescription(offer));

        // create an answer to an offer
        this.localConn.createAnswer((answer) => {
            this.localConn.setLocalDescription(answer);

            this.send({
                answer,
                type: "answer",
            });

        }, (error) => {
            console.error("Error creating answer: " + error);
        });
    }

    // What to do with an answer
    public handleAnswer(answer) {
        console.log("Handling Answer");
        this.localConn.setRemoteDescription(new RTCSessionDescription(answer));
    }

    public handleIceCandidate(Candidate) {
        this.localConn.addIceCandidate(new RTCIceCandidate(Candidate));
    }

    public handleLeave() {
        this.connectedUser = null;
        this.localConn.close();
        this.localConn.oniceCandidate = null;
    }

}
