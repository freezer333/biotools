$(document).ready ( function() {
    $('button').click( function() {

        var jax = $.post('sumbitInfo', {
            mingscore : $( "input[name*='min_gscore']" ).val(),
            rnaloc : $( "input[name*='rnaLoc']" ).val(),
            minont : $( "input[name*='min_ont']" ).val()
        });
        jax.done( function (data) {
            var thisKey = Object.keys(data);
            var dataArray = [];
            for( var i = 0 ; i < thisKey.length ; i++){
                dataArray[thisKey[i]] = data[thisKey[i]];
            }
            console.log("data Array: " + dataArray);
            makeChart([['hello',4],['world',5]]);
        }); 
    });


    function makeChart(dataArray) {
        $.getScript('./Highcharts-4.1.9/js/highcharts.js', function(){
            $.getScript('./Highcharts-4.1.9/js/modules/exporting.js', function(){

        $('#container').highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: 'Prevalence of GQRS in Ontologies'
            },
            subtitle: {
                text: 'minimum of 50 related genes, gscore of 13, located in 3\'-UTR'
            },
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
                    enabled: true,
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
