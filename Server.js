let grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");
var fs = require('fs');
var utils = require("./Utils.js");
var inMemoryStorage = require("./InMemoryStorage.js");
var offlineStorage = require("./OfflineStorage.js");
var mongo = require('mongodb').MongoClient;

var userObj = require("./User.js"); //This will be stored in redis
const server = new grpc.Server();
const jwt = require('jsonwebtoken');

// Store people in chatroom
var chatters = [];
// Store messages in chatroom
var chat_messages = [];

//Configuration setting
const SERVER_ADDRESS = "0.0.0.0:5001";
var SECRET_KEY = "secretkey";
var MAX_MSG_LIMIT = 4; //In kbs
var MIN_TIME_BETWEEN_MSGS = 5; //In secs
var user_list_json_db = [];

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
  console.log("Login with"+ call.request.userId + " " + call.request.password);
  var user = call.request;
  if(authenticateUser(call.request.userId,call.request.password) == true)
  {
      jwt.sign(user,'secretkey',(err,token)=>{
      var person = new userObj.Person(call.request.userId,call.request.password);
      console.log("User details " + person.name + " " + person.pass);    
      userMap.set(call.request.userId,person);
      //REDIS
      chatters.push(call.request.userId);
      inMemoryStorage.storeDataWithKey("chat_users",chatters,function(err,result){
      });
     /*inMemoryStorage.storeChatters(chatters,function(err,result){
        console.log("Chatters updated in redis");
      });*/
      //clientRedis.set('chat_users', JSON.stringify(chatters));

      callback(null,{status:"success",jwtToken:token});
    });
  }
  else
  {
    callback(new Error('failed'),null);
  }

}

function authenticateUser(userid,password){  
  //TODO : Use mongo db for storing user values.
  for (var i = 0; i < user_list_json_db.length; i++) {
      userDetails = user_list_json_db[i];
      if(userid == userDetails.user.uname && password == userDetails.user.pwd)
      {
          return true;
      }
    }

  return false;
}

function sendMessage(call,callback){
  console.log(" " + call.request.recipientUserId +  "  " + call.request.messagesent + "  " + call.request.jwtToken);

  if(utils.isUtfString(call.request.messagesent) == false) {
     console.log(" Unicode test failure");
     callback(new Error('failed'),null);
  }
  else if(utils.getSizeOfStringInKB(call.request.messagesent) > MAX_MSG_LIMIT){ 
     console.log(" Size test failure");
     callback(new Error('failed'),null);
  }
  else{
  console.log(" sendMessage Verfied");
  jwt.verify(call.request.jwtToken,'secretkey',(err,authData)=>{
    if(err){
      callback(new Error('failed'),null);
    }
    else{
        var personData = userMap.get(authData.userId);
        if(personData.dequeue.length >=3){
          value = personData.dequeue.first();
          var timePassedLastButThirdMessg = utils.getTimePassedInSeconds() - value; 
          if(timePassedLastButThirdMessg < 5){
            callback(new Error('Mssg will not be entertained'),null);
          }
          else{
            personData.dequeue.shift();
            personData.dequeue.push(utils.getTimePassedInSeconds());
          }
          console.log("dequeue after operation" + personData.dequeue.length);
       }
       else{
          console.log("Time inseconds passed"+ utils.getTimePassedInSeconds());
          personData.dequeue.push(utils.getTimePassedInSeconds());
       }

        callback(null,{status:"success"});
        notifyChat(authData.userId,call.request.recipientUserId,call.request.messagesent);
    }
  });
 }
}

function notifyChat(senderId,recieverId,message) { 
  var recvPresent = false;
  console.log("Number of users connected : "+ usersId.length);
  console.log("SenderId: "+senderId + " ReceiverId: " + recieverId);

  //Store in redis.
  chat_messages.push({"reciever": recieverId,"sender":senderId,"msg":message});

  inMemoryStorage.storeDataWithKey('chat_app_messages',chat_messages,function(err,result){
    console.log("Data inserted in redis");
  });

  inMemoryStorage.getDataWithKey('chat_app_messages',function(err,result){

    console.log(result);

  });
  /*inMemoryStorage.storeMessageData(chat_messages,function(err,result){

  });*/ 

 // clientRedis.set('chat_app_messages', JSON.stringify(chat_messages));

  //TODO : Use map instead of a list.
  for(var i=0;i<usersId.length;i++)
  {
      if(usersId[i] == recieverId)
      {
         recvPresent = true;
         console.log("Data written in "+ recieverId + " stream");
         users[i].write({senderUserId:senderId,messageRecv:message})
      }
  }

  if(recvPresent == false){
      offlineStorage.storeMessage(senderId,recieverId,message,function(err, result){
      if(err)
      {
        console.log("Unable to store messages");
        throw err;
      }
      else
      {
        console.log("Message stored in offline storage");
      }
    }); 
    console.log("Reciever is not connected");
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
        console.log("Recieve message verfied for :" + authData.userId);
        users.push(call);  
        usersId.push(authData.userId);
        offlineStorage.getLastNMessages(authData.userId,function(err,result){
        if(err)
        {

        }
        else
        {  
          console.log(result);
          console.log("Size of stored messages to be sent "+ result.length);
          console.log("Sending messages that are stored to ..."+ authData.userId);
          for(i=0;i<result.length;i++)
          {
             notifyChat(result[i].sender,result[i].reciever,result[i].msg);
          }
        }
        });
    }
  });
}

server.addService(proto.example.Chat.service, { login: login,sendMessage: sendMessage,receiveMessage:receiveMessage});
server.bind(SERVER_ADDRESS, grpc.ServerCredentials.createInsecure());

//TODO : Make it as argument.
var db_path = "db/chat_authen_db.json";
fs.readFile(db_path, function(error, data) {
    if (error) throw err;
    user_list_json_db = JSON.parse(data);
    var userDetails;
    // Check if there is already a feature object for the given point
    console.log("List of users in database ");
    for (var i = 0; i < user_list_json_db.length; i++) {
      userDetails = user_list_json_db[i];
      console.log("User name :" + userDetails.user.uname +" Password : "+ userDetails.user.pwd+"  Status :" + userDetails.status);
    }

  });



//offlineStorage.createStorage();
server.start();
inMemoryStorage.initDataFromStorage(function(err,result){
  //console.log(result.one);
  chatters = JSON.parse(result.one);
  console.log(chatters);

  //console.log(result.two);
  chat_messages = JSON.parse(result.two);
  console.log(chat_messages);
});



process.on("uncaughtException",function(error){
  console.log("Exception caught"+error);
});

