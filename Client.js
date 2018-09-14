let grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");
var readline = require("readline");
const args = require("args-parser")(process.argv)

//Read terminal Lines
var rl = readline.createInterface({
                                  input: process.stdin,
                                  output: process.stdout
                                  });

//Load the protobuf
var proto = grpc.loadPackageDefinition(
                                       protoLoader.loadSync("protos/chat.proto", {
                                                            keepCase: true,
                                                            longs: String,
                                                            enums: String,
                                                            defaults: true,
                                                            oneofs: true
                                                            })
                                       );

const REMOTE_SERVER = "0.0.0.0:5001";

var username = "";
var pass = ""
var token = "";
var user1 = false;
var friendName = "";
//Create gRPC client
let client = new proto.example.Chat(
                                    REMOTE_SERVER,
                                    grpc.credentials.createInsecure()
                                    );

//Start the stream between server and client
function startChat() {
      client.login({ userId: username,password : pass},function(err,response){
      if(err)
      { 
          console.log(err +  "Login failed");
      }
      else
      {

          console.log("Login sucess with token" + response.jwtToken);
          token = response.jwtToken;
          
          let channel = client.receiveMessage({jwtToken:token});
       
          channel.on('data', function(message) {
               console.log(message.senderUserId + " : "+ message.messageRecv);
           });
          channel.on('end', function() {
          // The server has finished sending
           });
          channel.on('error', function(e) {

          // An error has occurred and the stream has been closed.
           });
          channel.on('status', function(status) {
          // process status
          });

          rl.on("line", function(text) {
          client.sendMessage({recipientUserId: friendName ,messagesent:text,jwtToken:token},function(err,response){
            if(err)
            {
              console.log("Send message failed error" + err);
            }
            else{
                	console.log(username +" : " + text);
                  console.log("Send message " + response.status);
              }
          });		
  			});	
      }
    });
}

rl.question("What's ur name? ", answer => {
	  username = answer;

  	rl.question("What's ur password? ", answer => {
 		pass = answer;

   	rl.question("Enter friend name to chat", answer => {
  	friendName = answer;
		startChat();
		});
	});
});


//Test Cases 1:
var x = 0;
function sendMessageInIntervalsData()
{

++x;
  client.sendMessage({recipientUserId: friendName ,messagesent:"Message to be sent"+ x,jwtToken:token},function(err,response){
              if(err)
              {
                console.log("Send message failed error" + err);
              }
              else
              {
                  console.log("Send message " + response.status);
              }
          });

}