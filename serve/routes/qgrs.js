var db = require("../db");
var async = require('async');
var spawn = require('child_process').spawn;

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
            console.log("Spliced G4 ID (" + g4id + ") into accession number -> " + accession);
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


            var accession = mrna.chrom;
            var start = mrna.start+g4.range.start;
            var end = mrna.end + g4.range.end
            var orientation = mrna.orientation;
            console.log("Retrieving seqeunce data on chromosome " + accession + " from " + start + " to " + end)
            db.getSequence(accession, start, end, function(err, sequence) {
                if ( err ) {
                    callback(err, null);
                }
                else {
                    callback(null, sequence);
                }
            });
        },
        function(sequence, callback){
            // call the python g tools to get g4 (and overlaps)
            console.log("Running python g tool");
            var result = "";
            var nts = sequence.seq;
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
            console.log("Got the G4 with overlaps");
            var g = g4s[0];
            console.log(JSON.stringify(g));
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

    db.mrna.findOne({ accession : accession}, function(err, result){
        if ( err ) {
            res.status(404).end('mRNA could not be found');
        }
        else {
            var total = 0;
            var total_5utr = 0;
            var total_cds = 0;
            var total_3utr = 0;
            result.g4s.forEach(function (g4){
                if (filter.apply(g4)) {
                    total++;
                    if ( g4.is3Prime ) total_3utr++;
                    if ( g4.is5Prime ) total_5utr++;
                    if ( g4.isCDS ) total_cds++;  
                }
            })
            var d_result = {
                density_criteria : {
                    minTetrad: minTetrad, 
                    maxTetrad: maxTetrad, 
                    minGScore: minGScore, 
                    maxGScore: maxGScore, 
                    maxLength: maxLength,
                    minLength: minLength
                },
                accession : result.accession,
                build : result.build,
                cds : result.cds, 
                density : {
                    overall : {
                        total : total,
                        length : result.length,
                        density : total / result.length
                    },
                    utr3 : {
                        total : total_3utr, 
                        length : result.length - result.cds.end, 
                        density : total_3utr / (result.length - result.cds.end)
                    },
                    cds : {
                        total : total_cds, 
                        length : result.cds.end - result.cds.start, 
                        density : total_cds / (result.cds.end - result.cds.start)
                    },
                    utr5 : {
                        total : total_5utr, 
                        length : result.cds.start, 
                        density : total_5utr / (result.cds.start)
                    }
                }

            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(d_result));   
        }
    })
}