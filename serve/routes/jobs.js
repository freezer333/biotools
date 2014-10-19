
var db = require("../db");

exports.list = function (req, res) {
  var owner = req.params.ownder;
  var q = {};
  if ( owner) {
      q.owner = owner;
  }
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
