# cycle through all genes in the entire database and pull down any missing
# chromosomes.


import configparser
import urllib.request
import shutil
import os
import numpy as np
import re
import requests
import sys
import time

from utils import parse_fasta
from utils import SequencePageBuilder

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
gene_collect = db.gene
mrna_collect = db.mrna
seq_collect = db.seq
tax_collect = db.taxon



def reseed_chrom(organism, accession) :
    url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=" + accession + "&rettype=fasta&retmode=text"
    resource = urllib.request.urlopen(url)
    content =  resource.read().decode("utf-8")

    fasta = parse_fasta(content)

    spec = { 'scientific name' : organism}
    taxon = tax_collect.find_one(spec)
    taxon_id = ""
    if taxon :
        taxon_id = taxon['id']

    builder = SequencePageBuilder(seq_collect, organism, taxon_id, "", 10000)
    builder.purge(accession)
    builder.process(accession, fasta['body'], False)




start = time.time()
mcursor = gene_collect.find(spec={},snapshot=True, timeout=False)
rcursor = mrna_collect.find(spec={},snapshot=True, timeout=False)
count = 0
mis_count = 0
processed = set()
for record in mcursor:
    spec = {
        "accession" : record['chrom']
    }
    if record['chrom'] not in processed:
        c_cursor = seq_collect.find(spec=spec, snapshot=True, timeout=False)
        if ( c_cursor.count() == 0) :

            start = time.time()
            print ('Missing',  '{0: <15}'.format(record['gene_name']), '{0: <15}'.format(record['organism']),'{0: <15}'.format(record['chrom']))
            mis_count+= 1
            reseed_chrom(record['organism'], record['chrom'])
            end = time.time()
            print('\tMissing chromosome ', mis_count, '/', count,  'processeds in', '{0:.4f}'.format(end-start), 'seconds')
    count += 1
    processed.add(record['chrom'])
mcursor.close()
print ('Reseeded ', count, " genes");
print ('Missing ' , mis_count);

print("=================================")

count = 0
mis_count = 0
processed = set()
for record in rcursor:
    spec = {
        "accession" : record['chrom']
    }
    if record['chrom'] not in processed:
        c_cursor = seq_collect.find(spec=spec, snapshot=True, timeout=False)
        if ( c_cursor.count() == 0) :
            start = time.time()
            print ('Missing',  '{0: <15}'.format(record['accession']), '{0: <15}'.format(record['organism']),'{0: <15}'.format(record['chrom']))
            mis_count+= 1
            reseed_chrom(record['organism'], record['chrom'])
            end = time.time()
            print('\tMissing chromosome ', mis_count, '/', count,  'processeds in', '{0:.4f}'.format(end-start), 'seconds')
    count += 1
    processed.add(record['chrom'])
mcursor.close()
print ('Reseeded ', count, " mRNA");
print ('Missing ' , mis_count);
