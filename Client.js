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
               console.log('Found feature called "' + message.senderUserId + message.messageRecv);
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

          //Send message to the other client.
          client.sendMessage({recipientUserId: "neo" ,messagesent:"Message to be sent",jwtToken:response.jwtToken},function(err,response){
            if(err)
            {
              console.log("Send message failed error" + err);
            }
            else{
                
                  console.log("Send message " + response.status);
              }
          });
        
      }
    });


      if(user1)
      {    
        setInterval(sendMessageInIntervalsData,3000);
      }
      else
      {
        
      }
       

}


var x = 0;
function sendMessageInIntervalsData()
{

++x;
  client.sendMessage({recipientUserId: "rohan" ,messagesent:"Message to be sent"+ x,jwtToken:token},function(err,response){
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

if (args.a) {
    // Do something
    user1 = true ;
    username = "suraj";
    pass = "dev";
    console.log("playe1");
}
else
{
  username = "rohan";
  pass = "123456";
  console.log("player2");
}

startChat();