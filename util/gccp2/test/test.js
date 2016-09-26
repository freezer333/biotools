var should = require('should');
var assert = require('assert');
var qgrs = require('qgrs2');

// Consider just writing in Node.js... just grab all the sequences for each gene, load them up in a massive
// array of inputs, execute them all in parallel, when done, collect the results.

// Test one gene against python version, make sure results are identical!

var result = qgrs.window("TCAGATTTTGGTTGAAATATGATGAGTGTACAAAATCTTGATTTAAGTGAATGAAAAATTACAAGATCCAACTCTGATTTCAGCCAGAGATC", function(err, result){
    console.log(err);
    console.log(result);
}, 195, 17);
