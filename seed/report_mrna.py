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
import re

from utils import parse_fasta
from utils import SequencePageBuilder

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
gene_collect = db.gene
mrna_collect = db.mrna
seq_collect = db.seq
tax_collect = db.taxon
alignment = db.alignments




def reseed():
    start = time.time()
    #mcursor = gene_collect.find(filter={"build" : "38"}, modifiers={"$snapshot": True}, no_cursor_timeout=True)
    rcursor = mrna_collect.find(filter={"build" : "38"}, modifiers={"$snapshot": True}, no_cursor_timeout=True)
    count = 0    
    for record in rcursor:
        print(record['accession'])
        count += 1
    rcursor.close()
    print ('Exported ', count, " mRNA");
    

reseed()
