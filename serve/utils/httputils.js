exports.local_endpoint = function(req) {
  var port = req.app.settings.port;
  var url = req.protocol + '://' + req.hostname  + ( port == 80 || port == 443 ? '' : ':'+port );
  return url;
}
