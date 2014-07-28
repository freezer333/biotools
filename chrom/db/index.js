exports.init = function init(mongoose) {
    createSeqSchema(mongoose);
};

var seq;
var page_size = 10000;
var zlib = require('zlib');
var async = require('async');


function compare_ranges(a,b) {
  if (a.start < b.start)
     return -1;
  if (a.start > b.start)
    return 1;
  return 0;
}

exports.getSequence = function(accession, start, end, final_callback) {
    var ranges = [];
    var processed_ranges = [];
    do {
        var start_page = page_num (start);
        var end_page = page_num (end);
        if ( start_page == end_page ) {
            ranges.push ({ start : start, end : end} )
        }
        else {
            var next_start = (start_page+1)*page_size
            ranges.push({start : start, end : next_start});
            start = next_start;
        }
    } while ( start_page != end_page)

    async.each(ranges, 
        function(range, callback) {
            getSequenceFromPage(accession, range.start, range.end, function( err, seq) {
                processed_ranges.push ( {start : range.start, end : range.end, seq : seq});
                callback();
            });
        }, function () {
            processed_ranges.sort(compare_ranges);
            var retval = "";
            for ( i = 0; i < processed_ranges.length; i++ ) {
                if ( processed_ranges[i].seq ) 
                    retval += processed_ranges[i].seq;
                else {
                    callback("Range was invalid", null);
                }
            }
            final_callback(null, retval);
        }
    );
}

function getSequenceFromPage(accession, start, end, callback) {
    var page_start = page_num(start) * page_size;
    seq.findOne({accession:accession, start : page_start}, function(err, page) {
        if ( err ) {
            console.log(err);
            callback(err);
        }
        zlib.inflate(page.seq, function(err, result) {
            if ( err ) {
                console.log(err);
                callback(err);
            }
            var retval = result.toString('ascii');
            var mod_start = start - page_start;
            var mod_end = end - page_start;
            retval = retval.substring(mod_start, mod_end);
            console.log(retval);
            callback(null, retval);
        })
    });
}

function page_num(position) {
    var page = Math.floor(position/page_size);
    return page;
}

function createSeqSchema(mongoose) {

    var schem = new mongoose.Schema({
        accession : String, 
            start: Number,
            end: Number,
            seq: Buffer,
            description : String
        }, {collection:'seq'});



    exports.seq = mongoose.model('Seq', schem);
    seq = exports.seq;
}


