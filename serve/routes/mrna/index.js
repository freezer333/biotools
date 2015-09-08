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


exports.ontology = function(req, res) {

}


exports.ontology_enrichment(callback, mrna_query, mrna_filter) {
  var function_map = {}
  var component_map = {}
  var process_map = {}
  var total_mrna = 0;
  if ( !mrna_query ) mrna_query = {}
  if ( !mrna_filter ) mrna_filter = function() { return true}
  var cursor = db.mrna.find(mrna_query).cursor();

  cursor.on('data', function(mrna) {
    if ( mrna_filter(mrna)) {
      mrna.ontology.functions.forEach(function (f) {
        if ( f in function_map) function_map[f]++;
        else function_map[f] = 1;
      })
    }
  });

  cursor.on('end', function() {
    var result = {
      functions: function_map, 
      component : component_map, 
      process : process_map
    }
    callback()
  });

  cursor.on('error', function(err) {
    res.status(404).end('mRNA could not be found due to an error in the provided query or database unavailability');
  });
}