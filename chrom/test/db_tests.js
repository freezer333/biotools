var mongoose = exports.mongoose = require ("mongoose");
var db = exports.schemas = require("../db");
var url = "mongodb://localhost:27017/chrome";
var should = require('should');
var assert = require('assert');




describe ('Test chromosome sequence queries ', function() {
    before(function (done) {
        mongoose.connect(url, { auto_reconnect: true }, function (err, res) {
            if (err) {
                console.log ('ERROR connecting to: ' + url + '. ' + err);
            } else {
                db.init(mongoose);
                done();
              }
            });
    });
    describe('Human chromosome 9 - CM000671.2', function(){
      this.timeout(10000);
      it('should have at least 1 record corresponding to this chromosome', function(done){
        db.seq.count({accession : 'CM000671.2'}, function (err, record) {
            assert(record > 0, "No record was returned");
            done();
        })
      })


      it('Nucleotides 0 - 10 should be NNNNNNNNNN', function(done){
        db.getSequence('CM000671.2', 0, 10, function(err, sequence) {
            assert(sequence == 'NNNNNNNNNN');
            done();
        });
      })

      it('Nucleotides 10010 - 10020 should be CCTAACCCTA - single page test', function(done){
        db.getSequence('CM000671.2', 10010, 10020, function(err, sequence) {
            assert(sequence == 'CCTAACCCTA');
            done();
        });
      })

      it('Nucleotides 10010 - 10020 should be GGTCCTCCAGCACAAGCTGTCTTAATTGACCCTAGTTCCCAGGGCAGCCTCGTTCTGCCTTGGGTGCTGA - 2 page test, small sequence', function(done){
        db.getSequence('CM000671.2', 19950, 20020, function(err, sequence) {
            assert(sequence == 'GGTCCTCCAGCACAAGCTGTCTTAATTGACCCTAGTTCCCAGGGCAGCCTCGTTCTGCCTTGGGTGCTGA');
            done();
        });
      })
      /*
      it('Nucleotides 10010 - 10020 should be CCTAACCCTA - 3 page test, large sequence sequence', function(done){
        db.getSequence('CM000671.2', 10010, 10020, function(err, sequence) {
            assert(sequence == 'CCTAACCCTA');
            done();
        });
      })*/


    });
});