var prompt = require('prompt');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/chrome');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (ref) {
    console.log('Connected to mongo server.');
    
    AnalysisSchema = new Schema({
        '_id': Schema.Types.ObjectId,
        'gscore_min': Number, // minimum acceptable g4 gscore
        'g4location': Number, // 5 = 5'-UTR | 3 = 3'-UTR | 1 = CDS
        'validMRNA': Array, // array of accession numbers
        'invalidMRNA': Array // array of accession numbers
    });
    var Analysis = mongoose.model('Analysis', AnalysisSchema);

    var Ont = new Schema({
        'name': String, // ontology name
        'type': String, // component, function, or process
        'validList': Array, // list of mRNA accessions with g4 meering parameters
        'validNum': Number, // number of mRNA with q4 meeting parameters
        'invalidNum': Number, // number of mRNA with NO q4 meeting parameters
        'totalNum': Number, // number of mRNA with this ontology term
        'analysisid': Schema.Types.ObjectId // id of associated analysis
    });
    var Ontology = mongoose.model('Ontology', Ont);
    
    var MrnaSchema = new Schema({ // mRNA already in database
        'organism': String,
        'accession': String,
        'g4s': Array,
        'ontology': {
            'components': Array,
            'functions': Array,
            'processes': Array }
        }, { collection : 'mrna' });
    var Mrna = mongoose.model('Mrna', MrnaSchema);


    Mrna.
    find({
        organism: 'Homo sapiens',
        ontology: { $exists: true }
        // can add more filters for variable input
        }).
        //limit(500). // just for testing
        select({ g4s: 1, accession: 1, ontology: 1 }). // only select g4 and accession
        exec(function (err, mrnaList) {

            function addTerms(thisaccession, terms, dic, ontNum, isg4){
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

            function newAnalysis(mrnaList, result) {
                var validList =[];
                var invalidList=[];

                for( rna in mrnaList ){
                    var isg4 = false; // true if valid g4 is found
                    var thisrna = mrnaList[rna];
                    if("g4s" in thisrna){
                        var g4list = thisrna["g4s"];
                        // look for first g4 in gene meeting requirements
                        for( g4 in g4list ){
                            thisg4 = g4list[g4];
                            if(thisg4.gscore >= result.mingscore){
                                if((thisg4.is5Prime && result.rnaloc == 5)
                                   || (thisg4.is3Prime && result.rnaloc == 3)
                                   || (thisg4.isCDS && result.rnaloc == 1)){ // REPLACE WITH RNA LOCATION FILTERING
                                    isg4 = true;
                                    break;
                                }
                            }
                        }
                        if(isg4){
                            validList.push(thisrna["accession"]);
                        
                        }else{
                            invalidList.push(thisrna["accession"]);
                        }
                    }
                }
                //var objid = Schema.Types.ObjectId;
                var objid = ObjectId().valueOf();
                Analysis.create({ '_id': objid, 'gscore_min': result.mingscore, 'g4location': result.rnaloc, 'validMRNA': validList, 'invalidMRNA': invalidList});
                return { '_id': objid, 'gscore_min': result.mingscore, 'g4location': result.rnaloc, 'validMRNA': validList, 'invalidMRNA': invalidList};
            }

            /*function newOntologies(mrnaList, andoc){
                var comp = {};
                var func = {};
                var proc = {};
                var ontNum = [0];

                validrna = andoc.validMRNA;
                invalidrna = andoc.invalidMRNA;
             
                for( var rna in mrnaList ){
                    if(typeof mrnaList[rna].ontology == "undefined"){continue;}
                    if( validrna.indexOf(mrnaList[rna].accession) > -1 ){
                        addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['components'], comp, ontNum, true);
                        addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['functions'], func, ontNum, true);
                        addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['processes'], proc, ontNum, true);
                    }else if( invalidrna.indexOf(mrnaList[rna].accession) > -1 ){
                        addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['components'], comp, ontNum, false);
                        addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['functions'], func, ontNum, false);
                        addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['processes'], proc, ontNum, false);
                    }else{
                        continue;
                    }
                }

                function newOnts(dic, name){
                    var thisKey = Object.keys(dic);
                    for( var i = 0 ; i < thisKey.length ; i++){
                        //if( parseInt(result.mininput) > list[thisKey[i]].totalnum ){continue;}
                        Ontologies.create({
                            'name': thisKey[i],
                            'type': name,
                            'validList': dic[thisKey[i]].rnaList,
                            'validNum': dic[thisKey[i]].validnum,
                            'invalidNum': dic[thisKey[i]].totalnum - dic[thisKey[i]].validnum,
                            'totalNum': dic[thisKey[i]].totalnum,
                            'analysisid': andoc._id
                        })
                    }  
                }

                newOnts(comp, "components");
                newOnts(func, "functions");
                newOnts(proc, "processes");

                console.log("Done!");
            }*/


            prompt.start();
            console.log("What is the minimum gscore and rna location?\n Use 5 for 5'-UTR, 3 for 3'-UTR, or 1 for CDS");
            prompt.get(['mingscore','rnaloc'/*,'mininput'*/], function (err, result) {
                Analysis.findOne({ 'gscore_min': result.mingscore, 'g4location': result.rnaloc}, function (err, andoc){
                    var thisAnalysis;
                    if(andoc == null){
                        thisAnalysis = newAnalysis(mrnaList, result);
                        //newOntologies(mrnaList, thisAnalysis);

                        var comp = {};
                        var func = {};
                        var proc = {};
                        var ontNum = [0];

                        validrna = thisAnalysis.validMRNA;
                        invalidrna = thisAnalysis.invalidMRNA;
                     
                        for( var rna in mrnaList ){
                            if(typeof mrnaList[rna].ontology == "undefined"){continue;}
                            if( validrna.indexOf(mrnaList[rna].accession) > -1 ){
                                addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['components'], comp, ontNum, true);
                                addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['functions'], func, ontNum, true);
                                addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['processes'], proc, ontNum, true);
                            }else if( invalidrna.indexOf(mrnaList[rna].accession) > -1 ){
                                addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['components'], comp, ontNum, false);
                                addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['functions'], func, ontNum, false);
                                addTerms(mrnaList[rna].accession, mrnaList[rna].ontology['processes'], proc, ontNum, false);
                            }else{
                                continue;
                            }
                        }
                        function newOnts(dic, name){
                            var thisKey = Object.keys(dic);
                            for( var i = 0 ; i < thisKey.length ; i++){
                                //console.log({ 'name': thisKey[i], 'type': name, 'validList': dic[thisKey[i]].rnaList, 'validNum': dic[thisKey[i]].validnum, 'invalidNum': (dic[thisKey[i]].totalnum - dic[thisKey[i]].validnum), 'totalNum': dic[thisKey[i]].totalnum, 'analysisid': thisAnalysis._id });
                                //if( parseInt(result.mininput) > list[thisKey[i]].totalnum ){continue;}
                                if (10 > dic[thisKey[i]].totalnum) continue;
                                Ontology.create({ 'name': thisKey[i], 'type': name, 'validList': dic[thisKey[i]].rnaList, 'validNum': dic[thisKey[i]].validnum, 'invalidNum': (dic[thisKey[i]].totalnum - dic[thisKey[i]].validnum), 'totalNum': dic[thisKey[i]].totalnum, 'analysisid': thisAnalysis._id })
                            }  
                        }
                        newOnts(comp, "components");
                        newOnts(func, "functions");
                        newOnts(proc, "processes");

                        console.log("Done!");
                        mongoose.connection.close();

                    }else{
                        console.log("These parameters are already in the DB");
                        mongoose.connection.close();
                    }
                    
                    /*if( thisAnalysis.minonts.indexOf(result.mininput) == -1 || isNew){
                        newOntologies(mrnaList, andoc, result.mininput);
                        if(!isNew){
                            var tmp = minonts;
                            tmp.push(result.mininput);
                            Analysis.update({ _id: thisAnalysis._id }, { minonts: tmp }, fn);
                        }
                        console.log("Done!");
                    }else{
                        console.log("These parameters are already in the DB");
                    }*/
                });
            });
        });
    });
// mongoose.connection.close(); // MAKE THIS WAIT FOR PREVIOUS CODE