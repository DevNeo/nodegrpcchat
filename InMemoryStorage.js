var redis = require("redis"),
clientRedis = redis.createClient(6379, 'redis');
clientRedis.on("error", function (err) {
    console.log("Error " + err);
});
var async = require('async');

module.exports = {
	//DOC : Init data stored in redis when the server starts.	
	initDataFromStorage: function(callBackResult){
	clientRedis.once('ready', function() {
		async.parallel({
      		one: function(callback) {

     		 clientRedis.get('chat_users', function(err, reply) {
 					if(err)
 					{

 					}
      			else if(reply) {
        			callback(null, reply);
        			}
      		});
      	},
    		two: function(callback) {
        	clientRedis.get('chat_app_messages', function(err, reply) {
    		if (reply) {
        		callback(null, reply);
     		}
    	});
    	}
  	},  function(err, results) {


  		console.log(results);
  	callBackResult(null,results);
   		});
	});

	},
	//DOC : Store data in redis with given key. 
	storeDataWithKey: function(key,data,callBackResult){
		clientRedis.set(key, JSON.stringify(data));
 		callBackResult("","sucess");
	},

	//DOC : Get data from redis with given key.
	getDataWithKey:function(key,callBackResult){
		clientRedis.get(key, function(err, reply) {
      			if (reply) 	
        			callBackResult(null,reply);
        			});
	}
}