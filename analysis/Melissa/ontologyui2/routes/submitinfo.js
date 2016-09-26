var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var Schema = mongoose.Schema;

var fs = require('graceful-fs'); // file system with request queue
var path = require('path');

var OntSchema;
var MrnaSchema;

router.post('/', function(req, res, next) {

    function hasg4(thismrna){
        var isg4 = false; // true if valid g4 is found
        var g4list = thismrna["g4s"];

        var searchin = "gscore";
        if( req.body.mingscore < 17 ){
            var searchin = "tetrads"
        }

        var loc = "is"+String(req.body.rnaloc); // is 5Prime, isDownstream, isCDN, is3Prime
        
        // look for first g4 in gene meeting requirements
        for( var g4 in g4list ){
            thisg4 = g4list[g4];
            if(thisg4[searchin] >= req.body.mingscore){
                if(thisg4[loc] == true){ 
                    isg4 = true;
                    break;
                }
            }
        }
        return isg4;
    }

	function addTerms(thismrna, type, typelist){
		for(var ont in thismrna.ontology[type]){
			var thisont = thismrna.ontology[type][ont];
			if( typelist[thisont] != null && typeof thisont != 'object'){ // if the ontology is in the list
                if ( (typelist[thisont]['list_qgrs']).indexOf(thismrna['accession']) == -1 ){ // and mRNA is not already listed
				    typelist[thisont]['num_with_qgrs'] = typelist[thisont]['num_with_qgrs'] + 1;
				    typelist[thisont]['list_qgrs'].push( thismrna['accession'] );
                }
			}
        }
	}

    function addNewTerms(thismrna, type, typelist, isg4){
        var add = 0;
        if(isg4 == true){
            add = 1;
        }
        for(var ont in thismrna.ontology[type]){
            var thisont = thismrna.ontology[type][ont];
            if( typelist[thisont] != null && typeof thisont != 'object'){
                if((typelist[thisont]['list_qgrs']).indexOf(thismrna['accession']) == -1){
                    typelist[thisont]['num_with_qgrs'] = typelist[thisont]['num_with_qgrs'] + add; // num w/ g4
                    typelist[thisont]['num_total'] = typelist[thisont]['num_total'] + 1; // total num
                    if(isg4){
                        typelist[thisont]['list_qgrs'].push( thismrna['accession'] ); // list w/ g4
                    }
                    typelist[thisont]['list_all'].push( thismrna['accession'] ); // total list
                }
            }else{
                typelist[thisont] = {
                    'num_with_qgrs': add,
                    'num_total': 1,
                    'list_qgrs': [], 
                    'list_all': [thismrna['accession']], 
                    'type': type
                };
                if(isg4){
                    typelist[thisont]['list_qgrs'].push( thismrna['accession'] ); // num w/ g4
                }
            }
        }
    }

	if(mongoose.connection.readyState != 1){
        mongoose.connect('mongodb://localhost:27017/chrome');
        var db = mongoose.connection;
    }
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function (ref) {
    	console.log('Connected to mongo server.');

    	if(typeof OntSchema === 'undefined'){
	        OntSchema = new Schema({
	            'term': String, // ontology name
	            'type': String, // components, functions, or processes
	            'mrna_list': Array, // list of associated mRNA
	            'num_mrna': Number // number of associated mRNA
	        }, { collection : 'ontologies' });
    	}
        var OntologyList = mongoose.model('Ontology', OntSchema);
        
        if(typeof MrnaSchema === 'undefined'){
	        MrnaSchema = new Schema({ // mRNA already in database
	            'organism': String,
	            'accession': String,
	            'g4s': Array,
	            'ontology': {
	                'components': Array,
	                'functions': Array,
	                'processes': Array }
	            }, { collection : 'mrna' });
	    }
        var Mrna = mongoose.model('Mrna', MrnaSchema);

        var ont_terms = {};
        // initialize ontology lists
        // in the form [0: number with g4, 1: total number, 2: accession list with g4, 3: total accession list]
        // new form: { num_with_qgrs, num_total, list_qgrs, list_all }

        if(req.body.targetgenelist == 'all'){ // use all mrna
            OntologyList.find({num_mrna: { $gte : Number(req.body.minont)}}).
                select('term type mrna_list num_mrna'). // select everything
                exec(function (err1, ontList) {

                    for( var ont in ontList){
                    	ont_terms[ontList[ont]['term']] = {
                            'num_with_qgrs': 0,
                            'num_total': ontList[ont]['num_mrna'], 
                            'list_qgrs': [], 
                            'list_all': ontList[ont]['mrna_list'],
                            'type': ontList[ont]['type']
                        };
                    }


                	Mrna.find({
    		            organism: 'Homo sapiens',
    		            hasontology: true,
    		            hasg4s: true
    		            }).
    		            select('g4s accession ontology'). // limited selection
    		            exec(function (err2, mrnaList) {

                            // check mrna for g4
                            // if g4 found, add to ontologies
                            for( var mrna in mrnaList){
                            	var isg4 = hasg4(mrnaList[mrna]);
                            	
                                if(isg4 == true){
                                	// deal with ontologies
                                	addTerms(mrnaList[mrna], 'components', ont_terms);
                                	addTerms(mrnaList[mrna], 'functions', ont_terms);
                                	addTerms(mrnaList[mrna], 'processes', ont_terms);
                                }else{
                                    continue;
                                }
                            }
    				
    						res.json(ont_terms);

    						mongoose.connection.close();
    					}
    				);
            	}
            );
        }else{
            var validmrna = []; // array of target mrna. ONLY examine these
            var pathname = req.body.targetgenelist;
            var filePath = path.join(__dirname, pathname);

            fs.readFileSync(filePath).toString().split('\n').forEach(function (line) {
                validmrna.push(line);
            });

            Mrna.find({
                accession: { $in: validmrna },
                hasontology: true,
                hasg4s: true
                }).
                select('g4s accession ontology'). // limited selection
                exec(function (err, mrnaList) {
                    for (mrna in mrnaList){
                        thismrna = mrnaList[mrna];
                        var isg4 = hasg4(thismrna);
                        
                        addNewTerms(thismrna, 'components', ont_terms, isg4);
                        addNewTerms(thismrna, 'functions', ont_terms, isg4);
                        addNewTerms(thismrna, 'processes', ont_terms, isg4);
                    }
                    for(ontterm in ont_terms){
                        if(ont_terms[ontterm]['num_total'] < req.body.minont){
                            delete ont_terms[ontterm];
                        }
                    }
                    res.json(ont_terms);
                    mongoose.connection.close();
                }
            ); 
        }
	});
});

module.exports = router;
