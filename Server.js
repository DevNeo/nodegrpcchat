let grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");
const jwt = require('jsonwebtoken');
var fs = require('fs');

const server = new grpc.Server();
const SERVER_ADDRESS = "0.0.0.0:5001";

var SECRET_KEY = "secretkey";
var user_list = [];

// Load protobuf
let proto = grpc.loadPackageDefinition(
                                       protoLoader.loadSync("protos/chat.proto", {
                                                            keepCase: true,
                                                            longs: String,
                                                            enums: String,
                                                            defaults: true,
                                                            oneofs: true
                                                            })
                                       );


let users = [];
let usersId = [];

function login(call,callback){
  console.log("Login with"+ call.request.userId + " " + call.request.password);
  
  var user = call.request;
  //Check for user id and password asynchronously.
  if(authenticateUser(call.request.userId,call.request.password) == true)
  {
    jwt.sign(user,'secretkey',(err,token)=>{
      console.log(token);
      callback(null,{status:"success",jwtToken:token});
    });
  }
  else
  {
    callback(new Error('failed'),null);
  }

}

function authenticateUser(userid,password,){
  for (var i = 0; i < user_list.length; i++) {
      userDetails = user_list[i];
      if(userid == userDetails.user.uname && password == userDetails.user.pwd)
      {
          return true;
      }
    }

  return false;
}

function receiveMessage(call,callback)
{
    jwt.verify(call.request.jwtToken,SECRET_KEY,(err,authData)=>{
    if(err)
    {
    }
    else
    {
        console.log("recvMessage verified");
        users.push(call);  
        usersId.push(authData.userId);   
    }
  });
}

function notifyChat(senderid,recieverId,message) {  
  for(var i=0;i<usersId.length;i++)
  {
      if(usersId[i] == recieverId)
      {
         console.log("Data written in stream");
         users[i].write({senderUserId:senderid,messageRecv:message})
      }
  }
}

var messageList = {};
function sendMessage(call,callback){
  console.log(" " + call.request.recipientUserId +  "  " + call.request.messagesent + "  " + call.request.jwtToken);
  //
  jwt.verify(call.request.jwtToken,'secretkey',(err,authData)=>{
    if(err)
    {
      callback(new Error('failed'),null);
    }
    else
    {
        //messageList.push({})
        notifyChat(authData.userId,call.request.recipientUserId,call.request.messagesent);
        console.log(""+ authData.userId);
        console.log(""+ authData.password);
    }
  });
}

server.addService(proto.example.Chat.service, { login: login,sendMessage: sendMessage,receiveMessage:receiveMessage});
server.bind(SERVER_ADDRESS, grpc.ServerCredentials.createInsecure());

//TODO : Make it as argument.
var db_path = "db/chat_authen_db.json";
fs.readFile(db_path, function(err, data) {
    if (err) throw err;
    user_list = JSON.parse(data);
    var userDetails;
    // Check if there is already a feature object for the given point
    for (var i = 0; i < user_list.length; i++) {
      userDetails = user_list[i];
      //console.log(userDetails.user.uname +" "+ userDetails.user.pwd+" " + userDetails.status);
    }

  });
server.start();