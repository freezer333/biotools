var db = require("../db");
var async = require('async');
var spawn = require('child_process').spawn;
var core_routes = require('./index');

function makeFilter(req){
    var p_minTetrad = req.body.minTetrad || req.query.minTetrad || 2;
    var p_maxTetrad = req.body.maxTetrad || req.query.maxTetrad || Number.MAX_VALUE; // unlikely...
    var p_minGScore = req.body.minGScore || req.query.minGScore || 13;
    var p_maxGScore = req.body.maxGScore || req.query.maxGScore || Number.MAX_VALUE; 
    var p_maxLength = req.body.maxLength || req.query.maxLength || Number.MAX_VALUE; 
    var p_minLength = req.body.minLength || req.query.minLength || p_minTetrad * 4;     

    var filter = {
        minTetrad : p_minTetrad,
        maxTetrad : p_maxTetrad,
        minGScore : p_minGScore,
        maxGScore : p_maxGScore,
        maxLength : p_maxLength,
        minLength : p_maxLength,
        apply : function(g4)  {
            return (g4.tetrads >= p_minTetrad && g4.tetrads <= p_maxTetrad &&
                g4.gscore >= p_minGScore && g4.gscore <= p_maxGScore &&
                g4.length >= p_minLength && g4.length <= p_maxLength);
        }
    }   

    return filter;
}



exports.qgrs_overlaps = function(req, res){
    var filter = makeFilter(req);
    var g4id = req.params.g4id;
    var g4;

    async.waterfall([
        function(callback){
            // find the associated mrna (splice the g4_id)
            var splits = g4id.split(".");
            splits.pop();
            var accession = splits.join(".");
            db.mrna.findOne({ accession : accession}, function(err, mrna){
                if ( err ) {
                    callback(err, null);
                }
                else {
                    callback(null, mrna);
                }
            });
        },
        function(mrna, callback){
            g4 = mrna.g4s.filter(function (g4) {
                return g4.id == g4id;
            })[0];

            downstream = g4.isDownstream ? 65 : 0;

            core_routes.build_mrna_sequence(mrna.accession, downstream, 
                function(err) {
                    res.status(404).end('mRNA sequence data could not be found');
                }, 
                function(mrna, sequence) {
                    callback(null, sequence.substring(g4.range.start, g4.range.end));
                });
        },
        function(sequence, callback){
            console.log("Sequence for G4 = " + sequence)
            var result = "";
            var nts = sequence;
            var g = spawn('python3',['../util/grun.py']);
            g.stdin.setEncoding('utf8');
            g.stdout.setEncoding('utf8');
            g.stdin.write(nts);
            g.stdin.end()

            g.stdout.on('data', function(data) {
                result += data;
                
            })
                    
            g.on('err', function(err){
                callback(err, null);
            })

            g.on('exit', function(code){
                callback(null, JSON.parse(result));
            })
        },
        function(g4s, callback){
            var g = g4s[0];
            g.overlaps = g.overlaps.filter(filter.apply);
            callback(null, g);
        }
    ], function (err, g4) {
        if ( err ) {
            res.status(404).end('mRNA could not be found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(g4));   
        }
    });
}
exports.qgrs_density = function(req, res) {
    var filter = makeFilter(req);
    var accession = req.params.accession;
    var parent_mrna;
    var downstream = 65;
    async.waterfall([
        function(callback){
            // now grab the entire sequence, along with some downstream data.
            core_routes.build_mrna_sequence(accession, downstream, 
                function(err) {
                    res.status(404).end('mRNA sequence data could not be found');
                }, 
                function(mrna, sequence) {
                    parent_mrna = mrna;
                    callback(null, sequence);
                });
        },
        function(sequence, callback){
            var result = "";
            var nts = sequence;
            var g = spawn('python3',['../util/grun.py']);
            g.stdin.setEncoding('utf8');
            g.stdout.setEncoding('utf8');
            g.stdin.write(nts);
            g.stdin.end()

            g.stdout.on('data', function(data) {
                result += data;
                
            })
                    
            g.on('err', function(err){
                callback(err, null);
            })

            g.on('exit', function(code){
                callback(null, JSON.parse(result));
            })
        },
        function(g4s, callback){
            var total = 0;
            var total_5utr = 0;
            var total_cds = 0;
            var total_3utr = 0;
            var total_downstream = 0;

            var cds_start = parent_mrna.cds.start;
            var cds_end = parent_mrna.cds.end
            var transcript_end = parent_mrna.length;

            var in3 = function(g4) {
                return g4.start >= cds_end && g4.start <= transcript_end || g4.end >= cds_end && g4.end <= transcript_end
            }
            var in5 = function (g4) {
                return g4.start <= cds_start;
            }
            var inCds = function(g4) {
                return g4.start >= cds_start && g4.start <= cds_end || g4.end >= cds_start && g4.end <= cds_end
            }
            var inDown = function(g4) {
                return g4.end >= transcript_end
            }

            var nt = 0;
            for ( nt = 0; nt < (parent_mrna.length + downstream); nt++) {
                var in_any = false;
                var in_5utr = false;
                var in_3utr = false;
                var in_cds = false;
                var in_downstream = false;

                var process_motif = function (g4) {
                    if ( filter.apply(g4) && nt >= g4.start && nt <= (g4.start+g4.length)) {
                            if ( in3(g4)|| in5(g4) || inCds(g4)) in_any = true;
                            if ( in3(g4) ) in_3utr = true;
                            if ( in5(g4) ) in_5utr = true;
                            if ( inCds(g4) ) in_cds= true;
                            if ( inDown(g4)) in_downstream = true;
                        }
                    }

                for ( i in g4s ) {
                    g4 = g4s[i];
                    process_motif(g4);
                    for ( j in g4s[i].overlaps) {
                        g4 = g4s[i].overlaps[j];
                        process_motif(g4);
                    }
                }
                if ( in_any ) total++;
                if ( in_3utr ) total_3utr++;
                if ( in_5utr ) total_5utr++;
                if ( in_cds ) total_cds++;
                if ( in_downstream ) total_downstream++;
            }
            var overall_length = parent_mrna.length;
            var utr5_length = parent_mrna.cds.start;
            var cds_length = parent_mrna.length - parent_mrna.cds.end;
            var utr3_length = parent_mrna.cds.end - parent_mrna.cds.start;
            var d_result = {
                density_criteria : filter,
                accession : parent_mrna.accession,
                build : parent_mrna.build,
                cds : parent_mrna.cds, 
                density : {
                    overall : {
                        total : total,
                        length : overall_length,
                        density : total / overall_length
                    },
                    utr3 : {
                        total : total_3utr, 
                        length : utr3_length, 
                        density : total_3utr / utr3_length
                    },
                    cds : {
                        total : total_cds, 
                        length : cds_length, 
                        density : total_cds / cds_length
                    },
                    utr5 : {
                        total : total_5utr, 
                        length : utr5_length, 
                        density : total_5utr / utr5_length
                    }, 
                    downstream : {
                        total : total_downstream, 
                        length : downstream, 
                        density : total_downstream / downstream
                    }
                }

            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(d_result)); 
   
        }
    ]);
}