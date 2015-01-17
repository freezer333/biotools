var express = require('express');
var qgrs_module = require('qgrs');
var qgrs_version = require('qgrs/package.json').version;
var core_routes = require('../index');
var async = require('async');
var http = require('http');
http.post = require('http-post');


exports.routes = express.Router();

exports.routes.get('/', function(req, res) {
  res.end("G4 module loaded");
});


function annotate_g4s(mrna, sequence, g4s) {
  var prefix = mrna.accession + ".";
  g4s.forEach(function (g4, index) {
    g4.id = prefix + (index+1);

    cds_start = mrna.cds ? mrna.cds.start : undefined
    cds_end = mrna.cds ? mrna.cds.end : undefined
    end = sequence.length
    if ( cds_start && cds_end ) {
      g4_start = g4.start
      g4_end = g4_start + g4.length
      g4.is5Prime = g4_start <= cds_start
      g4.isCDS = g4_start >= cds_start && g4_start <= cds_end || g4_end >= cds_start && g4_end <= cds_end
      g4.is3Prime = g4_start >= cds_end && g4_start <= end || g4_end >= cds_end && g4_end <= end
      g4.isDownstream = g4_end >= end
    }

    g4.overlaps.forEach(function (overlap, index) {
      overlap.id = g4.id + "." + (index+1);
    })
  })
}
exports.routes.get('/mrna/:principal/:comparison/cmap', function(req, res) {
  var p = req.params.principal;
  var c = req.params.comparison;
  var downstream = req.query.downstream | 0;

  var principal = {
    time : new Date(),
    qgrs_map_version : qgrs_version,
    accession : p
  }
  var comparison = {
    time : new Date(),
    qgrs_map_version : qgrs_version,
    accession : c
  }

  async.parallel([
      function (callback) {
        core_routes.build_mrna_sequence(p, downstream,
            function(err) {
              callback('Principal mRNA [' + p + '] not found');
            },
            function(mrna, sequence) {
              callback(null, {mrna:mrna, sequence : sequence});
            });
      },
      function (callback) {
        core_routes.build_mrna_sequence(c, downstream,
            function(err) {
              callback('Comparison mRNA [' + c + '] not found');
            },
            function(mrna, sequence) {
              callback(null, {mrna:mrna, sequence :sequence});
            });
      }
    ],
    function (err, results) {
      if (err ) {
        res.status(404).end(err);
        return;
      }
      principal.organism = results[0].mrna.organism;
      principal.taxon = results[0].mrna.taxon;
      principal.sequence = results[0].sequence;
      principal.g4s = JSON.parse(qgrs_module.find(principal.sequence)).results;

      comparison.organism = results[1].mrna.organism;
      comparison.taxon = results[1].mrna.taxon;
      comparison.sequence = results[1].sequence;
      comparison.g4s = JSON.parse(qgrs_module.find(comparison.sequence)).results;

      annotate_g4s(results[0].mrna, principal.sequence, principal.g4s);
      annotate_g4s(results[1].mrna, comparison.sequence, comparison.g4s);
      var aligner = require('../../tools/align')
      var result = aligner.run(principal.sequence, comparison.sequence, { gapopen : 10, gapextend : 0.5},
          function(alignment) {
              var result = {
                principal : principal,
                comparison : comparison,
                alignment : alignment
              };


              process_aligned_sequences(result, function(err, result){
                if ( err) {
                  res.status(404).end(err);
                }
                else {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                }
              })
          },
          function(err) {
              res.status(404).end("Could not perform needle alignment");
              return;
          }
      );

    });
});


function process_aligned_sequences(input, callback) {

  var conserve = require('../../utils/conserve.js')

  conserve.map_gaps(input.alignment.a, input.principal.g4s);
  conserve.map_gaps(input.alignment.b, input.comparison.g4s);

  conserve.compute_conservation(input.principal, input.comparison);
  callback(null, input);


}
