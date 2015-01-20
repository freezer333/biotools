
var db = require("../../db");
var JSONStream = require('JSONStream')

exports.main = function(req, res) {
  var page = {}


  res.render("qgrs/g4utr3", page);
}

exports.ontology = function (req, res) {
  
}
exports.listings = function(req, res) {
  var unwind = {'$unwind':'$g4s'};
  var sort = {'$sort': {'gene_name':1}}
  var pipeline = []
  pipeline.push(sort);
  pipeline.push(unwind);


  var cursor = db.native.collection('g4utr3').aggregate(pipeline, {
                   allowDiskUsage: true, cursor: {batchSize: 1000}});
  var results = [];
  var ontology = [];
  cursor.on('error', function (err) {
    res.status(401).end("Analysis pipeline failed - " + err);
  })
  cursor.on('data', function(data) {
    results.push(data);
  });
  cursor.on('end', function() {
    res.set('Content-Type', 'application/json');
    res.end(JSON.stringify(results));
  });


}
