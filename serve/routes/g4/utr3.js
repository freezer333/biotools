
var db = require("../../db");
var JSONStream = require('JSONStream')

exports.main = function(req, res) {
  var page = {}


  res.render("qgrs/g4utr3", page);
}


exports.listings = function(req, res) {
  db.native.collection('g4utr3').find({}, {}, function(err, cursor){
    res.set('Content-Type', 'application/json');
    cursor.stream().pipe(JSONStream.stringify()).pipe(res);
  });
}
/*
  db.mrna.find(query, {gene_id : 1, accession : 1, gene_name : 1, organism:1, definition:1}, { skip: skip, limit: limit }, function(err, result){
      if ( err ) {
          res.status(404).end('Gene could not found');
      }
      else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
      }
  })*/
