$(document).ready(function(){
    var socket = new io.Socket();
    socket.connect();

    socket.on('connect', function(){
        console.log("Socket connected.")
    });

    socket.on('disconnect', function(){
        console.log("Socket disconnected.")
    });

    // $("#countdown").html(
    //     (r.next_step_at - Number(new Date()))/1000.0 + "s"
    // );

    socket.on('message', function(message){
        console.log("Message from socket: ", message)
        if(message.new_cell){
            $("#cell_"+message.new_cell.row+"_"+message.new_cell.col).addClass("marked");
        }
        if(message.removed_cell){
            $("#cell_"+message.removed_cell.row+"_"+message.removed_cell.col).removeClass("marked");
        }
        if(message.setup){
            build_board(message.setup.size.x, message.setup.size.y);
        }
    });
    
    var build_board = function(size_x, size_y){
        table = $("<table>");
        $("#board").append(table);
        for(i = 0; i < size_x; i++){
            var row = $("<tr>");
            table.append(row);
            for(j = 0; j < size_y; j++){
                var cell = $('<td id="cell_'+i+'_'+j+'" class="cell row_'+i+' col_'+j+'">');
                var cell_link = $("<a>");
                
                (function(link,x,y){
                    link.click(function(event){
                        socket.send({new_cell: {row: x, col: y}});
                        event.preventDefault();
                    });
                })(cell_link, i,j);
                
                cell.append(cell_link);
                row.append(cell);
            }
        }
    }
    
});
