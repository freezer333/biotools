# apex web documentation
This document explains the core modules of the apex system, their API urls and options,
and GUI support.
# apex core API Routes

* jobs
* user management
* package management

# apex core GUI Routes

* jobs
* user management
* package management

# apex packages

## chromosome
The chromosome package provides reference chromosome sequence data to the rest
of the platform's packages.  The package is seeded with `seed_chrome.py` and creates
a collection within the database called `seq`.  

Sequence data is downloaded from `ftp://ftp.ncbi.nlm.nih.gov/genbank/genomes`.  Currently
human and mouse organisms are automatically loaded.

Chromosome sequence data is
broken into 10,000nt "pages", which are stored as individual records in the collection.  
These pages are indexed by chromosome accession number and their start/end positions.  Sequence
data is stored within the page's record in compressed form - due to the repetitive nature
of large portions of the chromosome sequences, this compression reduces storage size
substantially.

```
{
	"_id" : ObjectId("5419b626edc3ca16e9c2b8dd"),
	"start" : 0,
	"accession" : "NC_000001",
	"build" : 38,
	"end" : 10000,
	"seq" : BinData(0,"eJztwQENAAAAwqCG7x/HHG5AAQAAAAAAAAAAwL8BAYfnhg=="),
	"organism" : "Homo sapiens"
}
```
Example record for the first 10000nt. of human chromosome 1.

Due of the paging scheme and the compressed format of sequence data, individual
records in the `seq` collection are of little use for direct query.  All packages
and users are strongly encouraged to utilize the web api (below) for retrieving
chromosome sequence data, instead of through direct database query.

Alternatively, when writing web service code directly within the node.js web app
the database module (found in serve/db) exports a `getSequence` function that
can be used to retrieve sequence slices from any chromosome.  Note however, this
database function does not perform complementation.  The `utils/seq` module exports
a convenience method for these purposes however:

```
function reverse_complement(sequence){
    rev = sequence.split("").reverse();
    sequence = rev.map(function (c){
                if ( c == 'A' ) return 'T';
                if ( c == 'T' ) return 'A';
                if ( c == 'C' ) return 'G';
                if ( c == 'G' ) return 'C';
                return c;
            }).join("");
    return sequence;
}
```

Use of the web api is still strongly encouraged over the lower level database method
and manual reverse complement procedure.

### api routes

`/chrom`

Responds with a JSON listing of all chromosomes currently loaded in the database.
Each listing will include the accession number and the organism, along with
the build number the chromosome sequence data was taken from.

```
[
  {
    "accession": "NC_000001",
    "organism": "Homo sapiens",
    "build": 38
  },
  {
    "accession": "NC_000002",
    "organism": "Homo sapiens",
    "build": 38
  },
  {
    "accession": "NC_000003",
    "organism": "Homo sapiens",
    "build": 38
  },
  {
    "accession": "NC_000004",
    "organism": "Homo sapiens",
    "build": 38
  },
  .....
]
```

`/chrom/:accession/:start/:end`

Responds with JSON containing sequence data pulled from the chromosome
specified in `accession`.  The `:start` and `:end` parmameters specify the specific
locus on the chromosome.  By default, the orientation is assumed to be +, meaning
the raw sequence data is returned.  By specifying orientation as a **query** parameter
the sequence can be reversed, which includes complementation.  For example,
`http://localhost:3000/chrom/NC_000023/10000/10100` will return 100nt from chromosome
with accession number NC_000023 starting at nt 10000.  A request to
`http://localhost:3000/chrom/NC_000023/10000/10100?orientation=-` will return 100nt, however
the sequence from 10000-10100 will be complemented, and returned in reverse order (10100-10000).

The resulting JSON includes the parameters specified, along with the sequence.

```
{
  "accession": "NC_000023",
  "start": "10000",
  "end": "10100",
  "seq": "GCAGTCTGCTTTTATTCTCTAATCTGCTCCCACCCACATCCTGCTGATAGGTCCACTTTCAGAGGGTTAGGGTTAGGGTTAGGGTTAGGGTTAGGGTTAG",
  "orientation": "-"
}
```

Requests for sequence data at any supported sequence


### gui routes

## mrna
## gene
## qgrs
## urich
## needle
## taxon
## homologene
## gene ontology


<!--
app.get('/chrom/:accession/:start/:end', routes.chrom);
app.get('/gene/:id', routes.gene)
app.get('/gene/:skip/:limit', routes.gene_list)

app.get('/mrna/info/species', routes.mrna_species);
app.get('/mrna/info/ontology', routes.mrna_ontology);
app.get('/mrna/:accession', routes.mrna_api)
app.get('/mrna/:accession/sequence', routes.mrna_sequence)
app.get('/mrna/:accession/sequence/:start/:end', routes.mrna_sequence)
app.get('/mrna/:accession/sequence/:start', routes.mrna_sequence)
app.get('/mrna/:skip/:limit', routes.mrna_list)
app.get('/mrna/', routes.mrna_list)
app.get('/mrna', routes.mrna_list)

app.get('/gui/mrna', mrna_routes.index)
app.get('/gui/mrna/:accession', mrna_routes.record)


app.post('/alignment', alignment_routes.index)
app.get('/alignment', alignment_routes.input)
app.get('/alignment/not_configured', alignment_routes.not_configured)
app.get('/alignment/interactive', alignment_routes.input)

app.get('/homologene/gene/:id', homologene_routes.search_by_gene)
app.get('/homologene/mrna/:accession', homologene_routes.search_by_mrna)
app.get('/homologene/list/:skip/:limit', homologene_routes.index)
app.get('/homologene/list', homologene_routes.index)
app.get('/homologene/species', homologene_routes.species)

app.get('/qgrs/input', qgrs_routes.input)
app.post('/qgrs', qgrs_routes.qgrs_find);
app.get('/qgrs/:g4id', qgrs_routes.qgrs);
app.get('/qgrs/:g4id/overlaps', qgrs_routes.qgrs_overlaps)
app.post('/qgrs/:g4id/overlaps', qgrs_routes.qgrs_overlaps)
app.get('/gui/qgrs/:g4id', qgrs_routes.record);


app.get('/qgrs/mrna/:accession/map', qgrs_routes.qgrs_mrna)
app.get('/qgrs/mrna/:accession/density', qgrs_routes.qgrs_density)
app.post('/qgrs/mrna/:accession/density', qgrs_routes.qgrs_density)
app.get('/qgrs/mrna/density', qgrs_routes.qgrs_enrichment)
app.get('/qgrs/mrna/density/analysis', qgrs_routes.qgrs_enrichment_analysis)

app.get('/ugcorrelate',urich_routes.index);
app.get('/ugcorrelate/analysis', urich_routes.uganalysis)

app.get('/jobs', job_routes.list)
app.get('/jobs/:jobid', job_routes.analysis_status);
-->
