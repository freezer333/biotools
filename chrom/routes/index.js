
var mongoose = exports.mongoose = require ("mongoose");
var db = exports.schemas = require("../db");
var url = "mongodb://localhost:27017/chrome";
var fs = require('fs');

var mongoose = exports.mongoose = require ("mongoose");
mongoose.connect(url, { auto_reconnect: true }, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + url + '. ' + err);
  } else {
    db.init(mongoose);
  }
});



exports.chrom = function(req, res) {
    var accession = req.params.accession;
    var start = req.params.start;
    var end = req.params.end;

    if ( !accession || !start || !end ) {
        res.status(404).end('Sequence range was not specified or was invalid');
        return ;
    }

    db.getSequence(accession, start, end, function(err, result) {
        if ( err ) {
            res.status(404).end('Sequence range could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));    
        }
    });
}

exports.gene = function(req, res) {
    var id = req.params.id;
    console.log("Searching for gene " + id );
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
}

exports.gene_list = function(req, res) {
    var skip = req.params.skip;
    var limit = req.params.limit;
    
    db.gene.find({}, {gene_id : 1, gene_name : 1}, { skip: skip, limit: limit }, function(err, result){
        if ( err ) {
            res.status(404).end('Gene could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));    
        }
    })
}

exports.mrna = function(req, res) {
    var accession = req.params.accession;
    console.log("Searching for mrna " + accession );
    if ( !accession) {
        res.status(404).end('mRNA accession was not specified or was invalid');
        return ;
    }
    db.mrna.findOne({ accession : accession}, function(err, result){
        if ( err ) {
            res.status(404).end('mRNA could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));    
        }
    })
}

exports.mrna_list = function(req, res) {
    var skip = req.params.skip;
    var limit = req.params.limit;
    
    db.mrna.find({}, {gene_id : 1, accession : 1}, { skip: skip, limit: limit }, function(err, result){
        if ( err ) {
            res.status(404).end('Gene could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));    
        }
    })
}

