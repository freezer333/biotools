var prompt = require('prompt');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/chrome');

var fs = require('graceful-fs'); // file system with request queue
var readline = require('readline');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (ref) {
        console.log('Connected to mongo server.');
        
        var validrna = [];
        var invalidrna = [];
        fs.readFileSync('./validg4.txt').toString().split('\n').forEach(function (line) {
                                                                      validrna.push(line);
                                                                        });
        fs.readFileSync('./invalidg4.txt').toString().split('\n').forEach(function (line) {
                                                                        invalidrna.push(line);
                                                                        });
        prompt.start();
        var minOntnum;
        console.log("What is the minimum number of mRNA you want for each saved ontology?");
        prompt.get(['mininput'], function (err, result) {
                                                                    
                                                                        /*
        readline.createInterface({
                                 input: fs.createReadStream("./validg4.txt"),
                                 terminal: false
                                 }).on('line', function(line) {
                                       validrna.push(line);
                                       });
        readline.createInterface({
                                 input: fs.createReadStream("./invalidg4.txt"),
                                 terminal: false
                                 }).on('line', function(line) {
                                       invalidrna.push(line);
                                       });
                                                                         */
        
        var Ont = new Schema({
                             'name': String,
                             'type': String,
                             'validmRNA': Array,
                             'percent': Number
                             });
        var Ontologies = mongoose.model('Ontologies', Ont);
        
        var MrnaSchema = new Schema({
                                    'organism': String,
                                    'accession': String,
                                    'ontology': {
                                        'components': Array,
                                        'functions': Array,
                                        'processes': Array }
                                    }, { collection : 'mrna' });
        var Mrna = mongoose.model('Mrna', MrnaSchema);
        
        var comp = {};
        var func = {};
        var proc = {};
        var ontNum = [0];
        
        Mrna.
        find({
             organism: 'Homo sapiens',
             ontology: { $exists: true }
             // can add more filters for variable input
             // include filters as first line of mrna list file??
             }).
        //limit(1000). // just for testing
        select({ ontology: 1, accession: 1 }). // only select ontology and accession
        exec(function (err, mrnaList) {
             function addTerms(thisaccession ,terms, dic, ontNum, isg4){
                //if QGRS is in this mRNA...
                //add 1 to "Number with QGRS" and "Total mRNA with term" for each associated term
                var addNum = 0;
                if (isg4){
                    addNum = 1;
                }else{
                    addNum = 0;
                }
             
             for( var item = 0 ; item < terms.length ; item++ ){
                    if( terms[item] in dic ){
                        dic[terms[item]] = {
                            validnum: dic[terms[item]].validnum+addNum,
                            totalnum: dic[terms[item]].totalnum+1,
                            rnaList: dic[terms[item]].rnaList
                        }
                        if(isg4){ dic[terms[item]].rnaList.push(thisaccession); }
                    }else{
                        dic[terms[item]] = {
                            validnum: addNum,
                            totalnum: 1,
                            rnaList: [thisaccession]
                        } // add ontology term to dicitonary
                        ontNum[0] = ontNum[0] + 1 // add 1 to ontology list
                    }
                }
             
             }
             
             for( var rna in mrnaList ){
                if(typeof mrnaList[rna].ontology == "undefined"){continue;}
                if( validrna.indexOf(mrnaList[rna].accession) > -1 ){
                    addTerms(mrnaList[rna].accession,mrnaList[rna].ontology['components'],comp, ontNum, true);
                    addTerms(mrnaList[rna].accession,mrnaList[rna].ontology['functions'],func, ontNum, true);
                    addTerms(mrnaList[rna].accession,mrnaList[rna].ontology['processes'],proc, ontNum, true);
                }else if( invalidrna.indexOf(mrnaList[rna].accession) > -1 ){
                    addTerms(mrnaList[rna].accession,mrnaList[rna].ontology['components'],comp, ontNum, false);
                    addTerms(mrnaList[rna].accession,mrnaList[rna].ontology['functions'],func, ontNum, false);
                    addTerms(mrnaList[rna].accession,mrnaList[rna].ontology['processes'],proc, ontNum, false);
                }else{
                    continue;
                }
             }
             
             var compKeys = Object.keys(comp);
             for( var i = 0 ; i < compKeys.length ; i++){
             
             if( parseInt(result.mininput) > comp[compKeys[i]].totalnum ){continue;}
             Ontologies.create({ 'name': compKeys[i],
                               'type': 'components',
                               'validmRNA': comp[compKeys[i]].rnaList,
                               'percent': comp[compKeys[i]].validnum / parseFloat(comp[compKeys[i]].totalnum) }, function (err, small) {
                         if (err) return handleError(err);
                         // saved!
                         })
              
             }
             
             
             
             var funcKeys = Object.keys(func);
             for( var i = 0 ; i < funcKeys.length ; i++){
             
             if( parseInt(result.mininput) > func[funcKeys[i]].totalnum ){continue;}
             Ontologies.create({ 'name': funcKeys[i],
                               'type': 'functions',
                               'validmRNA': func[funcKeys[i]].rnaList,
                               'percent': func[funcKeys[i]].validnum / parseFloat(func[funcKeys[i]].totalnum) }, function (err, small) {
                               if (err) return handleError(err);
                               // saved!
                               })
             
             }
             
             
             
             var procKeys = Object.keys(proc);
             for( var i = 0 ; i < procKeys.length ; i++){
             
             if( parseInt(result.mininput) > proc[procKeys[i]].totalnum ){continue;}
             Ontologies.create({ 'name': procKeys[i],
                               'type': 'processes',
                               'validmRNA': proc[procKeys[i]].rnaList,
                               'percent': proc[procKeys[i]].validnum / parseFloat(proc[procKeys[i]].totalnum) }, function (err, small) {
                               if (err) return handleError(err);
                               // saved!
                               })
             
             }
             console.log("Done!");
             });
        
        });
        });
        
// mongoose.connection.close(); // MAKE THIS WAIT FOR PREVIOUS CODE