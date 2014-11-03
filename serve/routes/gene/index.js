var db = require("../../db");
var express = require('express');
var seq_utils = require('../../utils/seq')
exports.routes = express.Router();

exports.routes.get('/gene/:id', function(req, res) {
    var id = req.params.id;
    if ( !id) {
        res.status(404).end('Gene id was not specified or was invalid');
        return ;
    }
    db.gene.findOne({ '$or' : [{gene_id : id}, {gene_name : id}]}, function(err, result){
        if ( err ) {
            res.status(404).end('Gene could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        }
    })
});

exports.routes.get('/gene/:id/products', function(req, res){
  var id = req.params.id;
  if ( !id) {
      res.status(404).end('Gene id was not specified or was invalid');
      return ;
  }
  db.mrna.find({'gene_id':id}, function(err, result){
      if ( err ) {
          res.status(404).end('Gene could not found');
      }
      else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
      }
  })
})

exports.routes.get('/gene/:skip/:limit',function(req, res) {
    var skip = req.params.skip;
    var limit = req.params.limit;
    console.log("skiplimit");
    db.gene.find({}, {}, { skip: skip, limit: limit }, function(err, result){
        if ( err ) {
            res.status(404).end('Gene could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        }
    })
});
