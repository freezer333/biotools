

//percent difference is the difference between both values divided by the average value
function percentDifference(valueA, valueB){
  if (valueA == 0 && valueB == 0){
    return 0;
  }
  var dif = Math.abs(valueA - valueB);
  var avg = (valueA + valueB) / 2

  var r =  1 - (dif/avg);
  return r;
}

function overlapScore(min, max, percentOverlap) {
  return Math.min(1, (percentOverlap)/(max - min));
}

function length(start, end){
  var r = end - start + 1;
  return r;
}

exports._length = length;

function compute_overlap(s1, s2, e1, e2){
  if (s1<=s2 && e1>=e2 && e1>s2) {
    return length(s2,e2);}
  if (s1<=s2 && e1<e2 && e1>s2) {
    return length(s2,e1);}
  if (s1>s2 && e1>=e2 && e2>s1) {
    return length(s1,e2);}
  if (s1>s2 && e1<e2) {
    return length(s1,e1);}
  if (e2<=s1 || s2>=e1) {return 0;}
  return -1;
}

function build_padding_boundries(p, c, p_seq_length, c_seq_length) {
  padding = p.length_gapped <= c.length_gapped
            ? p.length_gapped / 2
            : c.length_gapped / 2
  padded = {
      padding : padding,
      p : {
        start : p.start_gapped - padding,
        end : p.start_gapped + p.length_gapped + padding - 1
      },
      c : {
        start : c.start_gapped - padding,
        end : c.start_gapped + c.length_gapped + padding - 1
      }
  }
  if ( padded.p.start < 0 ) padded.p.start = 0;
  if ( padded.c.start < 0 ) padded.c.start = 0;
  if ( padded.p.end > p_seq_length) padded.p.end = p_seq_length;
  if ( padded.c.end > c_seq_length) padded.c.end = c_seq_length;
  return padded;
}


function calculateOverlapComponent (p, c, p_seq_length, c_seq_length) {
  var padded = build_padding_boundries(p, c, p_seq_length, c_seq_length);
  var overlap = compute_overlap(padded.p.start, padded.c.start, padded.p.end, padded.c.end)
  var region = length(Math.min(padded.p.start, padded.c.start),
                      Math.max(padded.p.end, padded.c.end));

  var overlap_percentage= overlap / region;
  return Math.min(1, overlap_percentage/.85);
  if ( overlap_percentage > 0.85 ) return 1
  return overlapScore(0, .85, overlap_percentage);

}

exports.overlapScore = calculateOverlapComponent;

exports.tetradScore = function (p, c) {
  var pdiff = percentDifference(p.tetrads, c.tetrads);
  if ( pdiff< 0.5 ) return 0;
  return pdiff;
}

exports.lengthScore = function (p, c) {
  var r = percentDifference(p.length, c.length)
  if ( r < .6 ) return 0;
  return r;
}

exports.loopScore = function(p, c) {
  var d1 = percentDifference(p.y1, c.y1)
  var d2 = percentDifference(p.y2, c.y2)
  var d3 = percentDifference(p.y3, c.y3)
  var avg = (d1+d2+d3)/3;
  return avg;
}

exports.mix_conservation = function(parts) {
  return parts.overlap * 0.65 +
         parts.tetrads * 0.20 +
         parts.loop * 0.10 +
         parts.len * 0.05;
}

