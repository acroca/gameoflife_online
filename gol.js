// basic imports
var events = require('events'),
sys = require("sys");

// for us to do a require later
module.exports = Gol;

function Gol(db, x, y) {
    events.EventEmitter.call(this);
    this.db = db;
    this.size_x = x;
    this.size_y = y;
}

// inherit events.EventEmitter
Gol.super_ = events.EventEmitter;
Gol.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: Gol,
        enumerable: false
    }
});

Gol.prototype.step = function(){
    var self = this;
    
    
    board = new Array()
    for(i=0;i<self.size_x;i++) {
        board[i] = new Array();
    }
    self.db.collection('cells', function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.toArray(function(err, cells) {
                cells.forEach(function(cell) {
                    board[parseInt(cell.row)][parseInt(cell.col)] = true
                });
                
                
                for(var i=0;i<self.size_x;i++) {
                    for(var j=0;j<self.size_y;j++) {
                        n = self.neighbours(board, i, j);
                        
                        is_alive = board[i][j]== true;
                        should_be_alive = (n==3 || (n==2 && is_alive))
                        
                        if(is_alive && !should_be_alive)
                            self.remove_cell(i,j);
                        if(!is_alive && should_be_alive)
                            self.add_cell(i,j);
                    }
                }
                
                    
            });
        });
    });
}

Gol.prototype.add_cell = function(x, y){
    var self = this;
    self.db.collection('cells', function(err, collection) {
        collection.insert({row: x, col: y });
        self.emit("cell_added", x, y);
    });
}
Gol.prototype.remove_cell = function(x, y){
    var self = this;
    self.db.collection('cells', function(err, collection) {
        collection.remove({row: x, col: y }, function(err, r) {
            self.emit("cell_removed", x, y);
        });
    });
}


Gol.prototype.neighbours = function(board, x, y){
    var self = this;
    var from_x = (x==0 ? 0 : x-1);
    var to_x   = (x==self.size_x-1 ? self.size_x-1 : x+1);
    var from_y = (y==0 ? 0 : y-1);
    var to_y   = (y==self.size_y-1 ? self.size_y-1 : y+1);
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