
var db = exports.schemas = require("../../db");
var resolver = require('../../utils/locus')(db);
var should = require('should');
var assert = require('assert');



var test_mrna_pos = {
  "chrom" : "NC_000067",
  "gene_id" : "PlusOrientation",
  "accession" : "PlusOrientation.1",
  "organism" : "Python",
  "build" : "38",
  "orientation" : "+",
  "exons" : [
    {
      "end" : 18,
      "start" : 12
    },
    {
      "end" : 28,
      "start" : 23
    },
    {
      "end" : 37,
      "start" : 32
    }
  ],
  "end" : 37,
  "start" : 12
}

var test_mrna_neg= {
  "chrom" : "NC_000067",
  "gene_id" : "MinusOrientation",
  "accession" : "MinusOrientation.1",
  "organism" : "Python",
  "build" : "38",
  "orientation" : "-",
  "exons" : [
    {
      "end" : 18,
      "start" : 12
    },
    {
      "end" : 28,
      "start" : 23
    },
    {
      "end" : 37,
      "start" : 32
    }
  ],
  "end" : 37,
  "start" : 12
}

var test_gene_pos = {
  "chrom" : "NC_000067",
  "gene_id" : "PlusOrientation",
  "gene_name" : "PlusOrientation",
  "build" : "38",
  "orientation" : "+",
  "organism" : "Python",
  "end" : 37,
  "start" : 12
}
var test_gene_neg = {
  "chrom" : "NC_000067",
  "gene_id" : "MinusOrientation",
  "gene_name" : "MinusOrientation",
  "build" : "38",
  "orientation" : "-",
  "organism" : "Python",
  "end" : 37,
  "start" : 12
}


describe ('Test chromosome to gene position resolution', function() {
    before(function (done) {
      this.timeout(10000);
      setTimeout(function () {
          done();
      }, 1000);
    });
    describe('Valid known chromosome', function() {
        it ('Returns genes in known chromosome', function (done) {
            resolver.chromosome_to_gene('NC_000067', 195037547, function (results){
                results.length.should.be.greaterThan(0);
                done();
            })
        })
    });

    // ---- Positive Orientation Tests

    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into gene with positive orientation', function (done) {
            var gene_locus = resolver.chromosome_to_gene_locus(test_gene_pos, 24);
            gene_locus.should.be.exactly(13)
            done();
        })
    });
    
    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into first exon within mrna with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 14);
            mrna_locus.should.be.exactly(3)
            done();
        })
    });

    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into second exon within mrna with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 24);
            mrna_locus.should.be.exactly(9)
            done();
        })
    });

    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into third exon within mrna with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 34);
            mrna_locus.should.be.exactly(16)
            done();
        })
    });

    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into first position within mrna with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 12);
            mrna_locus.should.be.exactly(1)
            done();
        })
    });

    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into last position within mrna with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 37);
            mrna_locus.should.be.exactly(19)
            done();
        })
    });
    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into first position of second entron within mrna with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 23);
            mrna_locus.should.be.exactly(8)
            done();
        })
    });
    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into last position of second entron within mrna with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 28);
            mrna_locus.should.be.exactly(13)
            done();
        })
    });
    describe('Positive Orientation Chromosome -> Gene/mRNA', function() {
        it ('Reports -1 if in mrna intron with positive orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_pos, 30);
            mrna_locus.should.be.exactly(-1)
            done();
        })
    });


    // ---- Negative Orientation Tests
    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into gene with negative orientation', function (done) {
            var gene_locus = resolver.chromosome_to_gene_locus(test_gene_neg, 24);
            gene_locus.should.be.exactly(14)
            done();
        })
    });
     describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into gene with negative orientation', function (done) {
            var gene_locus = resolver.chromosome_to_gene_locus(test_gene_neg, 12);
            gene_locus.should.be.exactly(26)
            done();
        })
    });
    
    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into first exon within mrna with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 14);
            mrna_locus.should.be.exactly(17)
            done();
        })
    });
    
    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into second exon within mrna with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 24);
            mrna_locus.should.be.exactly(11)
            done();
        })
    });
    
    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into third exon within mrna with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 34);
            mrna_locus.should.be.exactly(4)
            done();
        })
    });

    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into first position within mrna with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 12);
            mrna_locus.should.be.exactly(19)
            done();
        })
    });

    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into last position within mrna with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 37);
            mrna_locus.should.be.exactly(1)
            done();
        })
    });
    
    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into first position of second entron within mrna with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 23);
            mrna_locus.should.be.exactly(12)
            done();
        })
    });
   
    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Maps into last position of second entron within mrna with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 28);
            mrna_locus.should.be.exactly(7)
            done();
        })
    });
    describe('Negative Orientation Chromosome -> Gene/mRNA', function() {
        it ('Reports -1 if in mrna intron with negative orientation', function (done) {
            var mrna_locus = resolver.chromosome_to_mrna_locus(test_mrna_neg, 30);
            mrna_locus.should.be.exactly(-1)
            done();
        })
    });



});
/*
describe ('Test chromosome to mrna position resolution', function () {
    before(function (done) {
      this.timeout(10000);
      setTimeout(function () {
          done();
      }, 1000);
    });

    describe('Resolve gene with multiple products', function(){
      
      ///  Gene 23133 has 4 mrna products.
      ///  Gene 23126 has 5 mrna products.

      // Use these as test cases
    });

});
*/
describe ('Test mrna position to chromosome position resolution ', function() {
    before(function (done) {
      this.timeout(10000);
      setTimeout(function () {
          done();
      }, 1000);
    });
    describe('Invalid mrna', function(){
      it('should have no result', function(done){
        resolver.mrna_to_chromosome('XYZ', 5, function (result){
            assert(result == undefined, "Record should not be returned for invalid mrna accession");
            done();
        })
      })
    });

    describe('Valid mRNA', function() {
        it ('Returns chromosome start position for position 0 of known mrna (orientation is -)', function (done) {
            resolver.mrna_to_chromosome('NM_001276352.1', 0, function (result){
                result.chromosome_position.should.be.exactly(67134971);
                done();
            })
        })
        it ('Returns chromosome start position for position 0 of known mrna (orientation is +)', function (done) {
            resolver.mrna_to_chromosome('NM_172353.2', 0, function (result){
                result.chromosome_position.should.be.exactly(207752038);
                done();
            })
        })

        it ('Returns chromosome position position for first exon values of known mrna (orientation is -)', function (done) {
            resolver.mrna_to_chromosome('NM_001276352.1', 5, function (result){
                result.chromosome_position.should.be.exactly(67134966);
                done();
            })
        })
        it ('Returns chromosome position position for first exon values of known mrna (orientation is +)', function (done) {
            resolver.mrna_to_chromosome('NM_172353.2', 5, function (result){
                result.chromosome_position.should.be.exactly(207752043);
                done();
            })
        })

        it ('Returns chromosome position position for arbitrary exon values of known mrna (orientation is -)', function (done) {
            resolver.mrna_to_chromosome('NM_001276352.1', 46, function (result){
                result.chromosome_position.should.be.exactly(67131222);
                done();
            })
        })
        it ('Returns chromosome position position for arbitrary exon values of known mrna (orientation is +)', function (done) {
            resolver.mrna_to_chromosome('NM_172353.2', 464, function (result){
                result.chromosome_position.should.be.exactly(207757545 );
                done();
            })
        })
    })
});