var redis = require("redis"),
clientRedis = redis.createClient(6379, 'redis');
clientRedis.on("error", function (err) {
    console.log("Error " + err);
});
var async = require('async');

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


  		console.log(results);
  	callBackResult(null,results);
   		});
	});

	},
	storeDataWithKey: function(key,data,callBackResult){
		clientRedis.set(key, JSON.stringify(data));
 		callBackResult("","sucess");
	},
	getDataWithKey:function(key,callBackResult){
		clientRedis.get(key, function(err, reply) {
      			if (reply) 	
        			callBackResult(null,reply);
        			//chatters = JSON.parse(reply);
        			//console.log("get chat users from redis data store");
        			//console.log(chatters);
      			});
	}

}