var express         = require('express');
var morgan          = require('morgan');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var favicon         = require('static-favicon');
var cookieParser    = require('cookie-parser');
var session         = require('express-session');
var http            = require('http');
var fs              = require('fs');

console.log("Starting node web services (pid= " + process.pid + ")")

var app = exports.app = express();
var routes = require('./routes');
var alignment_routes = require('./routes/alignment');
var job_routes = require('./routes/jobs');
var homologene_routes = require('./routes/homologene');
var qgrs_routes = require('./routes/qgrs');
var urich_routes = require('./routes/urich');
var mrna_routes = require('./routes/mrna');

var chrom = require('./routes/chrom').routes;
var gene = require('./routes/gene').routes;
var alignment = require('./routes/alignment').routes;

var port = process.env.PORT || 3000;

if (app.get('env') === 'development') {
  app.locals.pretty = true;
}


app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(require('less-middleware')(__dirname + '/public'));
app.use(require('less-middleware')(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));
app.use(methodOverride());
app.use(cookieParser());
app.use(session({ secret: 'qgrs-rcnj-1986'}))


app.get('/', routes.home)

app.get('/mrna/info/species', routes.mrna_species);
app.get('/mrna/info/ontology', routes.mrna_ontology);
app.get('/mrna/:accession', routes.mrna_api)
app.get('/mrna/:accession/sequence', routes.mrna_sequence)
app.get('/mrna/:accession/sequence/:start/:end', routes.mrna_sequence)
app.get('/mrna/:accession/sequence/:start', routes.mrna_sequence)
app.get('/mrna/:skip/:limit', routes.mrna_list)
app.get('/mrna/', routes.mrna_list)
app.get('/mrna', routes.mrna_list)

app.get('/gui/mrna', mrna_routes.index)
app.get('/gui/mrna/:accession', mrna_routes.record)




app.get('/homologene/gene/:id', homologene_routes.search_by_gene)
app.get('/homologene/mrna/:accession', homologene_routes.search_by_mrna)
app.get('/homologene/list/:skip/:limit', homologene_routes.index)
app.get('/homologene/list', homologene_routes.index)
app.get('/homologene/species', homologene_routes.species)

app.get('/qgrs/input', qgrs_routes.input)
app.post('/qgrs', qgrs_routes.qgrs_find);
app.get('/qgrs/:g4id', qgrs_routes.qgrs);
app.get('/qgrs/:g4id/overlaps', qgrs_routes.qgrs_overlaps)
app.post('/qgrs/:g4id/overlaps', qgrs_routes.qgrs_overlaps)
app.get('/gui/qgrs/:g4id', qgrs_routes.record);


app.get('/qgrs/mrna/:accession/map', qgrs_routes.qgrs_mrna)
app.get('/qgrs/mrna/:accession/density', qgrs_routes.qgrs_density)
app.post('/qgrs/mrna/:accession/density', qgrs_routes.qgrs_density)
app.get('/qgrs/mrna/density', qgrs_routes.qgrs_enrichment)
app.get('/qgrs/mrna/density/analysis', qgrs_routes.qgrs_enrichment_analysis)

app.get('/ugcorrelate',urich_routes.index);
app.get('/ugcorrelate/analysis', urich_routes.uganalysis)

app.get('/jobs', job_routes.list)
app.get('/jobs/:jobid', job_routes.analysis_status);


app.use('/', chrom);
app.use('/', gene)
app.use('/', alignment);
app.listen(port);
