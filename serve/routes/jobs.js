
var db = require("../db");

exports.list = function (req, res) {
  var owner = req.query.owner;
  var type = req.query.type;
  var complete = req.query.complete;
  var q = {};

  if ( owner) q.owner = owner;
  if ( type ) q.type = type;
  if ( complete) q.complete = complete;

  db.jobs.find(q, function(err, result){
      if ( err ) {
          res.status(404).end('Job listing could not found');
      }
      else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
      }
  })
}
