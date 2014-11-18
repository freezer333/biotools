var mongoose = exports.mongoose = require ("mongoose");
var db = exports.schemas = require("../db");
var url = "mongodb://localhost:27017/chrome";
var should = require('should');
var assert = require('assert');
var fs = require('fs');


var seq_test_3_expected = fs.readFileSync('test/seq_test_3.txt', 'utf-8');
seq_test_3_expected = seq_test_3_expected.replace(/(\r\n|\n|\r)/gm,"");



describe ('Test chromosome sequence queries ', function() {
    before(function (done) {
      this.timeout(10000);
      setTimeout(function () {
          done();
      }, 3000);

    });
    describe('Human chromosome 9 - CM000671.2', function(){
      this.timeout(10000);
      it('should have at least 1 record corresponding to this chromosome', function(done){
        db.seq.count({accession : 'NC_000009'}, function (err, record) {
            assert(record > 0, "No record was returned");
            done();
        })
      })


      it('Nucleotides 0 - 10 should be NNNNNNNNNN', function(done){
        db.getSequence('NC_000009', 0, 10, function(err, result) {
            assert(result.seq == 'NNNNNNNNNN');
            done();
        });
      })

      it('Nucleotides 10010 - 10020 should be CCTAACCCTA - single page test', function(done){
        db.getSequence('NC_000009', 10010, 10020, function(err, result) {
            assert(result.seq == 'CCTAACCCTA');
            done();
        });
      })

      it('Nucleotides 10010 - 10020 should be GGTCCTCCAGCACAAGCTGTCTTAATTGACCCTAGTTCCCAGGGCAGCCTCGTTCTGCCTTGGGTGCTGA - 2 page test, small sequence', function(done){
        db.getSequence('NC_000009', 19950, 20020, function(err, result) {
            assert(result.seq == 'GGTCCTCCAGCACAAGCTGTCTTAATTGACCCTAGTTCCCAGGGCAGCCTCGTTCTGCCTTGGGTGCTGA');
            done();
        });
      })

      it('Nucleotides 19950 - 30030 should match test data - 3 page test, large sequence sequence', function(done){
        db.getSequence('NC_000009', 19950, 30030, function(err, result) {
            assert(result.seq == seq_test_3_expected);
            done();
        });
      })


      it('Nucleotides 138394690 - 138394790 should be just 27 Ns - since sequence runs out', function(done){
        db.getSequence('NC_000009', 138394690, 138394790, function(err, result) {
            assert(result.seq == "NNNNNNNNNNNNNNNNNNNNNNNNNNN");
            done();
        });
      })


      it('Nucleotides -10 - 0 should throw error - negative range', function(done){
        db.getSequence('NC_000009', -10, 0, function(err, sequence) {
            assert(err);
            done();
        });
      })

      it('Nucleotides 10 - 5 should throw error - negative range', function(done){
        db.getSequence('CNC_000009', 10, 5, function(err, sequence) {
            assert(err);
            done();
        });
      })


      it('Nucleotides 0 - 0 should return nothing', function(done){
        db.getSequence('NC_000009', 0, 0, function(err, result) {
            assert(result.seq.length == 0);
            done();
        });
      })




    });
});
