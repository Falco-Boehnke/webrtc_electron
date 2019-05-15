// Weiter einfos https://www.tutorialspoint.com/webrtc/webrtc_text_demo.htm

var WebSocketServer = require('ws').Server; 

//creating a websocket server at port 9090 
var wss = new WebSocketServer({host: '0.0.0.0', port: 9090});

var connectedUsers = {};
//when a user connects to sever 
wss.on('connection', function(connection) { 
   console.log("user connected: " + connection); 
	
   //when server gets a message from a connected user 
   connection.on('message', function(message) { 
      console.log("Got message from a user:", message); 
      var data;

      try{
          data = JSON.parse(message);
      } catch(e){
          console.log("Invalid Json");
          data = {};
      }
    

   switch(data.type)
   {
       // login
        case "login":
            console.log("User logged in: " + data.name);

            // If user is already logged on the server, refuse
            if(connectedUsers[data.name])
            {
                sendTo(connection, {
                    type: "login",
                    success: false
                });
            }
            // else allow user to login and save connection in connectedusers
            else
            {
                connectedUsers[data.name] = connection;
                connection.name = data.name;

                sendTo(connection, {
                    type: "login",
                    success: true
                });
            }
            break;
        
        case "offer":
            console.log("Sending offer to user: " + data.name);
            //if user exists, send him offer details
            var userToSendOfferTo = connectedUsers[data.name];

            if(userToSendOfferTo != null)
            {
                connection.otherName = data.name;
                sendTo(userToSendOfferTo, {
                    type: "offer",
                    offer: data.offer,
                    name: connection.name
                });
            }
            break;
        
        case "answer":
            console.log("Sending answer to user: " + data.name);

            var userToSendAnswerTo = connectedUsers[data.name];

            if(connection != null){
                connection.otherName = data.name;
                sendTo(userToSendAnswerTo, {
                    type: "answer",
                    answer: data.answer
                });
            }
            break;
            
        case "iceCandidate":
            console.log("Sending iceCandidate to: " + data.name);
            var targetOfIceCandidate = connectedUsers[data.name];

            if(targetOfIceCandidate != null){
                sendTo(targetOfIceCandidate, {
                    type: "iceCandidate",
                    Candidate: data.Candidate
                });
            } 
            break;

        case "leave":
            console.log("Disconnecting from: " + data.name);
            var connToDisconnectFrom = connectedUsers[data.name];
            connToDisconnectFrom.otherName = null;
            // notify user so he can disconnect peer connection
            if(connToDisconnectFrom != null){
                sendTo(connToDisconnectFrom,{
                    type: "leave"
                });
            }
            break;

        default:
            sendTo(connection, {
                type: "error",
                message: "Command not found: " + data.type
            });
            break;
    }
});

    connection.on("close", function(){
        if(connection.name)
        {
            delete connectedUsers[connection.name];
        
            if(connection.otherName)
            {
                console.log("Disconnecting from " + connection.otherName);
                var disconnectedConn = connectedUsers[connection.otherName];
                disconnectedConn.otherName = null;

                if(disconnectedConn != null){
                    sendTo(disconnectedConn, {
                        type: "leave"
                    });
                }
            }
        }
    });
	
});

function sendTo(connection, message) { 
    connection.send(JSON.stringify(message)); 
 }