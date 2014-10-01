var db = require("../db");
var fs = require('fs');


exports.index = function(req, res) {
    var skip = req.params.skip || 0;
    var limit = req.params.limit || 50;
    db.homologene.find({}, {}, { skip: skip, limit: limit }, function(err, result){
        if ( err ) {
            res.status(404).end('Homologene records could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        }
    })
}

exports.search_by_gene = function(req, res) {
    var gene_id = req.params.id;
    var q = {}
    q["$elemMatch"] = {gene_id : gene_id.toString()};
    var find = {homologs : q};
    db.homologene.find(find, {}, { }, function(err, result){
        if ( err ) {
            res.status(404).end('Homologene records could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        }
    })
}

exports.search_by_mrna = function(req, res) {
    var mrna_accession_ver = req.params.accession;
    var q = {}
    if ( mrna_accession_ver.indexOf(".") < 0) {
        q["$elemMatch"] = {mrna_accession_ver : new RegExp(mrna_accession_ver + ".*")};
    }
    else {
        q["$elemMatch"] = {mrna_accession_ver : mrna_accession_ver.toString()};
    }

    var find = {homologs : q};
    db.homologene.find(find, {}, { }, function(err, result){
        if ( err ) {
            res.status(404).end('Homologene records could not found');
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        }
    })
}

exports.species = function (req, res) {
    var pipeline = [
        {$unwind : '$homologs'},
        {$group : {_id :{name : '$homologs.tax_name', id : '$homologs.tax_id'}}},
        {$project : {id : "$_id.id", name : "$_id.name", _id:0}}
        ];
    db.homologene.aggregate()
        .unwind('homologs')
        .group({_id :{name : '$homologs.tax_name', id : '$homologs.tax_id'}})
        .project( {id : "$_id.id", name : "$_id.name", _id:0})
        .exec(
        function (err, results) {
            console.log(results);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results));
        });
}
