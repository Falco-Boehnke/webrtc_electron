export class NetworkConnectionManager {
    // Researched some ideas here https://www.tutorialspoint.com/webrtc/webrtc_text_demo.htm
    userName;
    connectedUser;
    signalingConn;
    localConn;
    dataChannel;

    signaling_url: HTMLInputElement;
    signaling_submit;
    login_nameInput: HTMLInputElement;
    login_button;
    msgInput: HTMLInputElement;
    chatbox: HTMLInputElement;
    sendMsgButton;
    connectToUserButton;
    usernameToConnectTo: HTMLInputElement;
    disconnectButton;
    testbutton;

    constructor() {
        this.getAllUiElements();
        this.addEventListenersToUiElements();
    }

    getAllUiElements() {
        this.testbutton = document.getElementById("test_button");
        this.signaling_url = <HTMLInputElement>document.getElementById('signaling_uri');
        console.log(this.signaling_url);
        this.signaling_submit = document.getElementById('submit_button');
        console.log(this.signaling_submit);
        this.login_nameInput = <HTMLInputElement>document.getElementById('login_name');
        console.log(this.login_nameInput);
        this.login_button = document.getElementById('login_button');
        console.log(this.login_button);
        this.msgInput = <HTMLInputElement>document.getElementById('msgInput');
        console.log(this.msgInput);
        this.chatbox = <HTMLInputElement>document.getElementById('chatbox');
        console.log(this.chatbox);
        this.sendMsgButton = document.getElementById('sendMessage');
        console.log(this.sendMsgButton);
        this.connectToUserButton = document.getElementById('userConnect');
        console.log(this.connectToUserButton);
        this.usernameToConnectTo = <HTMLInputElement>document.getElementById('connectToUsername');
        console.log(this.usernameToConnectTo);
        this.disconnectButton = document.getElementById('disconnectBtn');
        console.log(this.disconnectButton);
    };


    addEventListenersToUiElements(){
        console.log(this.signaling_url);
        console.log(this.signaling_submit);
        console.log(this.login_nameInput);
        console.log(this.login_button);
        console.log(this.msgInput);
        console.log(this.chatbox);
        console.log(this.sendMsgButton);
        console.log(this.connectToUserButton);
        console.log(this.usernameToConnectTo);
        console.log(this.disconnectButton);

        // when userName clicks the "send message" button 
        this.sendMsgButton.addEventListener("click", this.sendChatMessageToUsers);
    }


    sendChatMessageToUsers(event)
    {
        console.log(this.msgInput)
        let val = this.msgInput.value;
        this.chatbox.innerHTML += " : " + val + "<br />";

        console.log("Datachannel send: " + this.dataChannel);
        this.dataChannel.send("Test");
        //sending a message to a connected peer 
        console.log()
        this.msgInput.value = "";
    }
    getUrlAndCreateConnection() {
        let url = this.signaling_url.value;
        this.establishWebsocketConnection(url);
    }

    establishWebsocketConnection(url) {
        console.log("Attemtping to connect to server: ");

        this.signalingConn = new WebSocket('ws://' + url);

        ///////////////////////////////
        ///// Event handling block/////
        this.signalingConn.onopen = function () {
            console.log("Connected to the signaling server");
        }

        // Getting message from signaling server
        this.signalingConn.onmessage = function (msg) {
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
        };

        this.signalingConn.onerror = function (err) {
            console.log("Error happened" + err);
        }
    }


    //alias for sending JSON encoded messages 
    send(message) {

        //attach the other peer username to our messages
        if (this.connectedUser) {
            message.userName = this.connectedUser;
        }

        this.signalingConn.send(JSON.stringify(message));
    };

    userNameAndSend() {
        let username = this.login_nameInput.value;
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
        else (success == true)
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
            this.localConn.oniceCandidate = function (event) {
                if (event.iceCandidate) {
                    this.send({
                        type: "iceCandidate",
                        Candidate: event.iceCandidate
                    });
                }
            };

            this.localConn.oniceconnectionstatechange = e => console.log(this.localConn.iceConnectionState);
            this.localConn.ondatachannel = function (event) {
                console.log('Data channel is created!');
                event.channel.onopen = function () {
                    console.log('Data channel is open and ready to be used.');
                };
            }
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
        console.log("Initiating call to userName" + this.usernameToConnectTo.value);
        let callToUsername = this.usernameToConnectTo.value;

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
        console.log("Handling received offer: " + offer + " " + userName)
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