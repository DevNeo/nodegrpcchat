let grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");
var fs = require('fs');
var Dequeue = require('dequeue');
var utils = require("./Utils.js");
var offlineStorage = require("./OfflineStorage.js");
var userObj = require("./User.js"); //This will be stored in redis
const server = new grpc.Server();
const jwt = require('jsonwebtoken');

const SERVER_ADDRESS = "0.0.0.0:5001";
var SECRET_KEY = "secretkey";
var MAX_MSG_LIMIT = 4; //In kbs
var MIN_TIME_BETWEEN_MSGS = 5; //In secs

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
var userMap = new Map()

function login(call,callback){
   //Check if user blob is present otherwise create a user blob
  console.log("Login with"+ call.request.userId + " " + call.request.password);
  var user = call.request;
  if(authenticateUser(call.request.userId,call.request.password) == true)
  {
      jwt.sign(user,'secretkey',(err,token)=>{
      var person = new userObj.Person(call.request.userId,call.request.password);
      console.log("User details " + person.name + " " + person.pass);    
      userMap.set(call.request.userId,person);
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

function sendMessage(call,callback){
  console.log(" " + call.request.recipientUserId +  "  " + call.request.messagesent + "  " + call.request.jwtToken);

  if(utils.isUtfString(call.request.messagesent) == false) 
  {
   console.log(" Unicode test failure");
     callback(new Error('failed'),null);
     return;
  }
  else if(utils.getSizeOfStringInKB(call.request.messagesent) > MAX_MSG_LIMIT)
  { 
   console.log(" size test failure");
     callback(new Error('failed'),null);
     return;
  }

  console.log(" sendMessage Verfied");
  jwt.verify(call.request.jwtToken,'secretkey',(err,authData)=>{
    if(err)
    {
      callback(new Error('failed'),null);
    }
    else
    {
        var personData = userMap.get(authData.userId);
        if(personData.dequeue.length >=3)
        {
          value = personData.dequeue.first();
          var timePassedLastButThirdMessg = utils.getTimePassedInSeconds() - value; 
          if(timePassedLastButThirdMessg < 5)
          {
            callback(new Error('Mssg will not be entertained'),null);
            return;
          }
          else
          {
            personData.dequeue.shift();
            personData.dequeue.push(utils.getTimePassedInSeconds());
          }
          console.log("dequeue after operation" + personData.dequeue.length);

       }
       else
       {
          console.log("Time inseconds passed"+ utils.getTimePassedInSeconds());
          personData.dequeue.push(utils.getTimePassedInSeconds());
          console.log("Time inseconds passed dequeue"+ utils.getTimePassedInSeconds());
          
       }

        callback(null,{status:"success"});
        notifyChat(authData.userId,call.request.recipientUserId,call.request.messagesent);
    }
  });
}

function notifyChat(senderid,recieverId,message) { 
  var recvPresent = false;
  console.log("Number of users connected : "+ usersId.length);
  console.log("Number of users connected : "+ recieverId);
  for(var i=0;i<usersId.length;i++)
  {
   console.log("User "+ usersId[i]);
  
      if(usersId[i] == recieverId)
      {
        console.log(recieverId +" sent message");
         recvPresent = true;
         console.log("Data written in stream");
         users[i].write({senderUserId:senderid,messageRecv:message})
      }
  }

  if(recvPresent == false){
    //TODO : Sending last stored message .
    //offlineStorage.storeMessage(senderid,recieverId,message,Utils.getTimePassedInSeconds());
  }
  else
  {
    console.log("Reciever message sent"); 
  }
}

function receiveMessage(call,callback)
{
    jwt.verify(call.request.jwtToken,SECRET_KEY,(err,authData)=>{
    if(err)
    {
      console.log("Error in recieve message");
    }
    else
    {
        console.log("recvMessage verified");
        users.push(call);  
        usersId.push(authData.userId); 
       
        /*
        TODO : Getting last 10 messages from db.
        offlineStorage.findAll();
        if(result.length > 0)
        {
          for(var i=0;i<result.length;i++)
          {
            notifyChat(result[i].senderid,result[i].recieverId,result[i].message);
          }
        }*/
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


offlineStorage.createStorage();
server.start();