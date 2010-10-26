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
db.open(function(e, db) {
    db.dropCollection('cells', function(err, result) {
        db.collection('cells', function(err, collection) {
            collection.ensureIndex([['row', 1], ['col', 1]], true, function(err, indexName) {
            });
        });
    });
});



var game = new Gol(db, settings.size.x, settings.size.y);

var server = http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;

    switch (path){
        
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
server.listen(settings.port);

console.log('Server running at http://0.0.0.0:'+settings.port+'/');

var socket = io.listen(server);

var clientIds = [];
socket.on('connection', function(client){
    clientIds.push(client.sessionId);
    client.broadcast({
        player_connected: client.sessionId
    });
    client.send({
        setup:{
            size: {
                x: settings.size.x,
                y: settings.size.y
            },
            players: clientIds
        }
    });

    game.all_cells(function(collection){
        send_new_cells(collection, client);
    });

    

    client.on('message', function(message){
        if(message.new_cell){
            message.new_cell.owners = [client.sessionId];
            game.add_cells([message.new_cell]);
        }
    });
    client.on('disconnect', function(){
        client.broadcast({
            player_disconnected: client.sessionId
        });
        var i = clientIds.indexOf(client.sessionId);
        clientIds.splice(i,1);
    });
});
game.on("cells_added", function(collection){
    send_new_cells(collection);
});
game.on("cells_removed", function(collection){
    send_removed_cells(collection);
});

var send_new_cells = function(collection, client){
    if(collection.length == 0)
        return;
    to_send = {new_cells: []}
    
    collection.forEach(function(cell){
        to_send.new_cells.push(cell_hash(cell));
    });
    if(client != undefined)
        client.send(to_send);
    else
        socket.broadcast(to_send);
}
var send_removed_cells = function(collection, client){
    if(collection.length == 0)
        return;
    to_send = {removed_cells: []}
    
    collection.forEach(function(cell){
        to_send.removed_cells.push(cell_hash(cell));
    });
    if(client != undefined)
        client.send(to_send);
    else
        socket.broadcast(to_send);
}
var cell_hash = function(cell){
    return {
        row: cell.row,
        col: cell.col,
        owners: cell.owners
    };
}

//-----------------------------------------------------------------------------------

var staticHandler = function(req,res, path, content_type){
    fs.readFile(__dirname + path, function(err, data){
	if (err) return send404(res);
        res.writeHead(200, {'Content-Type': content_type});
	res.write(data, 'utf8');
	res.end();
    });
}

var step = function(){
    game.step();
    setTimeout(step, settings.steps_time);
    next_step_at = Number(new Date()) + settings.steps_time;
}
step()