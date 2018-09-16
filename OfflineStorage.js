//Implements functions to store data offline .
var DB_NAME = "messagedb"
var COLLECTION_NAME = "userchattable"

var mongo = require('mongodb').MongoClient;
var DB_NAME = "chatdb"
var COLLECTION_NAME = "conversation"
var COLLECTION_NAME_RECIEVER_FIELD = "receiver"
var MESSAGE_COUNT_OFFLINE_STORAGE = 3;

var url = "mongodb://localhost:27017/"+DB_NAME;


var disableOfflineStorage = true;


module.exports = {
	storeMessage: function(senderId,recieverId,message,callback){
		mongo.connect("mongodb://localhost:27017/"+DB_NAME,{ useNewUrlParser: true },function(err,db){
    if(err){
      console.log("Unable to connect mongo");
      callback(new Error('failed'),null);	
      //throw  err;
    }
    else if (db){
        var database = db.db(DB_NAME);
        let chat = database.collection(COLLECTION_NAME);
        //Find all check if the count is greater than 10.
        console.log("getting data for "+ recieverId);
        var id = recieverId;
        var query = { "reciever" : id}; 
        var mysort = { "_id": 1 };
        chat.find(query).sort(mysort).toArray(function(err, result){
          console.log(result);
          console.log("Size of receiver messages " + result.length);
              if(result.length < MESSAGE_COUNT_OFFLINE_STORAGE)
              {
                    console.log("Size is smaller than "+ MESSAGE_COUNT_OFFLINE_STORAGE + " Inserttingg..." );
                    chat.insertOne({reciever:recieverId,sender:senderId,msg:message},function(err,result){
                    	if(err)
                    	{

                    		throw err;
                    	}
                    	else
                    	{

                    	}
                    	
                    });  
                                         
              }
              else
              {
                      console.log("Size is greater than "+ MESSAGE_COUNT_OFFLINE_STORAGE + " Updating..." );
                      console.log("Updating id "+ result[0]._id);
                              
                      //Delete this one and add new one.   
                      var myquery = {"_id":result[0]._id};
                              //var newvalues = { $set: {msg:message} };
                              chat.deleteOne(myquery, function(err, obj) {

                                  chat.insertOne({reciever:recieverId,sender:senderId,msg:message},function(err,result){
                                  	database.close();
                                  }); 

                              });

                }

        });
        callback(null,{status:"success"});
      }
      else
      {
         console.log("Somthing is wrong!!");   
      }
    });	
	},
	getLastNMessages:function(userId,callback){
		mongo.connect("mongodb://localhost:27017/"+DB_NAME,{ useNewUrlParser: true },function(err,db){
    	if(err){
      		console.log("Unable to connect mongo");
      		callback(new Error('failed'),null);	
      		//throw  err;
    	}
    	else if (db){
    		console.log("Getting last n messages...");
    		var database = db.db(DB_NAME);
       		let chat = database.collection(COLLECTION_NAME);
       		var id = userId;
        	var query = { "reciever" : id}; 
        	var mysort = { "_id": 1 };
        	chat.find(query).sort(mysort).toArray(function(err, result){
        		console.log(result);
        		db.close();
        		callback(null,result);


        	});	
		}
	});
	},	
	deleteAllMessagesWithId:function(userId,callback){
		mongo.connect("mongodb://localhost:27017/"+DB_NAME,{ useNewUrlParser: true },function(err,db){
    	if(err){
      		console.log("Unable to connect mongo");
      		callback(new Error('failed'),null);	
      		//throw  err;
    	}
    	else if (db){
    		var database = db.db(DB_NAME);
       		let chat = database.collection(COLLECTION_NAME);
       		var id = userId;
        	var query = { "reciever" : id}; 
        	chat.deleteMany(query, function(err, obj) {
    			if (err) throw err;
    			console.log(obj.result.n + " document(s) deleted");
    			db.close();
  			});
		}
	});
	},
	printAllMessagesWithId:function(userId,callback){
		mongo.connect("mongodb://localhost:27017/"+DB_NAME,{ useNewUrlParser: true },function(err,db){
    	if(err){
      		console.log("Unable to connect mongo");
      		callback(new Error('failed'),null);	
      		//throw  err;
    	}
    	else if (db){
    		var database = db.db(DB_NAME);
       		let chat = database.collection(COLLECTION_NAME);
       		var id = userId;
        	var query = { "reciever" : id}; 
        	chat.find().toArray(function(err, result) {
    			if (err) throw err;
    			console.log(result);
    			db.close();
  			});
		}
	});

	}
	
}
