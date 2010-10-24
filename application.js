$(document).ready(function(){
    var table = $("<table>")
    $("#board").append(table);

    $.getJSON("/setup.js", function(r){
        for(var i = 0; i < r.size.x; i++){
            var row = $("<tr>");
            table.append(row);
            for(var j = 0; j < r.size.y; j++){
                var cell = $('<td id="cell_'+i+'_'+j+'" class="cell row_'+i+' col_'+j+'">')
                var cell_link = $("<a href='/add.js?row="+i+"&col="+j+"'>")
                cell_link.click(function(event){
                    $.ajax({
                        url: this.href,
                        dataType: "script"
                    });
                    event.preventDefault();
                });
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
    }
    var updateTO = function(){
        update();
        setTimeout(updateTO, 150);
    };
    updateTO();
});