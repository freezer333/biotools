var db = require("../db");
var fs = require("fs");
var _ = require("underscore");
var seq_utils = require("../utils/seq");

exports.home = function(req, res) {
  res.render("home", {});
};

function serve_mrna(req, res, callback) {
  var accession = req.params.accession;
  if (!accession) {
    res.status(404).end("mRNA accession was not specified or was invalid");
    return;
  }
  db.mrna.findOne({ accession: accession }, function(err, result) {
    if (err) {
      res.status(404).end("mRNA could not found");
    } else {
      callback(req, res, result);
    }
  });
}

exports.build_mrna_sequence = function(accession, downstream, error, success) {
  db.mrna.findOne({ accession: accession }, function(err, mrna) {
    if (err || mrna == null) {
      error("the mRNA could not be found in the database.");
      return;
    } else {
      if (!mrna.exons) {
        error(
          "mRNA sequence data not available, exons data is missing for this record."
        );
        return;
      }

      function exon_compare(a, b) {
        if (a.start < b.start) return -1;
        if (a.start > b.start) return 1;
        return 0;
      }

      db.getSequence(
        mrna.chrom,
        mrna.start - 1,
        mrna.end,
        function(err, result) {
          if (err) {
            console.log("Primary sequence range was not found - " + accession);
            error(
              "Sequence range on chromosome " + mrna.chrom + " could not found"
            );
            return;
          } else {
            var sequence = "";
            mrna.exons.sort(exon_compare);
            for (i = 0; i < mrna.exons.length; i++) {
              exon = mrna.exons[i];
              var s = exon.start - mrna.start;
              var e = exon.end - mrna.start + 1;
              sequence += result.seq.substring(s, e);
            }
            if (mrna.orientation == "-") {
              sequence = seq_utils.reverse_complement(sequence);
            }

            // now pull the downstream sequence data, if it was specified...
            if (downstream) {
              var r = { start: 0, end: 0 };
              if (mrna.orientation == "-") {
                r.start = mrna.start - 1 - downstream;
                r.end = mrna.start - 1;
              } else {
                r.start = mrna.end;
                r.end = mrna.end + downstream;
              }
              db.getSequence(mrna.chrom, r.start, r.end, function(err, result) {
                if (err) {
                  console.log(
                    "Downstream sequence range was not found for " +
                      mrna.accession
                  );
                  success(mrna, sequence, 0);
                  return;
                } else {
                  var ds = result.seq;
                  if (mrna.orientation == "-") {
                    ds = seq_utils.reverse_complement(ds);
                  }
                  sequence += ds;
                  success(mrna, sequence, ds.length);
                }
              });
            } else {
              success(mrna, sequence, 0);
            }
          }
        }
      );
    }
  });
};

exports.mrna_species = function(req, res) {
  db.mrna.collection.distinct("organism", function(err, result) {
    if (err) {
      res.status(404).end(JSON.stringify(err));
    } else {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ species: result }));
    }
  });
};

exports.mrna_ontology = function(req, res) {
  var c, p, f;
  db.mrna.collection.distinct("ontology.components", function(err, result) {
    if (err) {
      res.status(404).end(JSON.stringify(err));
    } else {
      c = result;
      db.mrna.collection.distinct("ontology.processes", function(err, result) {
        if (err) {
          res.status(404).end(JSON.stringify(err));
        } else {
          p = result;
          db.mrna.collection.distinct(
            "ontology.functions",
            function(err, result) {
              if (err) {
                res.status(404).end(JSON.stringify(err));
              } else {
                f = result;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ontology: _.union(c, p, f) }));
              }
            }
          );
        }
      });
    }
  });
};

exports.mrna_sequence = function(req, res) {
  var accession = req.params.accession;
  var downstream = parseInt(req.query.downstream || 0);
  var start = req.params.start || 0;
  var end = req.params.end || -1;
  exports.build_mrna_sequence(
    accession,
    downstream,
    function(err) {
      console.log(err);
      res.status(404).end(err);
    },
    function(mrna, sequence) {
      if (start > 0 && end < 0) {
        sequence = sequence.substring(start);
      }
      if (start > 0 && end > start) {
        sequence = sequence.substring(start, end);
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ mrna: mrna, sequence: sequence }));
    }
  );
};

exports.mrna = function(req, res) {
  serve_mrna(req, res, function(req, res, result) {
    res.render("mrna", { result: result });
  });
};
exports.mrna_api = function(req, res) {
  serve_mrna(req, res, function(req, res, result) {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  });
};

exports.build_mrna_query = function(req, additional) {
  var accession_list = req.query.accession || "";
  var gene_list = req.query.gene_name || "";
  var gene_id_list = req.query.gene_id || "";
  var ontology_list = req.query.ontology || "";
  var accessions = accession_list
    ? accession_list.split(";").map(function(str) {
        return str.trim();
      })
    : null;
  var ontology_terms = ontology_list
    ? ontology_list.split(";").map(function(str) {
        return str.trim();
      })
    : null;
  var gene_names = gene_list ? gene_list.split(";").map(function(str) {
        return str.trim();
      }) : null;
  var gene_ids = gene_id_list ? gene_id_list.split(";").map(function(str) {
        return str.trim();
      }) : null;
  var selections = [];
  if (accessions) selections.push({ accession: { $in: accessions } });
  if (gene_names) selections.push({ gene_name: { $in: gene_names } });
  if (gene_ids) selections.push({ gene_id: { $in: gene_ids } });
  if (req.query.annotations == "true")
    selections.push({ cds: { $exists: true } });
  if (req.query.organism) selections.push({ organism: req.query.organism });
  if (ontology_terms) {
    var matches = [];
    var q = { $in: ontology_terms };
    var o = {};
    o["ontology.components"] = q;
    matches.push(o);
    o = {};
    o["ontology.processes"] = q;
    matches.push(o);
    o = {};
    o["ontology.functions"] = q;
    matches.push(o);
    var or = { $or: matches };
    selections.push(or);
  }

  if (additional) {
    selections = selections.concat(additional);
  }

  var query = {};
  if (selections.length == 1) {
    query = selections[0];
  } else if (selections.length > 1) {
    query["$and"] = selections;
  }
  return query;
};

exports.mrna_list = function(req, res) {
  var skip = req.params.skip || 0;
  var limit = req.params.limit || 100;
  var query = exports.build_mrna_query(req);

  db.mrna.find(
    query,
    { gene_id: 1, accession: 1, gene_name: 1, organism: 1, definition: 1 },
    { skip: skip, limit: limit },
    function(err, result) {
      if (err) {
        res.status(404).end("Gene could not found");
      } else {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      }
    }
  );
};
