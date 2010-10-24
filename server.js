var http = require('http'), 
    fs = require('fs'),
    url = require('url'),
    querystring = require('querystring'),
    sys = require("sys"),
    Gol = require("./gol.js"),

    // MongoDB requires
    mongodb_path = "./node-mongodb-native/lib/mongodb",
    Db = require(mongodb_path).Db,
    Connection = require(mongodb_path).Connection,
    Server = require(mongodb_path).Server,
    // BSON = require(mongodb_path).BSONPure,
    BSON = require(mongodb_path).BSONNative,


   // Websockets requires
   io = require('./io-node'),

settings = {
    port: 8080,
    mongodb: {
        host: "localhost",
        port: Connection.DEFAULT_PORT
    },
    size: {
        x: 10,
        y: 10
    },
    steps_time: 5000
}

send404 = function(res){
    res.writeHead(404);
    res.write('404');
    res.end();
};

var next_step_at = 0;

var db = new Db('game-of-life-online', new Server(settings.mongodb.host, settings.mongodb.port, {}), {native_parser:true})
db.open(function(e, db) {}) 

var game = new Gol(db, settings.size.x, settings.size.y);

db.dropDatabase(function() {});

var server = http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;
    console.info("Request received: "+req.url);

    switch (path){
    case '/update.js':
        update_game(req,res);
        break;
    case '/setup.js':
        res.writeHead(200, {'Content-Type': 'text/javascript'});
	res.write(JSON.stringify({
            size: {
                x: settings.size.x,
                y: settings.size.y
            }
        }), 'utf8');
	res.end();
        break;
        
    case '/':
    case "/index.html":
        staticHandler(req,res, "/index.html", "text/html");
        break;
    case "/application.js":
    case "/jquery-1.4.3.min.js":
        staticHandler(req,res, path, "text/javascript");
        break;
    case "/style.css":
        staticHandler(req,res, path, "text/css");
        break;
    default: send404(res);
    }
})
server.listen(settings.port, "127.0.0.1");

console.log('Server running at http://127.0.0.1:'+settings.port+'/');


// server = http.createServer(function(req, res){
//     // your normal server code
//     res.writeHeader(200, {'Content-Type': 'text/html'});
//     res.writeBody('<h1>Hello world</h1>');
//     res.finish();
// });

// socket.io, I choose you
var socket = io.listen(server);
socket.on('connection', function(client){
    
    client.on('message', function(message){
        if(message.new_cell){
            add_cell(message.new_cell.row, message.new_cell.col);
            to_send = {
                new_cell: {
                    row: message.new_cell.row,
                    col: message.new_cell.col
                }
            }
            client.send(to_send);
            client.broadcast(to_send);
        }
    });

});


//-----------------------------------------------------------------------------------

var staticHandler = function(req,res, path, content_type){
    fs.readFile(__dirname + path, function(err, data){
	if (err) return send404(res);
        res.writeHead(200, {'Content-Type': content_type});
	res.write(data, 'utf8');
	res.end();
    });
}

var update_game = function(req, res){
    db.collection('cells', function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.toArray(function(err, cells) {
                res.writeHead(200, {'Content-Type': 'text/javascript'});
                
                res.write(JSON.stringify({
                    cells: cells, 
                    next_step_at: next_step_at
                }), 'utf8');
                res.end();
            });
        });
    });
};

var add_cell = function(row, col){
    db.collection('cells', function(err, collection) {
        collection.insert({'row': row, 'col': col});
    });
}

var step = function(){
    game.step();
    setTimeout(step, settings.steps_time);
    next_step_at = Number(new Date()) + settings.steps_time;
}
step()