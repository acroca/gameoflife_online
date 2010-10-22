var http = require('http'), 
    fs = require('fs'),
    url = require('url'),
    querystring = require('querystring'),

    mongodb_path = "./node-mongodb-native/lib/mongodb",
    Db = require(mongodb_path).Db,
    Connection = require(mongodb_path).Connection,
    Server = require(mongodb_path).Server,
    // BSON = require(mongodb_path).BSONPure,
    BSON = require(mongodb_path).BSONNative,

settings = {
    port: 8080,
    mongodb: {
        host: "localhost",
        port: Connection.DEFAULT_PORT
    }
}

send404 = function(res){
    res.writeHead(404);
    res.write('404');
    res.end();
};

var db = new Db('game-of-life-online', 
                new Server(settings.mongodb.host, settings.mongodb.port, {}), {native_parser:true});

// db.open(function(err, db) {
//     db.dropDatabase(function(err, result) {
//         db.collection('test', function(err, collection) {
//             // Erase all records from the collection, if any
//             collection.remove(function(err, collection) {
//                 // Insert 3 records
//                 for(var i = 0; i < 3; i++) {
//                     collection.insert({'a':i});
//                 }
//             });
//         });
//     });
// });

http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;
    console.info("Request received: "+req.url);


    switch (path){
    case '/update.js':
        update_game(req,res);
        break;
    case '/add.js':
        add_cell(req,res);
        break;


    case '/':
        path = "/index.html"
    case "/index.html":
    case "/application.js":
    case "/jquery-1.4.3.min.js":
    case "/style.css":
	fs.readFile(__dirname + path, function(err, data){
	    if (err) return send404(res);
            res.writeHead(200, {'Content-Type': 'text/html'});
	    res.write(data, 'utf8');
	    res.end();
	});
	break;
    default: send404(res);
    }
}).listen(settings.port, "127.0.0.1");

console.log('Server running at http://127.0.0.1:'+settings.port+'/');


var update_game = function(req, res){
    
}
var add_cell = function(req, res){

    // TODO: I always get 20,20. It's a problem in application.js.
    params = url.parse(req.url, true).query;
    db.open(function(err, db) {
        db.collection('cells', function(err, collection) {
            collection.insert({'row': params.row, 'col': params.col});
        });
    });
}