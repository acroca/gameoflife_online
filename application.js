$(document).ready(function(){
    var table = $("<table>")
    $("#board").append(table);
    for(var i = 0; i<20; i++){
        var row = $("<tr>");
        table.append(row);
        for(var j = 0; j<20; j++){
            var cell = $('<td class="cell row_'+i+' col_'+j+' cell_'+i+'_'+j+'">')
            var cell_link = $("<a href='/add.js?row="+i+"&col="+j+"'>")
            cell_link.click(function(link){
                $.getScript(link.href);
            });
            cell.append(cell_link);
            row.append(cell);
        }
    }

    $("#update").click(function(){
        $.getScript("/update.js");
    });

    
});