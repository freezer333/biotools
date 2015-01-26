var express = require('express');
var qgrs_module = require('qgrs');
var qgrs_version = require('qgrs/package.json').version;
var core_routes = require('../index');
var async = require('async');
var http = require('http');
var rest = require('restler');
var httputils = require('../../utils/httputils');


exports.routes = express.Router();
var utr3 = require('./utr3');

exports.routes.get('/datasets/g4utr3', utr3.main )
exports.routes.get('/datasets/g4utr3/listings', utr3.listings )
exports.routes.get('/datasets/g4utr3/functions', utr3.functions )
exports.routes.get('/datasets/g4utr3/components', utr3.listed_components )
exports.routes.get('/datasets/g4utr3/processes', utr3.processes )

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
      g4.isDownstream = g4_end >= mrna.utr_3.end;
    }

    g4.overlaps.forEach(function (overlap, index) {
      overlap.id = g4.id + "." + (index+1);
    })
  })
}
exports.routes.get('/mrna/:principal/:comparison/cmap', function(req, res) {
  var p = req.params.principal;
  var c = req.params.comparison;
  var downstream = parseInt(req.query.downstream || 0);

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

  var debug = require('debug')('cmap');
  var elapsed_c_map;
  var elapsed_p_map;
  var start = new Date();

  async.parallel([
      function (callback) {
        core_routes.build_mrna_sequence(p, downstream,
            function(err) {
              callback('Principal mRNA [' + p + '] not found');
            },
            function(mrna, sequence) {
              callback(null, {mrna:mrna, sequence : sequence});
              elapsed_p_map = (new Date())-start;
            });
      },
      function (callback) {
        core_routes.build_mrna_sequence(c, downstream,
            function(err) {
              callback('Comparison mRNA [' + c + '] not found');
            },
            function(mrna, sequence) {
              callback(null, {mrna:mrna, sequence :sequence});
              elapsed_c_map = (new Date())-start;
            });
      }
    ],
    function (err, results) {
      if (err ) {
        res.status(404).end(err);
        return;
      }
      start = new Date();
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


      var jsonData = { a : {id:principal.accession, seq:principal.sequence},
                       b : {id:comparison.accession, seq:comparison.sequence},
                       downstream:downstream};
      var url =httputils.local_endpoint(req) + "/alignment/cacheable";

      rest.postJson(url, jsonData).on('complete', function(alignment, response) {
        if ( response.statusCode != 200) {
          res.status(404).end("Could not perform needle alignment");
          return;
        }

        var result = {
          principal : principal,
          comparison : comparison,
          alignment : alignment
        };
        var elapsed_align = (new Date()) - start;
        start = new Date()
        process_aligned_sequences(result, function(err, result){
          if ( err) {
            res.status(404).end(err);
          }
          else {
            elapsed_conserve = new Date() - start;
            debug("p_gmap = " + elapsed_p_map/1000 + "s, p_cmap = " + elapsed_c_map/1000 + ",s align=" + elapsed_align/1000  +
                  "s, conserve=" + elapsed_conserve/1000 + "s");

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          }
        })
      });

    });
});


function process_aligned_sequences(input, callback) {

  var conserve = require('../../utils/conserve.js')
  conserve.map_gaps(input.alignment.a, input.principal.g4s);
  conserve.map_gaps(input.alignment.b, input.comparison.g4s);
  conserve.compute_conservation(input.principal, input.comparison);
  callback(null, input);


}
