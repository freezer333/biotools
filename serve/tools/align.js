
var fs = require('fs');
var temp = require('temp').track();
var open_jobs = 0;
var async = require('async');
var path = require('path')


exports.run = function (a, b, opts, oncomplete, onerror) {
  opts.gapopen = opts.gapopen || 10;
  opts.gapextend = opts.gapextend || 0.5;
  perform_alignment(a, b, opts.gapopen, opts.gapextend, oncomplete, onerror);
}


var perform_alignment = function(a, b, gapopen, gapextend, oncomplete, onerror) {
  var a_filename, b_filename, out_filename;

  temp.mkdir('alignment', function (err, dirPath) {
    a_filename = path.join(dirPath, 'seqa.fasta');
    b_filename = path.join(dirPath, 'seqb.fasta');
    out_filename = path.join(dirPath, 'out.needle');

    async.parallel([
      function(callback) {
        fs.writeFile(a_filename, '> sequence a\n'+a, function(err) {
          if (err ) onerror(err)
          callback('a');
        })
      },
      function(callback) {
        fs.writeFile(b_filename, '> sequence b\n'+b, function(err) {
          if (err ) onerror(err)
          callback('b');
        })
      }
    ], function(err, results) {

        open_jobs++;


        var spawn = require('child_process').spawn,
            needle  = spawn('needle',
                ['-asequence', a_filename, '-bsequence', b_filename, '-outfile', out_filename, '-gapopen', gapopen, '-gapextend', gapextend, '-aformat', 'fasta']);

        needle.on('error', function (err) {
          console.log("Alignment failed - " + JSON.stringify(err));
          onerror(err);
        })

        needle.on('close', function (code, signal) {
          var seqA = "";
          var seqB = "";
          var text = fs.readFileSync(out_filename,'utf8')
          var firstMark = text.indexOf(">");
          var secondMark = text.indexOf(">", firstMark+1);

          var firstSeq = text.indexOf("\n", firstMark+1);
          var secondSeq = text.indexOf("\n", secondMark + 1);

          var seqA = text.substring(firstSeq+1, secondMark);
          var seqB = text.substring(secondSeq+1);

          seqA = seqA.replace(/(\r\n|\n|\r)/gm,"");
          seqB = seqB.replace(/(\r\n|\n|\r)/gm,"");

          open_jobs--;
          if ( open_jobs < 1 ) {
            temp.cleanup(function(err, stats) {
              //console.log(stats)
            });
          }
          oncomplete({a : seqA, b : seqB});
        });
    });

  });




}
