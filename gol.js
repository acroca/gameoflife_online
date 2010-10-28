// basic imports
var events = require('events'),
sys = require("sys");

// Array tools
Array.prototype.uniq = function () {
	var r = new Array();
	o:for(var i = 0, n = this.length; i < n; i++)
	{
		for(var x = 0, y = r.length; x < y; x++)
		{
			if(r[x]==this[i])
			{
				continue o;
			}
		}
		r[r.length] = this[i];
	}
	return r;
};


// for us to do a require later
module.exports = Gol;

function Gol(db, x, y) {
    events.EventEmitter.call(this);
    this.db = db;
    this.size_x = x;
    this.size_y = y;
};

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
    
    var removed_cells = [];
    var created_cells = [];
    
    board = [];
    for(i=0;i<self.size_x;i++) {
        board[i] = [];
    }
    self.db.collection('cells', function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.toArray(function(err, cells) {
                cells.forEach(function(cell) {
                    board[parseInt(cell.row)][parseInt(cell.col)] = cell;
                });
                
                
                for(var i=0;i<self.size_x;i++) {
                    for(var j=0;j<self.size_y;j++) {
                        n = self.neighbours(board, i, j);
                        
                        is_alive = board[i][j] != null;
                        should_be_alive = (n.count==3 || (n.count==2 && is_alive));
                        
                        if(is_alive && !should_be_alive)
                            removed_cells.push(board[i][j]);
                        if(!is_alive && should_be_alive)
                            created_cells.push({
                                row: i,
                                col: j,
                                owners: n.owners.uniq()
                            });
                    }
                }
                self.add_cells(created_cells);
                self.remove_cells(removed_cells);
            });
        });
    });
};

Gol.prototype.all_cells = function(callback){
    var self = this;
    self.db.collection('cells', function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.toArray(function(err, cells) {
                callback(cells);
            });
        });
    });
};

Gol.prototype.remove_owner = function(owner){
    var self = this;
    var removed_cells = [];
    var updated_cells = [];

    self.db.collection('cells', function(err, collection) {
        collection.find({owners: owner}, function(err, cursor) {
            cursor.toArray(function(err, cells) {
                cells.forEach(function(cell){
                    if(cell.owners.length == 1){
                        // I'm the only owner
                        removed_cells.push(cell);
                    }else{
                        var i = cell.owners.indexOf(owner);
                        cell.owners.splice(i,1);
                        collection.update({_id : cell._id}, cell, function(err, doc) {
                            updated_cells.push(doc);
                        });
                    }
                });
                self.remove_cells(removed_cells);
                self.update_cells(updated_cells);
            });
        });
    });
};

Gol.prototype.update_cells = function(cells){
    var self = this;

    self.db.collection('cells', function(err, collection) {
        cells.forEach(function(cell){
            collection.update({_id : cell._id}, cell, function(err, doc) {
            });
        });
        self.emit("cells_updated", cells);
    });
};

Gol.prototype.add_cells = function(cells){
    var self = this;

    self.db.collection('cells', function(err, collection) {
        cells.forEach(function(cell){
            collection.insert(cell);
        });
        self.emit("cells_added", cells);
    });
};


Gol.prototype.remove_cells = function(cells){
    var self = this;
    self.db.collection('cells', function(err, collection) {
        cells.forEach(function(cell){
            collection.remove({row: cell.row, col: cell.col}, function(err, r) {
            });
        });
        self.emit("cells_removed", cells);
    });
};


Gol.prototype.neighbours = function(board, x, y){
    var self = this;
    var from_x = (x==0 ? 0 : x-1);
    var to_x   = (x==self.size_x-1 ? self.size_x-1 : x+1);
    var from_y = (y==0 ? 0 : y-1);
    var to_y   = (y==self.size_y-1 ? self.size_y-1 : y+1);
    var n      = 0;

    owners = [];
    for(var i = from_x;i <= to_x;i++){
        for(var j = from_y;j <= to_y;j++){
            if(!(i == x && j == y))
                if(board[i][j] && board[i][j].owners){
                    board[i][j].owners.forEach(function(owner){
                        owners.push(owner);
                    });
                    n++;
                }
        }
    }
    return {count: n, owners: owners};
};