exports.index = function(req, res) {
    var options = req.body.options;
    var seqa = req.body.seqa;
    var seqb = req.body.seqb;
    if ( !options ) {
        res.render("alignment/error", {reason : "Alignment options [options] were not specified"});
    }
    if ( !seqa || !seqa.raw) {
        res.render("alignment/error", {reason : "Sequence A [seqa] was not specified"});
    }
    if ( !seqb || !seqb.raw) {
        res.render("alignment/error", {reason : "Sequence B [seqb] was not specified"});
    }
    if ( options.method != 'needle' ) {
        res.render("alignment/error", {reason : "Method [options.method] refers to unsupported alignment method"});
    }

    var aligner = require('../tools/align')
    var result = aligner.run(seqa.raw, seqb.raw, { gapopen : 10, gapextend : 0.5}, 
        function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));    
        }, 
        function(err) {
            res.render("alignment/not_configured", err);
        }
    )

    
}


exports.description = function(req, res) {
    res.render("alignment/description", {});
}

exports.input = function(req, res) {
    res.render("alignment/input", {});
}