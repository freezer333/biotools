var db = require("../../db");
var express = require('express');
var seq_utils = require('../../utils/seq')
var async = require('async');
var resolver = require('../../utils/locus')(db);


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

// http://localhost:3000/chrom/locusmap/NT_187004/3927490/3927499
exports.routes.get('/chrom/locusmap/:accession/:locus', 
    function (req, res) {
      var accession = req.params.accession;
      var locus = parseInt(req.params.locus);
      
      var results = {
        request : {
          accession: accession, locus : locus
        }, 
        mrna : [], 
        genes : []
      }
      
      async.parallel ( [
        function(callback) {
          resolver.chromosome_to_mrna(accession, locus, function(mrna_list) {
            mrna_list.forEach(function(s) {
              var pos = resolver.chromosome_to_mrna_locus(s, locus);
              if (pos >= 0 ) {
                results.mrna.push( {
                  accession : s.accession, 
                  locus: resolver.chromosome_to_mrna_locus(s, locus)
                });
              }
              
            });
            callback();
          });
        }, 
        function (callback) {
          resolver.chromosome_to_gene(accession, locus, function(gene_list) {
            gene_list.forEach(function(s) {
             results.genes.push( {
                gene_id : s.gene_id, 
                locus: resolver.chromosome_to_gene_locus(s, locus)
              });
            });
            callback();
          });
        }, 
      ], function () {
       
        
        res.end(JSON.stringify(results));
      });
      

      

      
    }

  );

exports.routes.get('/chrom/:accession/:start/:end',

  function(req, res) {
    var accession = req.params.accession;
    var start = req.params.start;
    var end = req.params.end;
    var orientation = req.query.orientation || "+";

    if ( !accession || !start || !end ) {
        res.status(404).end('Sequence range was not specified, or was invalid');
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

