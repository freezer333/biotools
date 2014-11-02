# chromosome package
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

## seeding
The seeding script builds the sequence database from FASTA files downloaded from NCBI.

```
$ python3 seed_chrome.py [taxon 1] [taxon 2] ... [taxon n]
```

The taxon arguments correspond to the taxon id's of organisms.  Any number of taxons can be specified, and will be built in succession.  Note that the organisms **must** be represented by json seed files in the `chromosome/seeds` directory.  

For example, the following command will build the genomes of *Homo sapiens* and *Mus musculus*:  

```
$ python3 seed_chrome.py 9606 10090
```

Successfully built chromosomes are recorded in a Mongo collection called `seedlog`.  If the chromosome has been fully built, it will always be skipped - give a record of the completion is in `seedlog`.  Here is an example of the record in `seedlog` corresponding to chromosome 1 for *Homo sapiens*.

```
{
	"_id" : ObjectId("54569241edc3ca1ea34f0be1"),
	"accession" : "NC_000001",
	"entry_type" : "chromosome seed completion",
	"organism" : "Homo sapiens",
	"build" : "38"
}
```

If you want to rebuilt the organism, remove all records like the one above for a given organism.  The next time the seed script is run it will automatically purge the existing records before rebuilding the organism's genome.  You may also remove individual chromosomes and re-run the script.

Please note, this step will take quite some time to complete - especially for the higher organisms.

Currently supported organisms (although its easy to create your own seed file...)

* *Homo sapiens* (9606)
* *Pan troglodytes* (9598)
* *Gorilla gorilla* (9593)
* *Mus musculus* (10090)
* *Drosophila melanogaster* (7227)
* *Caenorhabditis elegans* (6239)

### creating new seed documents

Any organism whose genome is provided in FASTA format, with each chromosome in a separate
file, can be added to the system easily.  Simply create a new .json file in the `chromosome_seeds` folder
with the taxon id as the filename (i.e. 9606.json).

The seed file contains the organism name, build identifier (for versioning), and other attributes
defining the data set.  It also holds a base URL to the folder on NCBI's ftp site were all the FASTA
assembled chromosome files can be found.

The .json file must contain an array listing each chromosome in the organism, along with its common name, its
accession, and its actual filename.

If the .json file is created correctly, the seeding script will download all chromosomes and build the genome of your new organism.

Below is an example of the seed file for the common fruit fly:

```
{ "organism" : "Drosophila melanogaster",
	"build" : "6",
	"taxon_id" : "7227",
	"url_base" : "ftp://ftp.ncbi.nlm.nih.gov/genbank/genomes/Eukaryotes/invertebrates/Drosophila_melanogaster/Release_6_plus_ISO1_MT/Primary_Assembly/assembled_chromosomes/FASTA/",
	"chromosomes" :
		[
			{"common_id" : "2L", "url_suffix" : "chr2L.fa.gz", "accession" : "AE014134"},
			{"common_id" : "2R", "url_suffix" : "chr2R.fa.gz", "accession" : "AE013599"},
			{"common_id" : "3L", "url_suffix" : "chr3L.fa.gz", "accession" : "AE014296"},
			{"common_id" : "3R", "url_suffix" : "chr3R.fa.gz", "accession" : "AE014297"},
			{"common_id" : "4", "url_suffix" : "chr4.fa.gz", "accession" : "AE014135"},
			{"common_id" : "X", "url_suffix" : "chrX.fa.gz", "accession" : "AE014298"},
			{"common_id" : "Y", "url_suffix" : "chrY.fa.gz", "accession" : "CP007106"}
		]
}
```

## api routes

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


## gui routes
