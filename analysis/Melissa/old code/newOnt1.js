var prompt = require('prompt');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/chrome');

/*
var fs = require('graceful-fs'); // file system with request queue
*/

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (ref) {
        console.log('Connected to mongo server.');
        
        MrnaSchema = new Schema({ 'organism': String, 'accession': String, 'g4s': Array},
                   { collection : 'mrna' });
        var Mrna = mongoose.model('Mrna', MrnaSchema);
        
        AnalysisSchema = new Schema({ '_id': Schema.Types.ObjectId, 'gscore_min': Number, 'g4location': Number, 'validMRNA': Array, 'invalidMRNA': Array, });
        var Analysis = mongoose.model('Analysis', AnalysisSchema);
        
        Mrna.
        find({
             organism: 'Homo sapiens',
             ontology: { $exists: true }
             // can add more filters for variable input
             }).
        //limit(100). // just for testing
        select({ g4s: 1, accession: 1 }). // only select g4 and accession
        exec(function (err, mrnaList) {
             
             prompt.start();
             var minOntnum;
             console.log("What is the minimum gscore and rna location?\n Use 5 for 5'-UTR, 3 for 3'-UTR, or 1 for CDS");
             prompt.get(['mingscore','rnaloc'], function (err, result) {
             /*
             fs.writeFile("./validg4.txt", "", function(err){
                          if(err) { return console.log(err); }
                          });
             fs.writeFile("./invalidg4.txt", "", function(err){
                          if(err) { return console.log(err); }
                          });
              */
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
                        if(thisg4.gscore >= result.mingscore){ // REPLACE WITH GSCORE VARIABLE
                            if((thisg4.is5Prime && result.rnaloc == 5)
                               || (thisg4.is3Prime && result.rnaloc == 3)
                               || (thisg4.isCDS && result.rnaloc == 1)){ // REPLACE WITH RNA LOCATION FILTERING
                                isg4 = true;
                                break;
                        }
                    }
            
                }
                if(isg4){
                    /*fs.appendFile("./validg4.txt", thisrna["accession"] + "\n", function(err) {
                           if(err) { return console.log(err); }
                     
                           });
                     */
                        validList.push(thisrna["accession"]);
                        
                }else{
                    /*fs.appendFile("./invalidg4.txt", thisrna["accession"] + "\n", function(err) {
                           if(err) { return console.log(err); }
                           });
                     */
                        invalidList.push(thisrna["accession"]);
                }
                        }
                        }
                        Analysis.create({ '_id': Schema.Types.ObjectId, 'gscore_min': mingscore, 'g4location': rnaloc, 'validMRNA': validList, 'invalidMRNA': invalidList});
                    });
             });
        });
// mongoose.connection.close(); // MAKE THIS WAIT FOR PREVIOUS CODE