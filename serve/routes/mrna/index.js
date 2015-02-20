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
    var accession = req.accession;
    var position = req.position;

    


    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({locus : loc}));
}