exports.conservationScore = function (p, c, p_length, c_length) {
  var conservation = {
    overlap : exports.overlapScore(p, c, p_length, c_length),
    tetrads : exports.tetradScore(p, c),
    loop : exports.loopScore(p, c),
    len : exports.lengthScore(p, c)
  }
  conservation.overall = exports.mix_conservation(conservation);
  if ( conservation.overall < 0.5) return undefined;
  return conservation;
}
/*----------------------------------------------
Input:  principal and comparison- arrays of motifs.
        the arrays contain motiffs with the gapped
        indexes already in them.

      [  This algorithm should probably moved to C++...  ]

        Each g4 in the arrays are now considered "families".

        For each family, pair with each family in the comparison.
          For each family pair -
            For each G4 (including overlaps) in principal, compare with every comparison (include overlaps)
              find the best fit conservation pair (highest score).
                Assign a best_conserved_overall record with the following data:
                  conservation score
                  principal motif
                  comparison accession, organism, taxon
                  comparison motif

            Compare the representative in principal with each compariron (include overlaps)
              find the best fit conservation pair (highest score)
                Assign a best_conserved_rep record
                  conservation score
                  comparison accession, organism, taxon
                  comparison motif
*/
exports.compute_conservation = function(p, c) {
  p.g4s.forEach(function (g4) {
      // compare with all comparison families
      g4.best_conserved_rep = getBestComparison(g4, p, c);
      var overall_best = g4.best_conserved_rep;
      if (overall_best) {
        // we won't do this if the primary didn't match with anything - too weak.
        // now check if any of the overlaps in principal are better
        g4.overlaps.forEach(function(overlap) {
          var cons = getBestComparison(overlap, p, c);
          //console.log(cons.score.overall + " < " + overall_best.score.overall);
          if ( cons && cons.score.overall > overall_best.score.overall) {
            overall_best = cons;
            console.log("YES");
          }
        });
      }
      g4.best_conserved_overall = overall_best;
  });



}

function getBestComparison(g4, p, c) {
  var best = undefined;
  c.g4s.forEach(function(comparison_g4) {
    var cons = process(g4, comparison_g4, p.sequence.length, c.sequence.length, c);
    if ( cons && (!best || best.score.overall < cons.score.overall)) {
        best = cons;
    }
  });
  return best;
}

function process(p_g4, c_g4, p_len, c_len,comparison_mrna_data ) {
  // we need to find the best match, and associate it with the p_g4
  var cscore = exports.conservationScore(p_g4, c_g4, p_len, c_len);
  c_g4.overlaps.forEach(function (cover) {
    var s = exports.conservationScore(p_g4, cover, p_len, c_len);
    if ( s && ( !cscore || cscore.overall < s.overall)) {
      cscore = s;
    }
  })


  if ( cscore ) {
    var comp_mrna = JSON.parse(JSON.stringify(comparison_mrna_data));
    delete comp_mrna.sequence;
    delete comp_mrna.g4s;
    var comp_g4 = JSON.parse(JSON.stringify(c_g4));
    delete comp_g4.overlaps;
      return {
        comparison_mrna : comp_mrna,
        comparison_g4 : comp_g4,
        score : cscore
      }
  }
  else {
    return undefined;
  }
}




/*----------------------------------------------
Input:  gapped_sequence:  the source sequence which
        the given motifs were derived from, with gaps
        injected due to an alignment

        g4s:  array of qgrs motifs.  The positions of
        start, end, tetrad1, tetrad2, tetrad3, tetrad4 are
        to be cloned and transformed to start_gapped, end_gapped, etc.

        The mapping is applied to all overlapping g4's as well
-----------------------------------------------*/

exports.map_gaps = function (gapped_sequence, g4s) {
  gap = [];
  gaps = 0;
  index = 0;
  for (var i = 0, len = gapped_sequence.length; i < len; i++) {
    c = gapped_sequence[i];
    if ( c == '-') gaps++;
    else {
      gap[index++] = gaps;
    }
  }

  for ( g4 in g4s ) {
    apply_gap(g4s[g4], gap);
    for ( o in g4s[g4].overlaps) {
      apply_gap(g4s[g4].overlaps[o], gap);
    }
  }
}

function apply_gap(g4, gapmap){
  g4.start_gapped = map(g4.start, gapmap);
  g4.tetrad1_gapped = map(g4.tetrad1, gapmap);
  g4.tetrad2_gapped = map(g4.tetrad2, gapmap);
  g4.tetrad3_gapped = map(g4.tetrad3, gapmap);
  g4.tetrad4_gapped = map(g4.tetrad4, gapmap);
  g4.length_gapped = length(g4.start_gapped, map(g4.start + g4.length-1, gapmap));
}

function map(nt, gapmap) {
  return nt + gapmap[nt];
}
