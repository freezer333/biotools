
var db = require("../../db");
var JSONStream = require('JSONStream')
var xlsx = require('node-xlsx');

exports.main = function(req, res) {
  var page = {}


  res.render("qgrs/g4utr3", page);
}

exports.functions = function (req, res) {
  db.native.collection('g4utr3.meta').find({'key':'functions'}).toArray(function(err, docs) {
      res.set('Content-Type', 'application/json');
      res.end(JSON.stringify(docs[0].value));
  })
}
exports.listed_components = function (req, res) {
  db.native.collection('g4utr3.meta').find({'key':'components'}).toArray(function(err, docs) {
      res.set('Content-Type', 'application/json');
      res.end(JSON.stringify(docs[0].value));
  })
}
exports.processes = function (req, res) {
  db.native.collection('g4utr3.meta').find({'key':'processes'}).toArray(function(err, docs) {
      res.set('Content-Type', 'application/json');
      res.end(JSON.stringify(docs[0].value));
  })
}


function contains_any(haystack, ns) {
  var needles;
  if ( ns instanceof Array) {
    needles = ns
  }
  else {
    needles = [ns];
  }

  var i = needles.filter(function(n) {
            return haystack.indexOf(n) != -1
          });
  return i.length > 0;
}
exports.listings = function(req, res) {
  var tetrads = req.query.minTetrad || 3
  var conservation = req.query.minConservation || 0.95
  var functions = req.query.functions || []
  var components = req.query.components || []
  var processes = req.query.processes || []
  var unwind = {'$unwind':'$g4s'};
  var sort = {'$sort': {'gene_name':1}}
  var output_type = req.query.output || "json";
  var pipeline = []
  pipeline.push(sort);
  pipeline.push(unwind);


  if ( tetrads ) {
    var t = parseInt(tetrads);
    if ( t != NaN) {
      var tetrad_match = {'$match' : {'g4s.tetrads': {'$gte': t}}};
      pipeline.push(tetrad_match)
    }
  }
  if ( conservation ) {
    var c = parseFloat(conservation);
    if ( c != NaN) {
      var conserve_match = {'$match' : {'g4s.conserved.score.overall': {'$gte': c}}};
      pipeline.push(conserve_match)
    }
  }

  var cursor = db.native.collection('g4utr3').aggregate(pipeline, {
                   allowDiskUsage: true, cursor: {batchSize: 1000}});
  var results = [];
  var ontology = [];
  cursor.on('error', function (err) {
    console.log(err);
    res.status(404).end("Analysis pipeline failed - " + err);
  })
  cursor.on('data', function(data) {
    /// This is a (programming) time saver because aggregation would make this a pain (more unwinds)
    /// This data set is pretty small - not a big deal here.
    if ( functions.length > 0 && (!data.ontology || !contains_any(data.ontology.functions, functions))) {
      return;
    }
    if ( components.length > 0 && (!data.ontology || !contains_any(data.ontology.components, components))) {
      return;
    }
    if ( processes.length > 0 && (!data.ontology || !contains_any(data.ontology.processes, processes))) {
      return;
    }
    results.push(data);
  });
  cursor.on('end', function() {
    if ( output_type == "json") {
        res.set('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
    }
    else {
      var rows = [];
      rows.push ( ["accession", "gene name", "gene id", "qgrs id", "position", "3'UTR", "Downstream", "Sequence", "tetrads", "conservation"])
      results.forEach(function (listing){
        rows.push([listing.accession, listing.gene_name, listing.gene_id, listing.g4s.id, (listing.g4s.start + " - " + (listing.g4s.start + listing.g4s.length)),
                  listing.g4s.is3Prime, listing.g4s.isDownstream, listing.g4s.sequence, listing.g4s.tetrads, listing.g4s.conserved.score.overall]);
      });
      var buffer = xlsx.build([{
        name: "Conserved (Mus musculus) G4 in Homo sapien 3'UTR",
        data: rows
      }]);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats');
      res.setHeader("Content-Disposition", "attachment; filename=" + "g4utr3conserved.xlsx");
      res.end(buffer);
    }

  });


}
