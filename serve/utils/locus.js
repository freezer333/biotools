/*jslint node: true */
"use strict";

//------------------------------------------------------------------------
// IMPORTANT
//------------------------------------------------------------------------
// Exon coordinates are in "1-based" coordinates.  Computer scientists
// are trained in 0-based coordinates.  It's critical to always remember 
// this!
//
// https://www.biostars.org/p/84686/
//------------------------------------------------------------------------


function exon_compare(a, b) {
    if (a.start < b.start)
        return -1;
    if (a.start > b.start)
        return 1;
    return 0;
}
function get_exon(exons, locus) {
    for (var i = 0; i < exons.length; i++ ) {
        var exon = exons[i];
        if (exon.start <= locus && exon.end >= locus){
            return exon;
        }
    }
    return null;
}

module.exports = function (db) {
    return {
        mrna_to_chromosome: function (accession, position, callback) {
            db.mrna.findOne({ accession : accession}, function(err, result){
                if ( err || !result ) {
                    callback(undefined);
                }
                else {
                    callback(resolve_mrna_to_chromosome(result, position));
                }
            });
        }, 
        chromosome_to_gene : function (accession, position, callback) {
            var q = {"$and" : 
                        [ {chrom:accession}, 
                          {start : {"$lte":parseInt(position)}}, 
                          {end : {"$gte":parseInt(position)}}
                        ]
                    };
            db.gene.find(q 
                , 
                function (err, results) {
                    if ( err ) {
                        console.log(err);
                        callback(undefined);
                    }
                    else {
                        callback(results);

                    }
                });
        }, 
        chromosome_to_mrna : function (accession, position, callback) {
            var q = {"$and" : 
                        [ {chrom:accession}, 
                          {start : {"$lte":parseInt(position)}}, 
                          {end : {"$gte":parseInt(position)}}
                        ]
                    };
            db.mrna.find(q 
                , 
                function (err, results) {
                    if ( err ) {
                        console.log(err);
                        callback(undefined);
                    }
                    else {
                        callback(results);
                    }
                });
        }, 
        chromosome_to_gene_locus : function(gene, chromosome_locus) {
            if ( gene.orientation == "+") {
                console.log("[" + gene["orientation"] + "][+]");
                console.log(JSON.stringify(gene));
                return (chromosome_locus - gene.start + 1);    
            }
            else {
                console.log("[" + gene["orientation"] + "][-]");
                console.log("[" + gene["gene_name"] + "][-]");
                console.log(JSON.stringify(gene));
                return gene.end - chromosome_locus + 1;
            }
            
        },
        chromosome_to_mrna_locus : function(mrna, chromosome_locus) {
            // Step one, figure out which exon this is in, if any.  Return -1 if not
            var containing_exon = get_exon(mrna.exons, chromosome_locus);
            if ( !containing_exon ) {
                return -1;
            }

            var s = 0;
            if ( mrna.orientation == "+") {
                // now total up all exons before this exon:
                for (var i = 0; i < mrna.exons.length; i++ ) {
                    var exon = mrna.exons[i];
                    if (exon.end < chromosome_locus){
                        s += (exon.end-exon.start  + 1);
                    }
                }
                // add the difference between this locus and its exon start
                s += (chromosome_locus - containing_exon.start + 1);    
            }
            else {
                for (var i = 0; i < mrna.exons.length; i++ ) {
                    var exon = mrna.exons[i];
                    if (exon.start > chromosome_locus){
                        s += (exon.end-exon.start  + 1);
                    }

                }
                // add the difference between this locus and its exon start
                s += (containing_exon.end - chromosome_locus + 1);    
            }
            

            return s;
        }

    };
};


function resolve_mrna_to_chromosome(mrna, position) {
    var loc = {
                chromosome:mrna.chrom, 
                chromosome_position : "unknown",
                mrna_accession: mrna.accession, 
                mrna_position: parseInt(position)
            };
    
    var length = 0;
    var exon = null;
    var i = 0;
    if ( mrna.orientation == "+") {
        mrna.exons.sort(plus_compare);
        for (i = 0; i < mrna.exons.length; i++ ) {
            exon = mrna.exons[i];
            exon.relative_start = length;
            exon.relative_end = length + (exon.end-exon.start);
            length += (exon.end-exon.start);
        }
        exon  = find_exon_plus(mrna.exons, position);
        loc.chromosome_position = (position - exon.relative_start) + exon.start;
    }
    else {
        mrna.exons.sort(minus_compare);
        for (i = 0; i < mrna.exons.length; i++ ) {
            exon = mrna.exons[i];
            exon.relative_end = length;
            exon.relative_start = length + (exon.end-exon.start);
            length += (exon.end-exon.start);
        }
        exon  = find_exon_minus(mrna.exons, position);
        loc.chromosome_position = exon.end - (position - exon.relative_end);
    }
    return loc;
}

function find_exon_plus(exons, position) {
    for ( var i = 0; i < exons.length; i++ ) {
        var exon = exons[i];
        if ( exon.relative_start <= position && exon.relative_end >= position) {
            return exon;
        }
    }
    return null;
}
function find_exon_minus(exons, position) {
    for ( var i = 0; i < exons.length; i++ ) {
        var exon = exons[i];
        if ( exon.relative_end <= position && exon.relative_start >= position) {
            return exon;
        }
    }
    return null;
}
function plus_compare(a,b) {
    if (a.start < b.start)
        return -1;
    if (a.start > b.start)
        return 1;
    return 0;
}
function minus_compare(a,b) {
    if (a.end > b.end)
        return -1;
    if (a.end > b.end)
        return 1;
    return 0;
}
