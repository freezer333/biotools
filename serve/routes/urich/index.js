var core_routes = require('../index');
var qgrs_routes = require('../qgrs');
var db = require("../../db");

exports.index = function(req, res) {
    res.render("urich/ugcorrelate");
}


exports.uganalysis = function(req, res) {
  var query = core_routes.build_mrna_query(req, [{g4s : {'$exists' : true}}, {u_rich_downstream : {'$exists':true}}]);
  var base_g_filter = qgrs_routes.makeQgrsFilter(req);

  var job = new db.jobs ( {
      type : "Urich QGRS Correlation Analysis",
      progress: 0,
      status: "Starting",
      complete: false,
      error : false,
      error_message: "",
      date : new Date(),
      query : { 'qgrs' : base_g_filter },
      owner : "scott.frees@gmail.com",
  });
  job.save(function (saved) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(job));
  });


  var total_to_be_processed = 0
  var status_increment = 100000;

  db.mrna.count(query, function (err, doc){
    total_to_be_processed = parseInt(doc);
    status_increment = Math.floor(total_to_be_processed / 100);
  });

  var stream = db.mrna.find(query, {g4s : 1, u_rich_downstream : 1}).stream();

  var mrna_count = 0;
  var with_u_count_only = 0;
  var with_g_count_only = 0;
  var with_both = 0;
  var with_neither = 0;

  stream.on('data', function (doc) {
    var num_gs = doc.g4s
                  .filter(function (g4) { return g4.isDownstream })
                  .filter(base_g_filter.apply)
                  .length;

    var num_us = doc.u_rich_downstream.length;

    if ( num_gs > 0 && num_us > 0 ) with_both++;
    else if ( num_gs > 0 ) with_g_count_only++;
    else if ( num_us > 0 ) with_u_count_only++;
    else with_neither++;
    if ( mrna_count % status_increment == 0 ) {
      if ( total_to_be_processed == 0 ) {
        job.progress = 0;
      }
      else {
          job.progress = mrna_count / total_to_be_processed;
      }
      job.status = "Processed " + mrna_count + " mRNA of " + total_to_be_processed;
      job.save();
    }

    mrna_count++;
  });

  stream.on('close', function() {
    job.progress = 100;
    job.status = "Analysis Complete";
    job.complete = true;

    job.result  = {
      mrna_count : mrna_count,
      with_u_count_only : with_u_count_only,
      with_g_count_only : with_g_count_only,
      with_both : with_both,
      with_neither : with_neither
    }
    job.save();
  });

  stream.on('error', function(err) {
    job.progress = 0;
    job.status = "Analysis Failed";
    job.error = true;
    job.complete = false;
    job.error_message = JSON.stringify(err);
    job.save();
  });
}
