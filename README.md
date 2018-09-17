
# Node js based GRPC chat uses Redis for in-memory storage.MongoDb for offline storage.


# nodegrpcchat with docker

# Prerequisites
Docker should be installed.


# Steps 
 - docker-compose build

 - docker-compose up 

 - Start client:

    ``$ node client``
    Enter valid user name password and friends name


============================================================================================================================


# nodegrpcchat without docker

# Prerequisites
- Node js should be installed in machine .
- brew install node.
- Install Redis.Start redis server.
- Install mongodb.Start mongod server.

# Steps 

 - Install Modules:

    ``$ npm install``
    
    
- Start Server:

    ``$ node server``
    Will start the server and provide list of valid username and password.


- Start client:

    ``$ node client``
    Enter valid user name password and friends name

===========================================================================================================================

# Testing : 
- Start client:
  Test all the apis and functionality by running 2 clients.
  

    

