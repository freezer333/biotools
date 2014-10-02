# Instructions for setting up bioinformatics data sources


# Step 1:  Install Node.js
The data sources run locally as a web service on your machine.  The web services are served from a Node.js application, which is very easy to run.  Later in this document you will see how to initialize the services, in this step you should simply ensure that Node.js is installed and running.

Go to the Node.js [website](www.nodejs.org) and click "Install".  Once the installer is downloaded and executed, you can confirm that node is installed properly by opening up your terminal (command prompt) and typing "node --version".  The version of your node installation should print out (any version above 0.10.xx) will be fine.

```
$ node --version
$ v0.10.22
```
# Step 2:  Install MongoDB
All of the data sources you will be installing to your local machine use MongoDB as their data repository.  If you do not yet have MongoDB installed, vistit their [download page](http://www.mongodb.org/downloads) and download the appropriate version (production release, for you given operating system). You do not need to install MongoDB, simply unzip/extract the zip file to a convenient directory. Please note, as in all programming-oriented cases, DO NOT put code, programs, or anything else in directories with spaces in their path. I recommed C:\dev if you are using Windows and ~/dev (~ stands for your user folder ie. /Users/your_username/ on a mac).

Next, create the following folder (Windows): C:\data\db. On a mac, create /data/db. Note, you will need administrator access to your machine to do this.

To ensure the DB is up and running, open up your command prompt and change your directory to C:\dev\mongodb\bin (or whatever directory you extracted MongoDB to). Then type "mongod". The database server should start, as indicated by the command prompt messages. The server will stay running, you can shut it down by typing "Ctrl+c".

# Step 3:  Install Python
The source code that we will download in later steps *builds* datasets from source files hosted on sites such as NCBI's ftp.  The process of building the datasets is called "seeding".  Most seeding scripts are written in Python (version 3, specifically).

Visit the following pages and complete all steps to install Python3 on your machine:

[Python 3 - Mac OS X](https://www.python.org/download/mac)  
[Python 3 - Windows](https://www.python.org/download/windows)  
Note, for Linux, you will use the package manager that comes along with your distribution - so for something like Linux Mint, you'd use `apt-get install python3`  

Once you've installed Python, please make absolutely sure you have a 3.x version (and not a 2.x) version installed.  Open up your terminal/command prompt and ensure that typing `python3 --version` results in the expected output (i.e. `Python 3.4.1`)

## Step 3a:  Install Dependencies
In order to run all scripts, you need a few python and node modules to be installed on your system.

### Python Dependencies
To install the modules below, open your terminal/command prompt.  If you downloaded and installed Python 3.4+, the package manager "pip" will be installed as well.  To install a module, simply type

```
$ pip3 install [module]
```

Where [module] is replaced by the actual module name.  

To run the scripts, install the following modules:

```
numpy
pymongo
requests
urllib3
```

`numpy` is a library for numeric / scientific computation.  `pymongo` is required for interacting with MongoDB.  The `requests` and `urllib3` modules are for making http requests (downloading sources from NCBI).

For example, you'd type `pip3 install pymongo`

### Node.js dependencies
To use the C++ implementation of the qgrs mapping algorithm, you will need to install node-gyp.  

```
$ sudo npm install node-gyp -g
```

# Step 4:  Install Mercurial
The source code for this project is hosted in a Mercurial (hg) repository.  Please note, this is not the same repository as the older Java-based programs we've been using - although the rules of Mercurial, bitbucket, etc. still apply.

Download TortoiseHg from their [main page](http://tortoisehg.bitbucket.org/) and install it. Again, be careful to download the correct version. For Mac OS X users, go to the bottom of their download page and download the correct OS X package.

To ensure that the program is installed correctly, open up (a new) command prompt window and type `hg -v`. You should see information about hg print out.

# Step 5:  Download the source code
You are now ready to download the source code (some Node.js code, and some python seeding scripts).  You will need access to the repository through your bitbucket.org account (if you have trouble with this step, contact Dr. Frees).  

Navigate to a directory where you wish to host your code (~/projects, C:/projects) and type the following command to pull the source:

```
$ hg clone https://username@bitbucket.org/sfrees/biotools

```
**Note, you need to replace 'username' (before the @ symbol) with your own bitbucket username**.  You will be prompted to enter your password for your bitbucket account.

Once complete, move to the biotools directory `cd biotools` and update `hg update`

Next, be sure to update all dependencies for the node.js web services.  

```
$ cd serve
$ npm install
```

# Step 6:  Seed the data sources
Note, we'll be adding more data sources and seeding scripts continually, so keep an eye on this page!  Also, please note that the order in which you do these steps is absolutely critical!  Some data sources rely on the sources built in previous steps

**Before continuting**, you __must__ start your MongoDB server.  Type `mongod` into your terminal or command prompt.  Please read the output carefully to make sure the server is running without error.  Once you confirmed this, you can proceed in running the seeding scripts.

***To execute these scripts, you must navigate to the `biotools/seed` directory.***
## 6a - Chromosome Sequence Data
This script builds the sequence database from the FASTA files downloaded in step 6a.  

```
$ python3 seed_chrome.py
```

Please note, this step will take quite some time to complete.  Follow all directions provided by the interactive script.

## 6b - Basic mRNA and Gene Data
This script will build the gene and mrna data collections from the file download in step 6b.  

```
$ python3 seed_gene.py
```

## 6c - mRNA Sequence Features
This script will attach sequence feature data to many of the mRNA built from step 7b.  The sequence features include organism name, mRNA description, and CDS data.  Note - currently this script is limited to *Homo sapien* transcripts.


```
$ python3 seed_mrna_features.py
```
## 6d - Homologene (optional)
This script downloads homology data directly from Homologene (NCBI), it will run without any need for you to manually download data.  It creates a MongoDB collection called `homologene` which contains records of homologous pairs of protien coding transcripts for a variety of species.

```
$ python3 seed_homologene.py
```

## 6e - U-Rich Elements (optional)
This script creates a listing of sub-records in the mrna collection within each mRNA sequence for U-Rich elements.  Elements found withing 5 and 65 nucleotides past the end / poly(A) of the mRNA are recorded.

To run this script you **must** have your web service running.  In a *separate* terminal/command prompt window, navigate to your `biotools/serve` directory and type `node app.js`.  To verify that the web service is running, open a web browser window and go to http://localhost:3000.  You should see the words "biotools service is running".

Once the service is running, navigate (in a different terminal/command prompt from where you just started the web service) to `biotools/seed` and type the following:

```
$ python3 seed_urich.py
```
The U-rich element records will be stored in an array named `u_rich_downstream` within each mRNA record analyzed.  Each record contains an attribute named `order` which is 3, 4, or 5 depending on number of U's.  In addition, the 5 bases are listed as a string in `seq` and the position relative to the end of the mRNA (downstream of polyA site) is listed in `downstream_rel_pos`.


## 6f - QGRS / G4 Data (optional)
This script creates QGRS sub-records in the mRNA collection.  QGRS records are only created for mRNA where the feature data is present - specifically where the CDS is known.  The QGRS records are categorized by region - 5'UTR, CDS, 3'UTR, and downstrea (65 bases).  G-Score is calculated for each record, and full architectural data is stored.

To run this script you **must** have your web service running.  In a *separate* terminal/command prompt window, navigate to your `biotools/serve` directory and type `node app.js`.  To verify that the web service is running, open a web browser window and go to http://localhost:3000.  You should see the words "biotools service is running".

Once the service is running, navigate (in a different terminal/command prompt from where you just started the web service) to `biotools/seed` and type the following:

```
$ python3 seed_g4.py
```

QGRS records are stored in an array named `g4s`.  Each individual QGRS motif is contains the following attributes:

* `id` - unique id for G4 (concatenation of accession /version and sequence number of motif)
* `is5Prime` - true if motif is in the mRNA's 5'UTR
* `isCDS` - true if motif is in the mRNA's CDS region
* `is3Prime` - true if motif is in the mRNA's 3'UTR region
* `isDownstream` - true if motif is downstream of poly(a) signal
* `start` - start position (relative to beginning of mRNA) of first tetrad
* `tetrads` - number of tetrads in motif
* `tetrad1` - start position of first tetrad (same as start)
* `tetrad2` - start position of second tetrad (relative to beginning of mRNA)
*  `tetrad3` - start position of third tetrad (relative to beginning of mRNA)
*  `tetrad4` - start position of fourth tetrad (relative to beginning of mRNA)
*  `y1` - first loop length
*  `y2` - second loop length
*  `y3` - third loop length
*  `length` - overal length of motif
*  `gscore` - calculated G-score for motif
*  `sequence` - motif bases


## 6g - Gene Ontology (optional)
This scripts will create ontology subrecords within the mRNA and gene collections containing lists of associated function, process, and component GO terms.

```
$ python3 seed_go.py
```
This script only populated GO terms for human genes/mRNA.

#Step 7: Verifying your data
Once your sources have been seeded, you should get familiar with the layout with MongoDB - although most of the time you will work with the data through web services, occasionally it will be very helpful for you to understand how to work directly in MongoDB. The MongoDB instance is named "chrome".  The collection listings should be as shown below (you enter the "show collections" command)

```
$ mongo chrome
> show collections
gene
homologene
mrna
seq
system.indexes
```
## seq collection
The `seq` collection contains chromosome data, however for space considerations, the sequences are in a compressed format.  Typing `db.seq.find().limit(1).pretty()` will show you one result:

```
{
	"_id" : ObjectId("53d70687edc3ca229a31623a"),
	"accession" : "NC_000001",
	"end" : 10000,
	"start" : 0,
	"seq" : BinData(0,"eJztwQENAAAAwqCG7x/HHG5AAQAAAAAAAAAAwL8BAYfnhg==")
}
```

Each chromosome sequence record represents up to 10000 bases of a particilar chromosome, identified by the accession number.  The start/end attributes represent the sequence slice position on the chromosome, and the `seq` attribute is the compressed sequence slice.  To get the entire sequence of the chromosome, you would need to search for all the 10000 base-pair slices for that chromosome.  You would then need to decomress the data.  Normally you will access sequence data through the web service, which handles all of these details for you however.

## mrna collection
The `mrna` collection contains mrna records, each of which can hold a variety of attributes.  Typing `db.mrna.find().limit(1).pretty()` will give you a sample result:

```
{
	"_id" : ObjectId("53f7a65eedc3ca11118f8c75"),
	"start" : "304759",
	"gene_id" : "8225",
	"accession" : "NM_012227.2",
	"chrom" : "NC_000024",
	"end" : "318787"
}
```
The attributes shown show the start/end point on the given chromosome (identified by the chrom attribute) and the corresponding gene ID and accession number of the mRNA record.  Note, the `_id` attribute is **not** a universal id, and may be different (for the same mRNA) on different machines.

Other mRNA records will have sequence feature data (polyA signals/sites, exons, organisim) attached to them, U-rich element listings (if you ran the script in step 7e), and G-quadruplex element listings (TBD).

## gene collection
The `gene` collection contains mrna records, each of which can hold a variety of attributes.  Typing `db.gene.find().limit(1).pretty()` will give you a sample result:


```
{
	"_id" : ObjectId("53f77ce5edc3ca0f11bff745"),
	"gene_id" : "100287102",
	"chrom" : "NC_000001",
	"start" : "11874",
	"gene_name" : "DDX11L1",
	"end" : "14409"
}
```


## homologene collection
The `homologene` collection contains records representing a group of homologous protien coding genes, as found in the Homologene database.  Typing `db.homologene.find().limit(1).pretty()` will give you a result:

```
{
	"_id" : ObjectId("53e8de50725eef0afd388cc9"),
	"homologs" : [
		{
			"tax_id" : "7955",
			"protein_length" : "468",
			"end" : "18380120",
			"start" : "18349627",
			"gene_symbol" : "btbd10a",
			"mrna_accession_ver" : "NM_001110459.1",
			"gi_source" : "312144705",
			"gene_id" : "560466",
			"protein_gi" : "160333895",
			"tax_name" : "Danio rerio",
			"protein_accession" : "NP_001103929.1",
			"strand" : "+"
		},
		{
			"tax_id" : "7227",
			"protein_length" : "439",
			"end" : "202151",
			"start" : "200173",
			"gene_symbol" : "mri",
			"mrna_accession_ver" : "NM_138164.4",
			"gi_source" : "116010443",
			"gene_id" : "38028",
			"protein_gi" : "20130399",
			"tax_name" : "Drosophila melanogaster",
			"protein_accession" : "NP_612008.1",
			"strand" : "+"
		},
		{
			"tax_id" : "7165",
			"protein_length" : "442",
			"end" : "38165513",
			"start" : "38163054",
			"gene_symbol" : "AgaP_AGAP006777",
			"mrna_accession_ver" : "XM_308967.3",
			"gi_source" : "119024589",
			"gene_id" : "1270285",
			"protein_gi" : "158286857",
			"tax_name" : "Anopheles gambiae",
			"protein_accession" : "XP_308967.3",
			"strand" : "+"
		}
	],
	"hid" : "136003"
}

```

In this listing, you can see all data associated with each transcript.  Linking these listing to mRNA and gene collections can be done through `gene_id` and `mrna_accession_ver`.  Note however, currently this data set only includes mrna/gene/sequence data for humans.

#Step 8:  Create Indexes
You should create additional indexes to speed up the access time of your MongoDB database.  To do so, open your terminal/command prompts and type

```
$ mongo chrome
```
Then, at the mongo shell, type the following to create an index of the chromosome sequence data's accession/start position.  

```
>  db.seq.ensureIndex({'accession':1, 'start':1})
```
Note, that command may take a few minutes to complete.

Additional useful indexes are:

*  `db.mrna.ensureIndex({'accession':1})`
*  `db.gene.ensureIndex({'gene_id':1})`
*  `db.homologene.ensureIndex({'mrna_accession_ver':1})`

You can create indexes on any commonly searched attributes to support your projects.


# Step 9:  Serving your data
While you will also be able to access this data directly through MongoDB, some of the datasets (especially sequence data) is easier to access through web services.   In a *separate* terminal/command prompt window, navigate to your `biotools/serve` directory and type `node app.js`.  To verify that the web service is running, open a web browser window and go to http://localhost:3000.  You should see the words "biotools service is running".

The following URL's can be used to access data:


## Serving Chromosome Sequence Data
```http://localhost:3000/chrom/:accession/:start/:end```  
Where :start and :end are nucleotide positions on the chromosome, and :accession is the accession number corresponding to the human chromosome.


## Serving mRNA Records
```http://localhost:3000/mrna```  
```http://localhost:3000/mrna/:skip/:limit```  
The mrna url without an additional path part returns a list of mrna - currently limited to about 100.  When the optional skip and limit path parts are included, a given number of mrna sequences can be skipped, and the amount of mrna returned can be specified.


## Serving Gene Records
```http://localhost:3000/gene```
```http://localhost:3000/gene/:skip/:limit```  
A similar URL strategy is used for genes as well.

## Serving specific mRNA or Genes by id/accession number
For mrna and genes, you can specifiy precisely which record you want to retreive by specifying the accession number for mrna, or the gene id for genes

```http://localhost:3000/mrna/:accession```  
```http://localhost:3000/gene/:geneid```  

For example, request to `http://localhost:3000/gene/64109` will return a JSON representation of the CRLF2 human gene.  Requests to `http://localhost:3000/api/mrna/NM_000345.3` will return a JSON representation of the human SNCA mRNA.  

## Serving mRNA sequences
For mRNA, you can easily retrieve the full sequence using the following URL:
```http://localhost:3000/mrna/:accession/sequence```

Requests to the URL will build the mRNA sequence from the chromosome source data, stitching together exon associated with the exon and performing necessary
reverse compliment transformations as needed.

## Finding Homologene Records
The homologene records have clusters of genes with related function.  You may retrieve listings using the standard skip/limit api using the following URL.

```http://localhost:3000/homologene/list```
```http://localhost:3000/homologene/list/:skip/:limit```

More useful however is retreiving clusters based on a gene id or mRNA accession number.  Requests to the following URL's will return all homologene records which contain either the gene referenced by the gene id or mRNA referenced by accession number.  This makes it very easy to find genes/mRNA that are homologous to sequences you might be working with.

```http://localhost:3000/homologene/mrna/:accession```  
```http://localhost:3000/homologene/gene/:geneid```

Note also that for accession numbers, if you do not end the accession with a version number (for example, if you simply use `http://localhost:3000/homologene/mrna/NM_006245` instead of `http://localhost:3000/homologene/mrna/NM_006245.2`), regular expression will be used to match against accession number with *any version* - and therefore results containing mRNA with accession number of - for example - NM_006245.3 would be returned.

### Organisims in Homologene
To find all organisms listed in the homologene collection, visit:

```http://localhost:3000/homologene/species```  

This URL will return a JSON array of taxon objects - containing the ID and organism name of each organism represented in the entire collection.

## Performing Alignments (Semi-Global)
The Node.js web app has an additional service that can perform semi-global alignment of any two sequences given their raw sequence data.  To use this service, you must install Emboss's `needle` program however.

Please visit [sourceforge](http://emboss.sourceforge.net/download) for full installation instructions.  **Unfortunately, `needle` does not work on Windows - only Linux or Mac OS X**.

Background information about the `needle` program can be found [here](http://emboss.sourceforge.net/apps/release/6.6/emboss/apps/needle.html) and [here](http://www.ebi.ac.uk/Tools/psa/emboss_needle/help/index-protein.html)

Once you've verified needle is installed correctly, you can access the alignment module over http using the following URL

```
http://localhost:3000/alignment
```

The URL responds to POST messages with `seqa` and `seqb` parameters.  The response will be JSON containing the resulting sequences with gaps (-) injected.

To test, you can also visit `http://localhost:3000/alignment/input` and enter sequences manually.


## QGRS Data
Each QGRS motif within an mRNA is assigned a unique ID number which is the mRNA accession number appended with a sequence number.  For example, the fours QGRS found within mRNA with accession number `NM_001010889.2` would be assigned an ID of `NM_001010889.2.4`.

To retrieve the record for a specific QGRS motif, you may use the following URL.

```
http://localhost:3000/qgrs/:qgrs_id
```

### Mapping QGRS motifs
To map QGRS motifs on arbitrary sequence data, the following URL accepts POST messages with a `sequence` parameter, which should contain the sequence to map.

```
http://localhost:3000/qgrs
```

To map QGRS on mRNA, you may also issue GET requests to the following URL, which will return the motifs found within the specified mRNA (`:accession`), including 65 nt. downstream of the poly(A) site.

```
http://localhost:3000/qgrs/mrna/:accession/map
```

### Finding overlapping motifs
The database itself does not store overlapping motifs, it only picks the motif with the highest g-score among a group of overlapping motifs (called families).  To get a listing of the overlaps, you may access the following url.

```
http://localhost:3000/qgrs/:qgrs_id/overlaps
```

This will re-compute the motifs and return all the overlapping motifs for that particular QGRS identified by the motif id.

### Finding QGRS Density
If you've populated your data base with G4 (QGRS) data, then you can use the following URL pattern to calculate QGRS density for specific mRNA.  Density is defined by the number of nt. contained by any matching (by criteria) qgrs motif divided by the total nt. length of the sequence (or region)


```
http://localhost:3000/qgrs/mrna/:acccession/density
```

In the url, `:accession` identifies the mRNA.  The URL responds to both GET and POST requests, and accespts the following filtering parameters:


For example, requests to:

`http://localhost:3000/qgrs/mrna/NM_020713.2/density?maxGScore=35&minGScore=17&minTetrad=2&maxTetrad=2&maxLength=14`

will return the following JSON object descripting QGRS density for the mRNA, broken down by region.

```
{
	"density_criteria": {
		"minTetrad":"2",
		"maxTetrad":"2",
		"minGScore":"17",
		"maxGScore":"35",
		"maxLength":"14",
		"minLength":8
	},
	"accession":"NM_020713.2",
	"cds":{
		"end":2738,
		"start":60
	},
	"density":{
		"overall":{
			"total":9,  // total number of QGRS matching the filtering criteria
			"length":5938,
			"density":0.0015156618390030313
		},
		"utr3":{
			"total":5,  // total number of QGRS matching the filtering criteria in 3'UTR
			"length":3200,
			"density":0.0015625
		},
		"cds":{
			"total":3,
			"length":2678,
			"density":0.0011202389843166542
		},
		"utr5":	{
			"total":0,
			"length":60,
			"density":0
		}
	}
}
```



# Step 10:  Programmatic Access
In step 10, you've seen how URLs, when properly constructed, will return JSON results for genomic data.  The system is a REST web service, and can easily be accessed using nearly any programming language.  In addition, entire API's can be written to deliver data from this service in very convenient ways.  I will be developing access API's in Python and Java, and below is some sample code to get you started.

## Example 1:  Accession sequence data through Python
The following code uses python's url request facilities to get sequence data.

```
import urllib.request
import shutil  
import requests

seq_url = 'http://localhost:3000'
chrom = input("Enter chromosome acccession:")
start = input("Enter start nucleotide:")
end = input("Enter end nucleotide:")

url = seq_url + '/chrom/' +chrom + '/' + start + '/' + end;
response = requests.get(url)
if response.status_code == requests.codes.ok :
    data = response.json()
    print ("The sequence data is\n", data['seq'])
```

## Example 2:  Count U-Rich elements in mRNA in Python
The following code illustrates counting U-rich elements in mRNA by querying MongoDB directly for all mRNA with downstream U-rich elements.

```
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'u_rich_downstream' : {'$exists':True} },snapshot=True)
for record in mcursor:
    accession = record['accession']
    u_rich_count = len(record['u_rich_downstream'])
    print(accession, " has ", u_rich_count, " U-rich elements downstream of poly(A) site")
```

Note, counting QGRS records would be very similar to this example, just using `g4s` array.  To filter by U-rich (or G4) characteristics you can enhance the MongoDB query itself - possibly using the [aggregation framework](http://docs.mongodb.org/manual/core/aggregation/).  To filter in a more simple way (but less efficient), you could just check each motif's characteristics directly in your code - leaving the MongoDB query 'as is'.

## Example 3:  Getting a list of all mRNA in Python
The following code will print all accession numbers for *Homo sapien* mRNA.  Note, you can also filter by build, if necessary.

```
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)
for record in mcursor:
    print(record['accession'])
```

## Example 4:  Finding Homologs for each Human mRNA in Python
Building on the example above, for each human mRNA, you could use the following code to access the homologene service
to obtain a list of homologous mRNA found in other species.  Note, this example uses the homologen web service, which makes these types of queries a bit easier.  Alternatively, you could also query the `homologene` collection directly.

**Make sure you service (localhost) is running!**

```
import urllib.request
import shutil  
import requests

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)
for record in mcursor:
    print(record['accession'])
    url = 'http://localhost:3000/homologene/mrna/' + record['accession']
    response = requests.get(url)
    if response.status_code == requests.codes.ok :
        data = response.json()
        if len(data) > 0 and 'homologs' in data[0]:
            for homolog in data[0]['homologs'] :
                print ("\t", homolog['tax_name'] + " -> ", homolog['mrna_accession_ver'])

```

## Example 5:  Performing a semi-global alignment on two mRNA sequences in Python
The following python code utilizes the mrna sequence URL, and the needle alignment URL to perform an alignment of two mRNA sequences.

```
import urllib.request
import shutil  
import requests

human = 'NM_003196.1'  # human TCEA3 transcript
mouse = 'NM_011542.2'  # mouse TCEA3 transcript

human_sequence = None
mouse_sequence = None

url = 'http://localhost:3000/mrna/' + human + "/sequence"
response = requests.get(url)
if response.status_code == requests.codes.ok :
    data = response.json()
    human_sequence = data['sequence'];

url = 'http://localhost:3000/mrna/' + mouse + "/sequence"
response = requests.get(url)
if response.status_code == requests.codes.ok :
    data = response.json()
    mouse_sequence = data['sequence'];

post_data = { 'seqa' : human_sequence,
              'seqb' : mouse_sequence}

if human_sequence is not None and mouse_sequence is not None:
    url = 'http://localhost:3000/alignment/'
    response = requests.post(url, data=post_data)
    if response.status_code == requests.codes.ok :
        data = response.json()
        print("Sequence Alignment Result")
        print("=======================\nSequence A\n=======================")
        print(data['a'])
        print("=======================\nSequence B\n=======================")
        print(data['b'])

else:
    print ('Sequences could not be found')
```

## Example 5:  Finding QGRS Density in Python
The following finds the QGRS density of a particular mRNA, while filtering to include only motifs with 3 tetrads.

```
import urllib.request
import shutil  
import requests

accession = 'NM_015719.3'
url = 'http://localhost:3000/qgrs/mrna/' + accession + '/density'
filter = {'minTetrad' : 3, 'maxTetrad': 3}
response = requests.get(url, params=filter)
if response.status_code == requests.codes.ok :
    data = response.json()
    print("Density of QGRS (minimum of 3 tetrads) in 3'UTR is " , data['density']['utr3']['density'])
else:
    print("Density of QGRS could not be calculated")
```

# Refreshing your data
For many of these scripts, if you re-run them they will create **duplicate** data within the database, which could be *very... very bad* for statistical analysis!  If you wish to re-run these scripts, be sure to delete the database collections that will be affected.  For example, to delete the mrna collection, you can log into MongoDB from your command line / terminal:

```
$ mongo chrome
> db.mrna.drop()
```
