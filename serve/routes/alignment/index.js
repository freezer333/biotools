var express = require('express');
var db = require("../../db");
var aligner = require('../../tools/align')


exports.routes = express.Router();

var needle_opts = { gapopen : 10, gapextend : 0.5};


var input = function(req, res) {
    res.render("alignment/input", {});
}


exports.routes.get('/alignment', input)
exports.routes.get('/alignment/interactive', input)

exports.routes.get('/alignment/not_configured', function(req, res) {
    res.render("alignment/not_configured", {});
})

exports.routes.post('/alignment/cacheable', function (req, res) {
  var alignment_request = req.body;
  db.getAlignment(alignment_request.a.id, alignment_request.b.id, alignment_request.downstream, function (err, alignment) {
    if ( alignment) {
      var result = {
        a : alignment.principal_seq, b : alignment.comparison_seq,
        downstream : alignment_request.downstream,
        cached : true, date_cached : alignment.date
      }
      console.log("CACHED");
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    }
    else {
      if ( alignment_request.a.seq && alignment_request.b.seq) {
        console.log("Cache miss - computing alignment");
        aligner.run(alignment_request.a.seq , alignment_request.b.seq, needle_opts,
            function(result) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));

                db.saveAlignment({
                  principal_id : alignment_request.a.id,
                  comparison_id : alignment_request.b.id,
                  principal_seq : result.a,
                  comparison_seq : result.b,
                  alignment_type : "needle",
                  downstream : alignment_request.downstream,
                  date : new Date()
                })
            },
            function(err) {
                res.status(401).end('Alignment was not in cache, and alignment could not be computed');
            }
        )
      }
      else {
        res.status(400).end('Alignment was not in cache, and sequence data was not specified in request');
      }
    }
  } )
})

exports.routes.post('/alignment', function(req, res) {
    var seqa = req.body.seqa;
    var seqb = req.body.seqb;

    if ( !seqa ) {
        res.status(400).end('Sequence A [seqa] was not specified');
        return;
    }
    if ( !seqb ) {
        res.status(400).end('Sequence B [seqb] was not specified');
        return;
    }


    aligner.run(seqa, seqb, needle_opts,
        function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        },
        function(err) {
            res.render("alignment/not_configured", err);
        }
    )
});
