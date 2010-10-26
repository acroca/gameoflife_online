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
        if(message.new_cells){
            $.each(message.new_cells, function(i, cell){
                item = $("#cell_"+cell.row+"_"+cell.col);
                item.addClass("marked");
                $.each(cell.owners, function(j, owner){
                    counter = $("#player_"+owner+" .count");
                    current = parseInt(counter.html());
                    counter.html(current + 1);

                    item.addClass("player_"+owner);
                });
            });
        };
        if(message.removed_cells){
            $.each(message.removed_cells, function(i, cell){
                item = $("#cell_"+cell.row+"_"+cell.col);
                item.removeClass("marked");
                
                $.each(cell.owners, function(j, owner){
                    counter = $("#player_"+owner+" .count");
                    current = parseInt(counter.html());
                    counter.html(current - 1);

                    item.removeClass("player_"+owner);
                });
            });
        };
        if(message.setup){
            build_board(message.setup.size.x, message.setup.size.y);
            $.each(message.setup.players, function(i, playerId){
                add_player(playerId);
            })
        };
        if(message.player_connected){
            add_player(message.player_connected);
        };
        if(message.player_disconnected){
            remove_player(message.player_disconnected);
        };
    });

    $("#players li .name").live('mouseover mouseout', function(e){
        if (e.type == 'mouseover') {
            
            $(".cell")
                .addClass("non_highlighted");
            $(".cell."+$(this).parent('li').attr('id'))
                .removeClass("non_highlighted")
                .addClass("highlighted");
        }else{
            $(".cell")
                .removeClass("non_highlighted")
                .removeClass("highlighted");
        }
    });
    
    var add_player = function(id){
        line = $("<li id='player_"+id+"' class='player'>")
        $("#players").append(line);
        
        line.html("<span class='count'>0</span><span class='name'>"+id+"</span>")
    };
    var remove_player = function(id){
        $("#player_"+id).remove();
    };

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
