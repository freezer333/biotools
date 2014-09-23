var db = require("../db");


exports.qgrs_density = function(req, res) {
    var minTetrad = req.body.minTetrad || req.query.minTetrad || 2;
    var maxTetrad = req.body.maxTetrad || req.query.maxTetrad || Number.MAX_VALUE; // unlikely...
    var minGScore = req.body.minGScore || req.query.minGScore || 13;
    var maxGScore = req.body.maxGScore || req.query.maxGScore || Number.MAX_VALUE; 
    var maxLength = req.body.maxLength || req.query.maxLength || Number.MAX_VALUE; 
    var minLength = req.body.minLength || req.query.minLength || minTetrad * 4; 

    var accession = req.params.accession;

    db.mrna.findOne({ accession : accession}, function(err, result){
        if ( err ) {
            res.status(404).end('mRNA could not be found');
        }
        else {
            console.log(JSON.stringify(result.accession));
            var total = 0;
            var total_5utr = 0;
            var total_cds = 0;
            var total_3utr = 0;
            result.g4s.forEach(function (g4){
                if (g4.tetrads >= minTetrad && g4.tetrads <= maxTetrad &&
                    g4.gscore >= minGScore && g4.gscore <= maxGScore &&
                    g4.length >= minLength && g4.length <= maxLength) {

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