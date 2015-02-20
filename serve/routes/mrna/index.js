var db = require("../../db");

exports.index = function(req, res) {
    res.render("mrna/list");
}
exports.record = function(req, res) {
  var page = {
    mrna : {
      accession : req.params.accession
    }
  };
  res.render("mrna/record", page);
}

exports.locus = function (req, res) {
    var accession = req.params.accession;
    var position = req.params.position;
    var resolver = require('../../utils/locus')(db);
    resolver.mrna_to_chromosome(accession, position, function (result){
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({locus : result}));
    })

    
}