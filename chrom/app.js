var express         = require('express');
var morgan          = require('morgan');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var favicon         = require('static-favicon');
var cookieParser    = require('cookie-parser');
var session         = require('express-session');
var http            = require('http');
var fs              = require('fs');


var app = exports.app = express();
var routes = require('./routes');

var port = process.env.PORT || 3000;

app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(morgan('dev'));                     
app.use(bodyParser());    
app.use(require('less-middleware')(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));   
app.use(express.static(__dirname + '/bower_components'));   
app.use(methodOverride());  
app.use(cookieParser());
app.use(session({ secret: 'qgrs-rcnj-1986'}))

app.get('/chrom/:accession/:start/:end', routes.chrom);
app.get('/gene/:id', routes.gene)
app.get('/gene/:skip/:limit', routes.gene_list)
app.get('/mrna/:accession', routes.mrna)
app.get('/mrna/:skip/:limit', routes.mrna_list)
http.createServer(app).listen(port);   