import { UiElementHandler } from "./UiElementHandler";

export class NetworkConnectionManager {
    public ws;
    public username;
    public usernameField;
    public connection;
    public otherUsername;
    public peerConnection;
    public configuration = {
        iceServers: [{ url: "stun:stun2.1.google.com:19302" }],
    };

    constructor() {

        this.addUiListeners();

    }

    public addUiListeners = (): void => {
        UiElementHandler.login_button.addEventListener("click", this.loginLogic);
        UiElementHandler.connectToUserButton.addEventListener("click", this.connectToUser);
        UiElementHandler.sendMsgButton.addEventListener("click", this.sendMessageToUser);
    }
    public addWsEventListeners = (): void => {
        this.ws.addEventListener("open", () => {
            console.log("Connected to the signaling server");
        });

        this.ws.addEventListener("error", (err) => {
            console.error(err);
        });

        this.ws.addEventListener("message", (msg) => {
            console.log("Got message", msg.data);

            const data = JSON.parse(msg.data);

            switch (data.type) {
                case "login":
                    this.handleLogin(data.success);
                    break;

                case "offer":
                    this.handleOffer(data.offer, data.username);
                    break;
                case "answer":
                    this.handleAnswer(data.answer);
                    break;
                case "candidate":
                    this.handleCandidate(data.candidate);
                    break;
            }
        });
    }

public createWebsocketForSignaling(signalingUrl: string) {
    try
    {
        this.ws = new WebSocket("ws://" + signalingUrl);
    } catch(error)
    {
        console.log("Signaling-Server Verbindungsfehler. Serverstatus prüfen, URL überprüfen");
        return;
    }
    this.addWsEventListeners();
}

    public handleCandidate = (candidate) => {
        this.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }

    public handleAnswer = (answer) => {
        this.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    public handleOffer = (offer, username): void => {
        this.otherUsername = username;
        this.connection.setRemoteDescription(new RTCSessionDescription(offer));
        this.connection.createAnswer(
            (answer) => {
                this.connection.setLocalDescription(answer);
                this.sendMessage({
                    type: "answer",
                    otherUsername: this.otherUsername,
                    answer,
                });
            },
            (error) => {
                alert("Error when creating an answer");
                console.error(error);
            },
        );
    }

    public handleLogin = (loginSuccess): void => {
        if (loginSuccess) {
            console.log("Login succesfully done");
            this.createRTCConnection();
            console.log("COnnection at Login: ", this.connection);
        } else {
            console.log("Login failed, username taken");
        }
    }

    public loginLogic = (event): void => {
        // this.usernameField =  document.getElementById("username") as HTMLInputElement;
        // this.username = this.usernameField.value;

        this.username = UiElementHandler.login_nameInput.value;
        console.log(this.username);
        if (this.username.length < 0) {
            console.log("Please enter username");
            return;
        }

        this.sendMessage({
            type: "login",
            username: this.username,
        });
    }

    public createRTCConnection = () => {
        this.connection = new RTCPeerConnection();
        this.connection.configuration = this.configuration;

        this.peerConnection = this.connection.createDataChannel("testChannel");

        this.connection.ondatachannel = (event) => {
            console.log("Data channel is created!");

            event.channel.addEventListener("open", () => {
                console.log("Data channel is open and ready to be used.");
            });
            event.channel.addEventListener("message", (event) => {
                console.log("Received message: " + event.data);
                UiElementHandler.chatbox.innerHTML += "\n" + this.otherUsername + ": " + event.data;
            });
        };

        this.peerConnection.onmessage = function(event) {
            console.log("Received message from other peer:", event.data);
            document.getElementById("chatbox").innerHTML += "<br>" + event.data;
        };

        this.connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendMessage({
                    type: "candidate",
                    otherUsername: this.otherUsername,
                    candidate: event.candidate,
                });
            }
        };
    }

    public connectToUser = (): void => {

        // const callUsernameElement =  document.querySelector("input#username-to-call") as HTMLInputElement;
        // const callToUsername = callUsernameElement.value;
        const callToUsername = UiElementHandler.usernameToConnectTo.value;
        if (callToUsername.length === 0) {
            alert("Enter a username 😉");
            return;
        }

        this.otherUsername = callToUsername;
        // create an offer
        this.connection.createOffer(
            (offer) => {
                this.sendMessage({
                    type: "offer",
                    otherUsername: this.otherUsername,
                    offer,
                });

                this.connection.setLocalDescription(offer);
            },
            (error) => {
                alert("Error when creating an offer");
                console.error(error);
            },
        );
    }

    public sendMessage = (message) => {
        this.ws.send(JSON.stringify(message));
    }

    public sendMessageToUser = () => {
        // const messageField =  document.getElementById("msgInput") as HTMLInputElement;
        // const message = messageField.value;
        const message = UiElementHandler.msgInput.value;
        UiElementHandler.chatbox.innerHTML += "\n" + this.username + ": " + message;
        this.peerConnection.send(message);
    }

}
