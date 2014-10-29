var db = require("../../db");
var express = require('express');
var seq_utils = require('../../utils/seq')
exports.routes = express.Router();


exports.routes.get('/chrom',
  function (req, res) {
    var seq_col = db.seq.collection;
    seq_col.aggregate( [
      {'$group' : { '_id' : {'accession' : '$accession', 'organism' : '$organism', 'build' : '$build'}}},
      {'$project': {'_id' : 0, 'accession': '$_id.accession', 'organism' : '$_id.organism', 'build' : '$_id.build'}},
      {'$sort': { 'organism' : 1, 'build': 1, 'accession':1 } }
      ], function (err, result) {
        res.end(JSON.stringify(result));
      });
  });


exports.routes.get('/chrom/:accession/:start/:end',

  function(req, res) {
    var accession = req.params.accession;
    var start = req.params.start;
    var end = req.params.end;
    var orientation = req.query.orientation || "+";

    if ( !accession || !start || !end ) {
        res.status(404).end('Sequence range was not specified or was invalid');
        return ;
    }

    db.getSequence(accession, start, end, function(err, result) {
        if ( err ) {
            res.status(404).end('Sequence range on chromosome ' + accession + ' could not be found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            if ( orientation == '-') {
                result.seq = seq_utils.reverse_complement(result.seq);
                result.orientation = '-';
            }
            else {
                result.orientation = '+';
            }
            res.end(JSON.stringify(result));
        }
    });
  });
