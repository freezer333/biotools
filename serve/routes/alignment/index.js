var express = require('express');
exports.routes = express.Router();



var input = function(req, res) {
    res.render("alignment/input", {});
}


exports.routes.get('/alignment', input)
exports.routes.get('/alignment/interactive', input)

exports.routes.get('/alignment/not_configured', function(req, res) {
    res.render("alignment/not_configured", {});
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

    var aligner = require('../tools/align')
    var result = aligner.run(seqa, seqb, { gapopen : 10, gapextend : 0.5},
        function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        },
        function(err) {
            res.render("alignment/not_configured", err);
        }
    )
});
