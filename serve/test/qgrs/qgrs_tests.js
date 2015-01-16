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

describe('Test the basics', function() {
    it ('should have the right length', function(done) {
      conserve._length(90, 129).should.be.exactly(40);
      done();
    }
  )
});


describe ('Test qgrs gap mapping', function() {
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
        assert(motifs[0].length_gapped == 20);
        done();
      })
    });
});


var principal_gapped2 = "GGGTTGGGA-----ACGGGTTGGG";
var principal2 = {
  start : 0, tetrad1 : 0, tetrad2 : 5, tetrad3: 11, tetrad4 : 16,
  length : 19, tetrads : 3,
  y1 : 2, y2 : 3, y3 : 2
}

var comparison_gapped2 = "GGATTGGAAATAAGACGGGTTGGG";
var comparison2 = {
  start : 0, tetrad1 : 0, tetrad2 : 5, tetrad3: 17, tetrad4 : 22,
  length : 24, tetrads : 2,
  y1 : 3, y2 : 10, y3 : 3
}



//GAGTT-GGGACGAGTCGGGTTGGGCC-GGG
var principal_gapped3 = "0123456789GAGTT-GGGACGAGTCGGGTTGGGCC-GGG0123456789";
var principal3 = {
  start : 15, tetrad1 : 15, tetrad2 : 25, tetrad3: 30, tetrad4 : 35,
  length : 23, tetrads : 3,
  y1 : 7, y2 : 2, y3 : 2
}
//GGGTTAGGGACGGGTCGGGTTGCGCCTGGA
var comparison_gapped3 = "0123456789GGGTTAGGGACGGGTCGGGTTGCGCCTGGA0123456789";
var comparison3 = {
  start : 10, tetrad1 : 10, tetrad2 : 16, tetrad3: 21, tetrad4 : 26,
  length : 19, tetrads : 3,
  y1 : 3, y2 : 2, y3 : 2
}



function map_gaps(done) {
  conserve.map_gaps(principal_gapped2, [principal2])
  conserve.map_gaps(comparison_gapped2, [comparison2])
  conserve.map_gaps(principal_gapped3, [principal3])
  conserve.map_gaps(comparison_gapped3, [comparison3])
  done()
}



describe('Test qgrs conservation score calculation', function() {
  before(map_gaps)
  describe ('Test tetrad score', function() {
    it ('should be 1 if the tetrad numbers match', function(done) {
      assert(conserve.tetradScore(principal3, comparison3) == 1);
      done();
    });
    it ('should be 1 - 2/2.5 if the tetrad numbers are 3 and 2', function(done) {
      var tetradScore = conserve.tetradScore(principal2, comparison2);
      tetradScore.should.be.approximately(1 - 1/2.5, 0.005);
      done();
    });
    it ('should be 1-  1/3.5 if the tetrad numbers are 3 and 4', function(done) {
      var tetradScore = conserve.tetradScore({tetrads:3}, {tetrads:4});
      tetradScore.should.be.approximately(1 - 1/3.5, 0.005);
      done();
    });
    it ('should be 0 if the tetrad numbers are 2 and 4', function(done) {
      var tetradScore = conserve.tetradScore({tetrads:2}, {tetrads:4});
      tetradScore.should.be.approximately(0, 0.005);
      done();
    });
  })
  describe ('Test overlap score', function() {
    it ('should be 1 if start/ends line up', function(done) {
      var overlapScore = conserve.overlapScore(principal2, comparison2, 100, 100);
      overlapScore.should.be.approximately(1, 0.005);
      done();
    });
    it ('should be .77 for moderately mis-aligned', function(done) {
      var overlapScore = conserve.overlapScore(principal3, comparison3, 100, 100);
      overlapScore.should.be.approximately(.77, 0.005);
      done();
    });
    it ('should be (1/7)/0.85 for significantly', function(done) {
      var a = {
        start : 100,
        start_gapped : 100,
        length_gapped : 20
      }
      var b = {
        start : 130,
        start_gapped : 130,
        length_gapped : 20
      }
      // only 10 nt overlapping (when padding included)
      // region including padding is 10 bases
      var overlapScore = conserve.overlapScore(a, b, 1000, 1000);
      overlapScore.should.be.approximately((1.0/7)/0.85, 0.005);
      done();
    });
    it ('should be 1 for slightly misaligned', function(done) {
      var a = {
        start : 100,
        start_gapped : 100,
        length_gapped : 20
      }
      var b = {
        start : 102,
        start_gapped : 102,
        length_gapped : 20
      }
      // only 10 nt overlapping (when padding included)
      // region including padding is 10 bases
      var overlapScore = conserve.overlapScore(a, b, 1000, 1000);
      overlapScore.should.be.approximately(1, 0.005);
      done();
    });
  });
  describe ('Test overlap score', function() {
    it ('should be .80 for lengths of 23 and 19', function(done) {
      var overlapScore = conserve.lengthScore({length:23}, {length:19});
      overlapScore.should.be.approximately(.8095, 0.005);
      done();
    });
    it ('should be 0 for lengths of 50 and 80 because they are less than 60% similar', function(done) {
      var overlapScore = conserve.lengthScore({length:50}, {length:80});
      overlapScore.should.be.approximately(0, 0.005);
      done();
    });
  })
  describe ('Test loop score', function() {
    it ('should be .756 for given loop lengths', function(done) {
      var loop = conserve.loopScore(
        {y1: 4, y2: 3, y3: 8},
        {y1: 5, y2: 4, y3: 10}
      );
      loop.should.be.approximately(.756, 0.005);
      done();
    });


  })
  describe ('Test mixing', function() {
    it ('should be .865 for given parts', function(done) {
      var parts = {
        overlap : 0.9, tetrads : 0.8, loop : 0.85, len : 0.7
      }
      var overall = conserve.mix_conservation(parts);
      overall.should.be.approximately(.865, 0.005);
      done();
    });
  })
});
