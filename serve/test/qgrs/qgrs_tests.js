var should = require('should');
var assert = require('assert');
var conserve = require('../../utils/conserve.js')

var ungapped = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
var gapped = "-AA---A--AAA-----AAAA----AAAA-----AAAA--AAAAAA--AAAAAA--A"

var motifs  = [
  {
    start : 0, tetrad1 : 2, tetrad2 : 4, tetrad3: 5, tetrad4 : 7, length : 10,
      overlaps : [
                  {start : 0, tetrad1 : 2, tetrad2 : 4, tetrad3: 5, tetrad4 : 7, length : 10},
                  {start : 4, tetrad1 : 7, tetrad2 : 9, tetrad3: 10, tetrad4 : 13, length : 10}
                 ]
  },
  {
    start : 4, tetrad1 : 7, tetrad2 : 9, tetrad3: 10, tetrad4 : 13, length : 10
  },
  {
    start : 10, tetrad1 :13, tetrad2 : 15, tetrad3: 16, tetrad4 : 18, length : 10
  }
]

describe ('Test qgrs conservation', function() {
    describe('None-gapped motifs', function(){
      it('should not change motifs if there are no gaps', function(done){
        conserve.map_gaps(ungapped, motifs);
        assert(motifs[0].start_gapped == 0);
        assert(motifs[2].tetrad3 == 16);
        done();
      })
    });

    describe('Gapped motifs', function(){
      it('should modify starts', function(done){
        conserve.map_gaps(gapped, motifs);
        assert(motifs[0].start_gapped == 1);
        assert(motifs[1].start_gapped == 10);
        assert(motifs[2].start_gapped == 25);
        done();
      })
      it('should modify starts of overlaps', function(done){
        conserve.map_gaps(gapped, motifs);
        assert(motifs[0].overlaps[0].start_gapped == 1);
        assert(motifs[0].overlaps[1].start_gapped == 10);
        done();
      })

      it('should modify length', function(done){
        conserve.map_gaps(gapped, motifs);
        assert(motifs[0].length_gapped == 25);
        done();
      })
    });



});
