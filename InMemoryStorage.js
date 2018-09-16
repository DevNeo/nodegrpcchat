var redis = require("redis"),
clientRedis = redis.createClient();
clientRedis.on("error", function (err) {
    console.log("Error " + err);
});

// Store people in chatroom
//var chatters = [];
// Store messages in chatroom
//var chat_messages = [];


module.exports = {
	initDataFromStorage: function(callBackResult){
	clientRedis.once('ready', function() {
		async.parallel({
      		one: function(callback) {

     		 clientRedis.get('chat_users', function(err, reply) {
      			if (reply) {
        			callback(null, reply);
        			//chatters = JSON.parse(reply);
        			//console.log("get chat users from redis data store");
        			//console.log(chatters);
      			}
      		});
      	},
    		two: function(callback) {
       
        	clientRedis.get('chat_app_messages', function(err, reply) {
    		if (reply) {
        		callback(null, reply);
       			// chat_messages = JSON.parse(reply);
       			// console.log("get char messages from redis data store")
       			// console.log(chat_messages);
    		}
    	});
    	//    callback(null, 'xyz\n');
    	}
  	},  function(err, results) {
  	callBackResult(null,results);
   		});
	});

	},
	storeMessageData: function(chatmessages,callBackResult)
	{
		//chat_messages.push({"reciever": recieverId,"sender":senderId,"msg":message});
 		clientRedis.set('chat_app_messages', JSON.stringify(chat_messages));
 		callBackResult("","sucess");
	},
	storeChatters: function (chatters,callBackResult)
	{
		//chatters.push(userId);
      	clientRedis.set('chat_users', JSON.stringify(chatters));
      	callBackResult("","sucesss");
	},
	getDataWithKey:function(key,callBackResult){
		clientRedis.get(key, function(err, reply) {
      			if (reply) {	
        			callBackResult(null,reply);
        			//chatters = JSON.parse(reply);
        			//console.log("get chat users from redis data store");
        			//console.log(chatters);
      			}
      		});
	}



}