function sheet_from_array_of_arrays(data, opts) {
    var ws = {};
    var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
    for(var R = 0; R != data.length; ++R) {
        for(var C = 0; C != data[R].length; ++C) {
            if(range.s.r > R) range.s.r = R;
            if(range.s.c > C) range.s.c = C;
            if(range.e.r < R) range.e.r = R;
            if(range.e.c < C) range.e.c = C;
            var cell = {v: data[R][C] };
            if(cell.v == null) continue;
            var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
            
            if(typeof cell.v === 'number') cell.t = 'n';
            else if(typeof cell.v === 'boolean') cell.t = 'b';
            else if(cell.v instanceof Date) {
                cell.t = 'n'; cell.z = XLSX.SSF._table[14];
                cell.v = datenum(cell.v);
            }
            else cell.t = 's';
            
            ws[cell_ref] = cell;
        }
    }
    if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    return ws;
}

function datenum(v, date1904) {
    if(date1904) v+=1462;
    var epoch = Date.parse(v);
    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function Workbook() {
    if(!(this instanceof Workbook)) return new Workbook();
    this.SheetNames = [];
    this.Sheets = {};
}

function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}

$(document).ready ( function() {

    var qgrschart = { "func": {}, "proc": {}, "com": {} };
    initChart([]);

    $('button').click( function() {
        $("button").prop("disabled",true);
        $("#container").css("display", "none");
        $("#loading").css("display", "block");

        var ingscore = $( "input[name*='min_gscore']" ).val();
        var locnum = $("select[name*='rnaLoc'] option:selected").val();
        var ontval = $( "input[name*='min_ont']" ).val();
        var locname = $("select[name*='rnaLoc'] option:selected").text();
        var analysistype = $( "input[name*='file_use']:checked" ).val();

        /*var geneinput = document.getElementById('file_input');
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
                    $(".resultstable").html("<thead><tr><th style='width:50%'>Ontology Name</th><th>QGRS Prevalence</th><th>Associated mRNA with G4</th><th>All Associated mRNA</th></tr></thead>");
                    for(var i in dataArray){
                        if(i < 0.05*dataArray.length || i > 0.95*dataArray.length){
                            $(".resultstable").append('<tr><td style="color:#7cb5ec;">'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
                        }else{
                            $(".resultstable").append('<tr><td>'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
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
        }else{*/
            var jax = $.post('submitinfo', {
                mingscore : ingscore,
                rnaloc : locnum,
                minont : ontval,
                targetgenelist : analysistype
            });
            jax.done( function (data) {
                console.log(data);
                var onttypes = ["com", "func", "proc"];
                var xdata = { };
                var dataArray = { };
                for(var ont in onttypes){
                    xdata[onttypes[ont]] = [["Term", "Percent QGRS", "Total associated mRNA"]];
                    dataArray[onttypes[ont]] = [];
                }

                for( var ontterm in data ){
                    var perc = 100 * Number(data[ontterm]['num_with_qgrs']/data[ontterm]['num_total']);
                    var onttype;
                    if(data[ontterm]['type'] == "components"){ onttype = "com";
                    }else if(data[ontterm]['type'] == "functions"){ onttype = "func";
                    }else{ onttype = "proc"; }
                    dataArray[onttype].push([ String(ontterm), perc ]);
                    xdata[onttype].push( [String(ontterm), perc, Number(data[ontterm]['num_total'])] );
                    
                }
                for(var ont in onttypes){
                    dataArray[onttypes[ont]].sort(function(a, b) { return a[1] - b[1]; });
                    xdata[onttypes[ont]].sort(function(a, b) { return a[1] - b[1]; });
                }

                /* UNCOMMENT THIS TO SEE THE DATA TABLE ON THE WEBPAGE

                $(".resultstable").html("<thead><tr><th style='width:50%'>Ontology Name</th><th>QGRS Prevalence</th><th>Associated mRNA with G4</th><th>All Associated mRNA</th></tr></thead>");
                for(var i in dataArray){
                    var onttype = data[dataArray[i][0]][4];
                    if(i < 0.05*dataArray.length || i > 0.95*dataArray.length){
                        $("#"+String(onttype)+"table").append('<tr><td style="color:#7cb5ec;">'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
                    }else{
                        $("#"+String(onttype)+"table").append('<tr><td>'+dataArray[i][0]+'</td><td>'+dataArray[i][1]+'</td><td><div class="mrnalist" id="accociatedg4_' + i +'"></div></td><td><div class="mrnalist" id="accociatedall_' + i +'"></div></td></tr>');
                    }

                    var thisval = data[dataArray[i][0]];
                    for(var g4count in thisval[2]){
                        $("#accociatedg4_" + String(i) ).append(String(thisval[2][g4count])+'<br>');
                    }
                    $("#accociatedg4_" + String(i) ).after('<div style="text-align:right;">' + (thisval[2]).length + ' accessions</div>');

                    for(var allcount in thisval[3]){
                        $("#accociatedall_" + String(i) ).append(String(thisval[3][allcount])+'<br>')
                    }
                    $("#accociatedall_" + String(i) ).after('<div style="text-align:right;">' + (thisval[3]).length + ' accessions</div>');
                    
                }*/

                var score = "";
                (ingscore < 17) ? (score = "QGRS containing " + ingscore + " tetrads, " ) : (score = "gscore of " + ingscore + ", " );

                for(var ont in qgrschart){
                    qgrschart[ont].series[0].setData(dataArray["func"],true); 
                    qgrschart[ont].setTitle(null, { text: 'minimum of ' + ontval + ' related genes, ' + score + 'located in the ' + locname});
                }

                //$("code").text($("#resultstablecontainer").html());
                console.log("Reached workbook stage...");
                var wb = new Workbook();
                var ws = { }
                for( var ont in onttypes ){
                    ws[onttypes[ont]] = sheet_from_array_of_arrays(xdata[onttypes[ont]])
                }
 
                /* add worksheet to workbook */
                var ws_name = { 
                    "com": "Components",
                    "proc": "Processes",
                    "func": "Functions"
                }
                console.log("Adding worksheets"); 
                for( var sheet in onttypes ){
                    wb.SheetNames.push(ws_name[onttypes[sheet]]);
                    wb.Sheets[ws_name[onttypes[sheet]]] = ws[onttypes[sheet]];
                }
                var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});

                console.log("Saving"); 
                saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), String(analysistype).replace(/((\.txt)|\/)/g,'_') + "str" + String(ingscore) + "_min" + String(ontval) + "_in" + String(locnum) + ".xlsx")

                console.log("You reached the end");

                $("#container").css("display", "block");
                $("#loading").css("display", "none");
                $("button").prop("disabled",false);
            }); 
        //}
    });


    function initChart(dataArray) {
        $.getScript('./Highcharts-4.1.9/js/highcharts.js', function(){
            $.getScript('./Highcharts-4.1.9/js/modules/exporting.js', function(){

                //$('#container').highcharts({
                qgrschart["func"] = new Highcharts.Chart({
                    chart: {
                        type: 'column',
                        renderTo: 'container_func'
                    },
                    title: {
                        text: 'Prevalence of mRNA with QGRS among Ontology Terms'
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
                        pointFormat: '<b>{point.y:.1f}%</b> of mrna associated with this ontology have QGRS'
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

                qgrschart["proc"] = new Highcharts.Chart({
                    chart: {
                        type: 'column',
                        renderTo: 'container_proc'
                    },
                    title: {
                        text: 'Prevalence of mRNA with QGRS among Ontology Terms'
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
                        pointFormat: '<b>{point.y:.1f}%</b> of mrna associated with this ontology have QGRS'
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

                qgrschart["com"] = new Highcharts.Chart({
                    chart: {
                        type: 'column',
                        renderTo: 'container_com'
                    },
                    title: {
                        text: 'Prevalence of mRNA with QGRS among Ontology Terms'
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
                        pointFormat: '<b>{point.y:.1f}%</b> of mrna associated with this ontology have QGRS'
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
