
var db = exports.schemas = require("../../db");
var resolver = require('../../utils/locus')(db);
var should = require('should');
var assert = require('assert');

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