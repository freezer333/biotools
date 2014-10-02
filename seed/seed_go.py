import configparser
import urllib.request
import shutil
import os
import numpy as np
import re
import requests
import sys
import time

import gzip

#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client['chrome']
mrna_collect = db['mrna']
gene_collect = db['gene']
#------------------------------------------------------------


config = configparser.ConfigParser()
config.read('seed_sources.ini')

url = config['human ontology']['url']

#------------------------------------------------------------
# Ontology download variables
#------------------------------------------------------------
root = os.getcwd() + '/' + config['human ontology']['download_directory'] + '/'
os.makedirs(root, exist_ok=True)

ontology_file = root + config['human ontology']['download_filename']

print ("++++++++++++++++++++++++++++++++++++++++++++++")
print ("Gene Ontology (Homo sapien) -> MongoDb")
print ("----------------------------------------------")

if not os.path.isfile(ontology_file):
    print("\t+ Downloading source file from:  ", url)
    with urllib.request.urlopen(url) as response, open(ontology_file, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)

ontology_file = gzip.open(ontology_file, 'rb')

line_num = 0
gene_id = "";
gene_n = 0
human = 0
process = list()
function = list()
component = list()
for data in ontology_file:
    line = data.decode('utf-8')
    fields = line.split('\t');
    if line_num != 0:
      taxon = fields[0]
      if taxon == '9606':
        gid = fields[1].strip();
        if gid != gene_id:
          record = dict()
          record['gene_id'] = gene_id;
          record['ontology'] = dict()
          record['ontology']['functions'] = function;
          record['ontology']['components'] = component;
          record['ontology']['processes'] = process;

          mrna_collect.update({'gene_id':gene_id}, {'$set': {'ontology': record['ontology']}})
          gene_collect.update({'gene_id':gene_id}, {'$set': {'ontology': record['ontology']}})
          print("Saved ontology data for gene and mRNA records with gene_id = ", gene_id);
          gene_n += 1
          process = list()
          function = list()
          component = list()

        gene_id = gid;
        if fields[7].strip() == 'Function':
            function.append(fields[5].strip());
        elif fields[7].strip() == 'Component':
            component.append(fields[5].strip());
        elif fields[7].strip() == 'Process':
            process.append(fields[5].strip());

        human += 1
    line_num += 1

print ("Processed ", human, "human go terms, ", gene_n, " total genes")
