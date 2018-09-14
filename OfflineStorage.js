//Implements functions to store data offline .
var DB_NAME = "messagedb"
var COLLECTION_NAME = "userchattable"

var mongo = require('mongodb');
var mongoclient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/"+DB_NAME;

var disableOfflineStorage = true;


module.exports = {
	createStorage: function(callback){
			if(disableOfflineStorage) return;

			mongoclient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db(DB_NAME);
			dbo.collectionNames(collName, function(err, names) {
				if(names.length > 0)
				{
						console.log("Collection already exist! ");
				}
				else
				{
					dbo.createCollection(COLLECTION_NAME, function(err, res) {
					assert.equal(err, null);	
					console.log("Collection created!");
					db.close();
					callback(res);
					});
				}
    	});			
		});
	},
	storeMessage: function(senderId,recieverId,message,time,callback){
		if(disableOfflineStorage) return;
		mongoclient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db(DB_NAME);
		var numberOfMessages = findAll();
		if(numberOfMessages.length>=10) {
			try{ 	
			var result = sort(-1);
			}catch(err)
			{
				db.close();
				return;
			}
			try{ 	
				delete(result[9].timestamp);
			}
			catch(err)
			{
				db.close();
				return;
			}
		}
		else
		{
			console.log("Dont do anything ");   
		}

		var myobj = { sender: senderId, reciever: recieverId,sentmsg : message,timestamp: time};
		dbo.collection(COLLECTION_NAME).insertOne(myobj, function(err, res) {
		assert.equal(err, null);	
		db.close();
	  callback(res);
		});
		});
	},
	sort : function(dbo,ascOrDesc,callback){
		if(disableOfflineStorage) return;
		mongoclient.connect(url, function(err, db) {
		if (err) throw err;
		//var dbo = db.db(DB_NAME);
		var mysort = { timestamp: ascOrDesc };
		dbo.collection(COLLECTION_NAME).find().sort(mysort).toArray(function(err, result) {
		assert.equal(err, null);	
		callback(result);
				
			});
		});
	},
	findAll : function(callback){
		if(disableOfflineStorage) return;
		mongoclient.connect(url, function(err, db) {
		if (err) throw err;
		 var dbo = db.db(DB_NAME);
		dbo.collection(COLLECTION_NAME).find({}).toArray(function(err, result) {
			assert.equal(err, null);	
			db.close();
			callback(result);
			//console.log(result);
			
		});
		});
	},
	delete : function(dbo,time,callback){
		if(disableOfflineStorage) return;
		mongoclient.connect(url, function(err, db) {
		if (err) throw err;
		//var dbo = db.db(DB_NAME);
		var myquery = { timestamp: time };
		dbo.collection(COLLECTION_NAME).deleteOne(myquery, function(err, obj) {
			assert.equal(err, null);
			callback(obj);
			//db.close();
		});
		});

	}
	
}
