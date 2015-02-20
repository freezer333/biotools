
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
            })
        }

    }
}


function resolve_mrna_to_chromosome(mrna, position) {
    var loc = {
                chromosome:mrna.chrom, 
                chromosome_position : 'unknown',
                mrna_accession: mrna.accession, 
                mrna_position: parseInt(position)
            }
    
    var length = 0;

    if ( mrna.orientation == '+') {
        mrna.exons.sort(plus_compare);
        for (var i = 0; i < mrna.exons.length; i++ ) {
            var exon = mrna.exons[i];
            exon.relative_start = length;
            exon.relative_end = length + (exon.end-exon.start);
            length += (exon.end-exon.start);
        }
        exon  = find_exon_plus(mrna.exons, position);
        loc.chromosome_position = (position - exon.relative_start) + exon.start;
    }
    else {
        mrna.exons.sort(minus_compare);
        for (var i = 0; i < mrna.exons.length; i++ ) {
            var exon = mrna.exons[i];
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
