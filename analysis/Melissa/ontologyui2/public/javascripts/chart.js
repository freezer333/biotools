$(document).ready ( function() {

    var qgrschart;
    makeChart([]);

    $('button').click( function() {
        $("button").prop("disabled",true);
        $("#container").css("display", "none");
        $("#loading").css("display", "block");

        var ingscore = $( "input[name*='min_gscore']" ).val();
        var locnum = $("select[name*='rnaLoc'] option:selected").val();
        var ontval = $( "input[name*='min_ont']" ).val();
        var locname = $("select[name*='rnaLoc'] option:selected").text();

        var geneinput = document.getElementById('file_input');
        genefile = geneinput.files[0];
        var genelist = [];
        if (genefile) {
            var r = new FileReader();
            r.onload = function(e) {
                var contents = e.target.result;
                genelist = contents.split('\n');
            

                console.log(genelist)

                var jax = $.post('submitinfo', {
                    mingscore : ingscore,
                    rnaloc : locnum,
                    minont : ontval,
                    targetgenelist : ( ( genelist.length < 800 ) ? genelist : genelist.slice(0,801) )
                });
                jax.done( function (data) {
                    console.log(data);
                    var dataArray = [];
                    for( var ontterm in data ){
                        dataArray.push([ String(ontterm), 100 * Number(data[ontterm][0]/data[ontterm][1]) ]);
                        
                    }
                    dataArray.sort(function(a, b) {
                        return a[1] - b[1];
                    });
                    $("#resultstable").html("<thead><tr><th style='width:50%'>Ontology Name</th><th>QGRS Prevalence</th><th>Associated mRNA with G4</th><th>All Associated mRNA</th></tr></thead>");
                    for(var i in dataArray){
                        if(i < 0.05*dataArray.length || i > 0.95*dataArray.length){
                            $("#resultstable").append('<tr><td style="color:#7cb5ec;">'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
                        }else{
                            $("#resultstable").append('<tr><td>'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
                        }

                        var thisval = data[dataArray[i][0]];
                        var numg4 = 0;
                        for(var g4count in thisval[2]){
                            if( genelist.indexOf(thisval[2][g4count]) > -1){
                                numg4 = numg4 + 1;
                                $("#accociatedg4_" + String(i) ).append('<span style="color:red;">'+String(thisval[2][g4count])+'</span><br>');
                            }else{
                                $("#accociatedg4_" + String(i) ).append(String(thisval[2][g4count])+'<br>');
                            }
                        }
                        $("#accociatedg4_" + String(i) ).after('<span>' + numg4 + ' target accessions</span>');

                        var numall = 0;
                        for(var allcount in thisval[3]){
                            if(genelist.indexOf(thisval[3][allcount]) > -1){
                                numall = numall +1;
                                $("#accociatedall_" + String(i) ).append('<span style="color:red;">'+String(thisval[3][allcount])+'</span><br>')
                            }else{
                                $("#accociatedall_" + String(i) ).append(String(thisval[3][allcount])+'<br>')
                            }
                        }
                        $("#accociatedall_" + String(i) ).after('<span>' + numall + ' target accessions</span>');
                        
                    }
                    qgrschart.series[0].setData(dataArray,true); 
                    qgrschart.setTitle(null, { text: 'minimum of ' + ontval + ' related genes, gscore of ' + ingscore + ', located in ' + locname});
                    $("#container").css("display", "block");
                    $("#loading").css("display", "none");
                    $("button").prop("disabled",false);
                }); 
            }
            r.readAsText(genefile);
        }else{
            var jax = $.post('submitinfo', {
                mingscore : ingscore,
                rnaloc : locnum,
                minont : ontval,
                targetgenelist : genelist
            });
            jax.done( function (data) {
                console.log(data);
                var dataArray = [];
                for( var ontterm in data ){
                    dataArray.push([ String(ontterm), 100 * Number(data[ontterm][0]/data[ontterm][1]) ]);
                    
                }
                dataArray.sort(function(a, b) {
                    return a[1] - b[1];
                });
                $("#resultstable").html("<thead><tr><th style='width:50%'>Ontology Name</th><th>QGRS Prevalence</th><th>Associated mRNA with G4</th><th>All Associated mRNA</th></tr></thead>");
                for(var i in dataArray){
                    if(i < 0.05*dataArray.length || i > 0.95*dataArray.length){
                        $("#resultstable").append('<tr><td style="color:#7cb5ec;">'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
                    }else{
                        $("#resultstable").append('<tr><td>'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
                    }

                    var thisval = data[dataArray[i][0]];
                    for(var g4count in thisval[2]){
                        $("#accociatedg4_" + String(i) ).append(String(thisval[2][g4count])+'<br>');
                    }

                    for(var allcount in thisval[3]){
                        $("#accociatedall_" + String(i) ).append(String(thisval[3][allcount])+'<br>')
                    }
                    
                }
                qgrschart.series[0].setData(dataArray,true); 
                qgrschart.setTitle(null, { text: 'minimum of ' + ontval + ' related genes, gscore of ' + ingscore + ', located in ' + locname});
                $("#container").css("display", "block");
                $("#loading").css("display", "none");
                $("button").prop("disabled",false);
            }); 
        }
    });


    function makeChart(dataArray) {
        $.getScript('./Highcharts-4.1.9/js/highcharts.js', function(){
            $.getScript('./Highcharts-4.1.9/js/modules/exporting.js', function(){

                //$('#container').highcharts({
                qgrschart = new Highcharts.Chart({
                    chart: {
                        type: 'column',
                        renderTo: 'container'
                    },
                    title: {
                        text: 'Prevalence of QGRS in Ontologies'
                    },
                    /*subtitle: {
                        text: ' '
                    },*/
                    xAxis: {
                        type: 'category',
                        labels: {
                            rotation: -90,
                            style: {
                                fontSize: '10px',
                                fontFamily: 'Verdana, sans-serif'
                            }
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Prevalence of QGRS (%)'
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        pointFormat: '<b>{point.y:.1f}%</b> of mrna associated with this ontology have GQRS'
                    },
                    series: [{
                        name: 'QGRS Prevalence',
                        data: dataArray,
                        dataLabels: {
                            enabled: false,
                            rotation: -90,
                            color: '#FFFFFF',
                            align: 'right',
                            format: '{point.y:.1f}', // one decimal
                            y: 10, // 10 pixels down from the top
                            style: {
                                fontSize: '8px',
                                fontFamily: 'Verdana, sans-serif'
                            }
                        }
                    }]
                });

            });
        });

    }
    
});
