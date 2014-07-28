var should = require('chai').should();
var vacant = require('../index');

describe ('vacant', function() {
    
    it ('returns true for null', function() {
        vacant(null).should.equal(true);
    });

    it ('returns true for undefined', function() {
        vacant(undefined).should.equal(true);
    });

    it ('returns true for {}', function() {
        vacant({}).should.equal(true);
    });

    it ('returns true for {test:null}', function() {
        vacant({test:null}).should.equal(true);
    });
    it ('returns true for {test:undefined}', function() {
        vacant({test:undefined}).should.equal(true);
    });
    it ('returns true for {test:{}}', function() {
        vacant({test:{}}).should.equal(true);
    });

    it ('returns true for {test:0}', function() {
        vacant({test:0}).should.equal(true);
    });

    it ('returns true for {test: { test : null }}', function() {
        vacant({test:{ test : null }}).should.equal(true);
    });

    it ('returns true for {test: { test : undefined }}', function() {
        vacant({test:{ test : undefined }}).should.equal(true);
    });

    it ('returns true for {test: { test : 0 }}', function() {
        vacant({test:{ test : 0 }}).should.equal(true);
    });

    it ('returns true for {test: [] }', function() {
        vacant({test:[]}).should.equal(true);
    });

    it ('returns true for {test: [0] }', function() {
        vacant({test:[0]}).should.equal(true);
    });

    it ('returns true for {test: [" "] }', function() {
        vacant({test:[' ']}).should.equal(true);
    });

    it ('returns true for {test: [0, " ", null, undefined] }', function() {
        vacant({test:[0, " ", null, undefined]}).should.equal(true);
    });
    it ('returns true for {test: [0, " ", null, undefined, { test : 0}] }', function() {
        vacant({test:[0, " ", null, undefined]}).should.equal(true);
    });

    it ('returns true for {test: [0, "\t\n  ", null, undefined, { test : 0}] }', function() {
        vacant({test:[0, " ", null, undefined]}).should.equal(true);
    });



    // ---- false tests

    it ('returns true for "test"', function() {
        vacant("test").should.equal(false);
    });

    it ('returns true for 1', function() {
        vacant(1).should.equal(false);
    });

    it ('returns true for {test: 1}', function() {
        vacant({test: 1}).should.equal(false);
    });

    it ('returns true for {test:"test"}', function() {
        vacant({test:"test"}).should.equal(false);
    });
    
    it ('returns true for {test:{test:1}}', function() {
        vacant({test:{test:1}}).should.equal(false);
    });

    it ('returns true for {test: [1] }', function() {
        vacant({test:[1]}).should.equal(false);
    });

    it ('returns true for {test: [0, 1] }', function() {
        vacant({test:[0, 1]}).should.equal(false);
    });

    it ('returns true for {test: [" ", "test"] }', function() {
        vacant({test:[" ", "test"]}).should.equal(false);
    });

    it ('returns true for {test: [0, " ", null, undefined, { test : 5}] }', function() {
        vacant({test:[0, " ", null, undefined, { test : 5}] }).should.equal(false);
    });
    

    var test = {"a":"b","c":{"d":"e","f":"g","h":"i","j":"k","l":"m","n":"o"},"p":"q","r":"s","t":"u"};
    var test_false = {"a":"","b":{"c":"","d":"","e":"","f":"","g":"","h":""},"i":"","j":"","k":""};
    
    it ('returns true for nested objects', function() {
        vacant(test).should.equal(false);
    });

    it ('returns false for nested false objects', function() {
        vacant(test_false).should.equal(true);
    });


    // ignore some property names
    it ('returns true for {test: true} when test is ignored', function() {
        vacant({test:5}, {ignore_props:"test"}).should.equal(true);
    });

    it ('returns true for {test123: true} when ^test is ignored', function() {
        vacant({test123:5}, {ignore_props:"^test"}).should.equal(true);
    });

    it ('returns true for {test123: true} when ^test5 is ignored', function() {
        vacant({test123:5}, {ignore_props:"^test5"}).should.equal(false);
    });

    // make sure things don't blow up when there is a circular referencec
    it ( 'is robust against circular references', function () {
        console.log("here");
        var obj = { a : 0, b : 0, c : [ 0, 0 ] };
        obj.c.push(obj);
        vacant(obj).should.equal(true);
    });


   
    

});