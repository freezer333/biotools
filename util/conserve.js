

//percent difference is the difference between both lengths divided by the length of the maximum strand
function percentDifference(valueA, valueB){
  if (valueA == 0 && valueB == 0){
    return 0;
  }
  return ( (Math.abs(valueA - valueB))/Math.max(valueA, valueB));
}

//assigns a score from 0-1 by taking percent difference into account and the highest percentage desired to be incorporated
function score(min, max, percentDifference){
  return Math.max(0,(1- (percentDifference)/(max - min)));
}

function length(start, end){
  return end - start + 1;
}


exports.cscore = function (p, c) {



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
    for ( o in g4.overlaps) {
      apply_gap(g4.overlaps[o]);
    }
  }
}

function apply_gap(g4, gapmap){
  g4.start_gapped = map(g4.start, gapmap);
  g4.tetrad1_gapped = map(g4.tetrad1, gapmap);
  g4.tetrad2_gapped = map(g4.tetrad2, gapmap);
  g4.tetrad3_gapped = map(g4.tetrad3, gapmap);
  g4.tetrad4_gapped = map(g4.tetrad4, gapmap);
  g4.length_gapped = length(g4.start_gapped, map(g4.start + g4.length, gapmap));
}

function map(nt, gapmap) {
  return nt + gapmap[nt];
}