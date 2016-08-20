var qgrs = require('qgrs2');
var db = require("../../serve/db");
var database = db.mongoose.connection;
var seq_utils = require('../../serve/utils/seq')
var async = require('async');

database.on('error', console.error.bind(console, 'connection error:'));

var go = function() {
    var gene_jobs = [];
    var samples = 0;
    var genes_sampled = 0;
    var genes_processed = 0;
    var samples2 = 0;
    var samples3 = 0;
    var total_genes;
    db.gene.find({organism: 'Homo sapiens'}, function(err, genes) {
        total_genes = genes.length;
        var i = 0;
        genes.forEach(function(gene){
           var j = i;
           gene_jobs.push( {
               info : gene, 
               work :function(done) {
                   getGeneSequence(gene, function(err, seq){
                       genes_processed++;
                       if ( err ) { 
                           done(); 
                           return
                       }
                       else {
                           qgrs.window(seq.seq, 
                                function(err, result){
                                    genes_sampled++;
                                    samples += result.samples;
                                    samples2 += result.samples2;
                                    samples3 += result.samples3;
                                    done();
                                }, 195, 17);
                            
                       }
                   });
               }
           });
           i++;
        });

        setInterval(function() {
            console.log("Sampled: " + genes_sampled + "\tProgress:  " + 
                genes_processed + "/" + total_genes + " - " + (genes_processed/total_genes*100).toFixed(0) + "%" + 
                "\t2+:  " + (samples2/samples*100).toFixed(2) + "%" +        
                "\t3+:  " + (samples3/samples*100).toFixed(2) + "%" + 
                "\tSamples = " + samples);                
        }, 500);

        async.parallel(gene_jobs.map(g => g.work), function(){
            console.log("complete!");
            database.close();
        })
        


        
    });
}

database.once('open', go);

var getGeneSequence = function(gene, callback){
    var accession = gene.chrom;
    var start = gene.start;
    var end = gene.end;
    var orientation = gene.orientation || "+";

    if ( !accession || !start || !end ) {
        callback("not specified");
        return;
    }

    db.getSequence(accession, start, end, function(err, result) {
        if ( err ) {
            callback('Sequence range on chromosome ' + accession + ' could not be found');
        }
        else {
            if ( orientation == '-') {
                result.seq = seq_utils.reverse_complement(result.seq);
                result.orientation = '-';
            }
            else {
                result.orientation = '+';
            }
            callback(null, result);
        }
    });
}
    


