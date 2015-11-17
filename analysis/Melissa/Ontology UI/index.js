var connect = require('connect');
var logger = require("morgan"); 
var serve_static = require("serve-static"); 
var http = require('http');
var ejs = require('ejs');
var bodyparse = require('body-parser');
var cookieparser = require('cookie-parser');
var ex_session = require('express-session');
var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var Schema = mongoose.Schema;

var app = connect()
    .use (logger('dev'))
    .use (cookieparser())
    .use (ex_session( { secret : 'cmps369'}))
    .use (bodyparse())
    .use (serve_static('public'))
    .use (serve);

http.createServer(app).listen(3000);

function serve (req, res) {
    console.log(req.url + " has been requested");
    if ( req.url == "/chart") {
        render (res, "chart", {});
    }
    else if ( req.url == "/sumbitInfo") {
        getObj(req.body.mingscore, req.body.rnaloc, req.body.minont, res);
        //res.end(JSON.stringify( jobj ));
    }
}

function render (res, view, model) {
     ejs.renderFile("./templates/" + view + ".ejs" ,model,
        function(err, result) {
            if (!err) {
                res.end(result);
            }
            else {
                res.end("Error");
            }
        }
    );
}

function getObj(mingscore, rnaloc, minont, res){
    mongoose.connect('mongodb://localhost:27017/chrome');
    dataObj = {};

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function (ref) {
        console.log('Connected to mongo server.');
        
        var AnalysisSchema = new Schema({
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


        Mrna.find({
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

                function newAnalysis(mrnaList, mingscore, rnaloc) {
                    var validList =[];
                    var invalidList=[];

                    for( var rna in mrnaList ){
                        var isg4 = false; // true if valid g4 is found
                        var thisrna = mrnaList[rna];
                        if("g4s" in thisrna){
                            var g4list = thisrna["g4s"];
                            // look for first g4 in gene meeting requirements
                            for( var g4 in g4list ){
                                thisg4 = g4list[g4];
                                if(thisg4.gscore >= mingscore){
                                    if(/*thisg4["is"+rnaloc] == true*/ (thisg4.is5Prime && rnaloc == 5)
                                       || (thisg4.is3Prime && rnaloc == 3)
                                       || (thisg4.isCDS && rnaloc == 1)){ // REPLACE WITH RNA LOCATION FILTERING
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
                    var objid = ObjectId().valueOf();
                    var newA = new Analysis ({ '_id': objid, 'gscore_min': mingscore, 'g4location': rnaloc, 'validMRNA': validList, 'invalidMRNA': invalidList});
                    newA.save(function (err, newA) {
                        if (err) return console.error(err);
                    });
                    return newA;
                }

                Analysis.findOne({ 'gscore_min': mingscore, 'g4location': rnaloc}, function (err, andoc){
                    var thisAnalysis;
                    if(andoc == null){
                        thisAnalysis = newAnalysis(mrnaList, mingscore, rnaloc);

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
                                if (10 > dic[thisKey[i]].totalnum) continue; // less than 10 causes memory overflow?
                                Ontology.create({ 'name': thisKey[i], 'type': name, 'validList': dic[thisKey[i]].rnaList, 'validNum': dic[thisKey[i]].validnum, 'invalidNum': (dic[thisKey[i]].totalnum - dic[thisKey[i]].validnum), 'totalNum': dic[thisKey[i]].totalnum, 'analysisid': thisAnalysis._id })
                                if (minont <= dic[thisKey[i]].totalnum){
                                    dataObj[thisKey[i]] = dic[thisKey[i]].validnum/dic[thisKey[i]].totalnum * 100;
                                }
                            }  
                        }
                        newOnts(comp, "components");
                        newOnts(func, "functions");
                        newOnts(proc, "processes");

                        console.log("Done!");

                        //return dataObj;
                        res.end(JSON.stringify( dataObj ));
                        
                        mongoose.connection.close();
                    }else{
                        Ontology.find({ 'analysisid': andoc._id, 'totalNum': { $gt: minont } }).
                        select({ name: 1, validNum: 1, totalNum: 1 }).
                        exec(function (err, ontList){
                            for( var ont in ontList ){
                                dataObj[String(ontList[ont].name)] = Number(ontList[ont].validnum/ontList[ont].totalnum * 100);
                            }
                            //return dataObj;
                            res.end(JSON.stringify( dataObj ));
                            
                            mongoose.connection.close();
                        });
                    }
                });
        });
        // mongoose.connection.close(); // is this even needed
    });
    //return dataObj;
}
