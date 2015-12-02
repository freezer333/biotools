$(document).ready ( function() {

    var qgrschart;
    makeChart([]);

    $('button').click( function() {
        $("button").prop("disabled",true);
        $("#container").css("display", "none");
        $("#loading").css("display", "block");

        var ingscore = $( "input[name*='min_gscore']" ).val();
        var locnum = $("select[name*='rnaLoc'] option:selected").val();
        var ontval = $( "input[name*='min_ont']" ).val()

        var locname = $("select[name*='rnaLoc'] option:selected").text();

        var jax = $.post('sumbitInfo', {
            mingscore : ingscore,
            rnaloc : locnum,
            //rnaloc : $( "input[name*='rnaLoc']" ).val(),
            //rnaloc : $('input[name=rnaLoc]:checked').val(),
            minont : ontval
        });
        jax.done( function (data) {
            var newdata = eval("(" + data + ")")
            var thisKey = Object.keys(newdata);
            var dataArray = [];
            for( var i = 0 ; i < thisKey.length ; i++){
                /*if(isNaN(parseFloat(data[thisKey[i]])) || !isFinite(data[thisKey[i]])){
                    continue;
                }*/
                dataArray.push([ String(thisKey[i]), Number(newdata[thisKey[i]]) ]);
                console.log(String(thisKey[i]));
                console.log(data[thisKey[i]]);
            }
            dataArray.sort(function(a, b) {
                return a[1] - b[1];
            });
            $("#results").html("<tr><th>Ontology Name</th><th>QGRS Prevalence</th></tr>");
            for(var i in dataArray){
                if(i < 0.05*dataArray.length || i > 0.95*dataArray.length){
                    $("#results").append('<tr><td style="background-color:#cccccc;">'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td></tr>');
                }else{
                    $("#results").append('<tr><td>'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td></tr>');
                }
            }
            console.log(newdata);
            console.log(dataArray);
            //qgrschart.options.subtitle.text = 'minimum of ' + ontval + ' related genes, gscore of ' + ingscore + ', located in ' + locname;
            qgrschart.series[0].setData(dataArray,true); 
            qgrschart.setTitle(null, { text: 'minimum of ' + ontval + ' related genes, gscore of ' + ingscore + ', located in ' + locname});
            $("#container").css("display", "block");
            $("#loading").css("display", "none");
            $("button").prop("disabled",false);
            //makeChart(dataArray);
        }); 
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
                        text: 'Prevalence of GQRS in Ontologies'
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
