$(document).ready(function(){
    var table = $("<table>")
    $("#board").append(table);
    for(var i = 0; i<20; i++){
        var row = $("<tr>");
        table.append(row);
        for(var j = 0; j<20; j++){
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
        $.getJSON("/update.js", function(cells){
            $(".cell").removeClass("marked");
            $(cells).each(function(){
                $("#cell_"+this.row+"_"+this.col).addClass("marked");
            });
        });
    }
    var updateTO = function(){
        update();
        setTimeout(updateTO, 200);
    };
    updateTO();
});