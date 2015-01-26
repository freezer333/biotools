function make_tetrad_html(t) {
  return "<span class='tetrad'>" + t + "</span>"
}
function make_loop_html(y) {
  return "<span class='loop'>" + y + "</span>"
}
function make_overlap_html(o) {
  return "<span class='overlap'>" + o + "</span>"
}
renderg4 = function(g4) {
  var tetrad = Array(g4.tetrads+1).join("G");
  var yb = g4.tetrads;
  var y1 = g4.sequence.substring(yb, yb + g4.y1);
  yb = yb + g4.y1 + g4.tetrads;
  var y2 = g4.sequence.substring(yb, yb + g4.y2);
  y3 = yb + g4.y2 + g4.tetrads;
  var y3 = g4.sequence.substring(yb, yb + g4.y3);

  var th = make_tetrad_html(tetrad);
  y1 = make_loop_html(y1);
  y2 = make_loop_html(y2);
  y3 = make_loop_html(y3);
  return th + y1 + th + y2 + th + y3 + th;
}

render_overlapped_g4 = function(parent, overlap) {
  var core = renderg4(overlap);
  var prefix = make_overlap_html(Array(overlap.start - parent.range.start + 1).join("-"))
  var end = overlap.start + overlap.length;
  var suffix = make_overlap_html(Array(parent.range.end - end).join("-"))
  return prefix + core + suffix;
}
