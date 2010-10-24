$(document).ready(function(){
    var socket = new io.Socket();
    socket.connect();

    var table = $("<table>")
    $("#board").append(table);

    $.getJSON("/setup.js", function(r){
        for(i = 0; i < r.size.x; i++){
            var row = $("<tr>");
            table.append(row);
            for(j = 0; j < r.size.y; j++){
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
    });

    $("#update").click(function(event){
        update();
        event.preventDefault();
    });
    $("#step").click(function(event){
        $.ajax({
            url: "/step.js",
            dataType: "script"
        });
        event.preventDefault();
    });

    var update = function(){
        $.getJSON("/update.js", function(r){
            $(".cell").removeClass("marked");
            $(r.cells).each(function(){
                $("#cell_"+this.row+"_"+this.col).addClass("marked");
            });
            $("#countdown").html(
                (r.next_step_at - Number(new Date()))/1000.0 + "s"
            );
        });
    };
    var updateTO = function(){
        update();
        setTimeout(updateTO, 150);
    };
    //updateTO();


    socket.on('connect', function(){
        console.log("Connect from socket")
    })
    socket.on('message', function(message){
        console.log("Message from socket ", message)
        if(message.new_cell){
            $("#cell_"+message.new_cell.row+"_"+message.new_cell.col).addClass("marked");
        }
        if(message.removed_cell){
            $("#cell_"+message.removed_cell.row+"_"+message.removed_cell.col).removeClass("marked");
        }
    })
    socket.on('disconnect', function(){
        console.log("Disonnect from socket")
    })
    
});