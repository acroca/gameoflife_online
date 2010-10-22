$(document).ready(function(){
    var table = $("<table>")
    $("#board").append(table);
    for(var i = 0; i<20; i++){
        var row = $("<tr>");
        table.append(row);
        for(var j = 0; j<20; j++){
            var cell = $('<td class="cell row_'+i+' col_'+j+' cell_'+i+'_'+j+'">')
            cell.click(function(){
                $.getScript("/add.js?row="+i+"&col="+j);
            });
            row.append(cell);
        }
    }

    $("#update").click(function(){
        $.getScript("/update.js");
    });

    
});