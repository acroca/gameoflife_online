var http = require('http'), 
    fs = require('fs'),
    url = require('url'),
    querystring = require('querystring'),
    sys = require("sys"),

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


var db = new Db('game-of-life-online', new Server(settings.mongodb.host, settings.mongodb.port, {}), {native_parser:true})
db.open(function(e, db) {}) 


db.dropDatabase(function() {});

http.createServer(function (req, res) {
    var path = url.parse(req.url).pathname;
    // console.info("Request received: "+req.url);

    switch (path){
    case '/update.js':
        update_game(req,res);
        break;
    case '/step.js':
        step();
        res.writeHead(200, {'Content-Type': 'text/javascript'});
	res.write("", 'utf8');
	res.end();
        break;
    case '/add.js':
        add_cell(req,res);
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
}).listen(settings.port, "127.0.0.1");

console.log('Server running at http://127.0.0.1:'+settings.port+'/');


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
                res.write(JSON.stringify(cells), 'utf8');
                res.end();
            });
        });
    });
}

var add_cell = function(req, res){

    params = url.parse(req.url, true).query;
    
    db.collection('cells', function(err, collection) {
        collection.insert({'row': params.row, 'col': params.col});
    });
    res.writeHead(200, {'Content-Type': 'text/javascript'});
    res.write("", 'utf8');
    res.end();
}

var step = function(){

    board = new Array(20);
    for(i=0;i<20;i++) {
        board[i] = new Array(20);
    }
    
    var neighbours = function(board, x, y){
        var from_x = (x==0 ? 0 : x-1);
        var to_x   = (x==19 ? 19 : x+1);
        var from_y = (y==0 ? 0 : y-1);
        var to_y   = (y==19 ? 19 : y+1);
        var n      = 0

        for(var i = from_x;i <= to_x;i++){
            for(var j = from_y;j <= to_y;j++){
                if(!(i == x && j == y))
                    if(board[i][j] == true)
                        n++;
            }
        }
        return n;
    }
    db.collection('cells', function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.toArray(function(err, cells) {
                cells.forEach(function(cell) {
                    board[parseInt(cell.row)][parseInt(cell.col)] = true
                });
                collection.remove(function(err, collection) {
                    for(var i=0;i<20;i++) {
                        for(var j=0;j<20;j++) {
                            n = neighbours(board, i, j);

                            if(n==3 || (n==2 && board[i][j]== true))
                                collection.insert({'row': i, 'col': j});
                        }
                    }
                });
            });
        });
    });
    db.collection('cells', function(err, collection) {
    });

}

