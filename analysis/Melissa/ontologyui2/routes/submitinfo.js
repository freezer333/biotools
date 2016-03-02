var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var Schema = mongoose.Schema;

var OntSchema;
var MrnaSchema;

router.post('/', function(req, res, next) {

	function addTerms(thismrna, type, typelist){
		for(var ont in thismrna.ontology[type]){
			var thisont = thismrna.ontology[type][ont];
			if( (typelist.indexOf(thisont) != -1) && ((typelist[thisont][2]).indexOf(thismrna['accession']) == -1) ){
				typelist[thisont][0] = typelist[thisont][0] + 1;
				typelist[thisont][2].push( thismrna['accession'] );
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

        OntologyList.find({num_mrna: { $gte : Number(req.body.minont)}}).
            select('term type mrna_list num_mrna'). // select everything
            exec(function (err1, ontList) {

            	var ont_terms = {};
                // initialize ontology lists
                // in the form [0: number with g4, 1: total number, 2: accession list with g4, 3: total accession list]
                var genelist = req.body.targetgenelist;
                for( var ont in ontList){
                	// FILTER ONTOLOGY ACCORDING TO TARGET MRNA
                	// NEED TO
                	/*if( typeof genelist != 'undefined' ){
                		var istarget = false;
                		for(var ontmrna in ontList[ont]['mrna_list']){
                			//for(var targetmrna in genelist){
                				var index = genelist.indexOf(ontList[ont]['mrna_list'][ontmrna]);
                				if( index > -1  ){
	                			//if(String(ontList[ont]['mrna_list'][ontmrna]) == String(genelist[targetmrna])){
	                				//console.log(String(genelist[index]) + " = " + ontList[ont]['mrna_list'][ontmrna])
	                				istarget = true;
	                				break;
	                			}
                			//}
                		}
                		if(istarget == false){
                			continue;
                		}
                	}*/
                	ont_terms[ontList[ont]['term']] = [ 0, ontList[ont]['num_mrna'], [], ontList[ont]['mrna_list'] ];
                	//console.log(ontList[ont]['term']);
                }


            	Mrna.find({
		            organism: 'Homo sapiens',
		            ontology: { $exists: true },
		            g4s: { $exists: true }
		            }).
		            select('g4s accession ontology'). // limited selection
		            exec(function (err2, mrnaList) {

                        // check mrna for g4
                        // if g4 found, add to ontologies
                        for( var mrna in mrnaList){
                        	var isg4 = false; // true if valid g4 is found
                            var g4list = mrnaList[mrna]["g4s"];

                            // look for first g4 in gene meeting requirements
                            var searchin = "gscore";
                            if( req.body.mingscore < 17 ){
                            	var searchin = "tetrads"
                            }
                            
                            for( var g4 in g4list ){
                                thisg4 = g4list[g4];
                                if(thisg4[searchin] >= req.body.mingscore){
                                    if(/*thisg4["is"+rnaloc] == true*/ (thisg4.is5Prime && req.body.rnaloc == 5)
                                       || (thisg4.is3Prime && req.body.rnaloc == 3)
                                       || (thisg4.isCDS && req.body.rnaloc == 1)
                                       || (thisg4.isDownstream && req.body.rnaloc == 0)){ // REPLACE WITH RNA LOCATION FILTERING
                                        isg4 = true;
                                        break;
                                    }
                                }
                            }
                        	
                            if(isg4){
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
	});
});

module.exports = router;
