 # This program will add mRNA sequence features to mRNA listings into a MongoDb.
 # Note - the mRNA listings must already be present - if the mRNA referred to 
 # in the sequence file read does not already exist in the mRNA collection, it 
 # is ignored.
import urllib.request
import shutil
import os
import numpy as np
import re


#------------------------------------------------------------
# Sequence features download variables
#------------------------------------------------------------
root = '/Users/sfrees/projects/bio-data/mRNA-Features-Human/'
seq_features_file = root + 'mRNA-Features-Human'
#------------------------------------------------------------

#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
#------------------------------------------------------------


print ("++++++++++++++++++++++++++++++++++++++++++++++")
print ("mRNA Sequence Features (Homo sapien) -> MongoDb")
print ("----------------------------------------------")

count = 0
all_count = 0
features = dict()
exons = list()
with open(seq_features_file) as f:
    for line in f:
        fields = re.split('\s+', line)
        fields = [x.strip() for x in fields]
        if fields[0] == 'LOCUS':
            if len(features ) > 0: 
                # save features
                all_count += 1
                features['exons'] = exons
                up = dict()
                if collect.find_and_modify({'accession' : features['accession']}, {'$set': {'features': features}}) != None :
                    count+= 1
                print ('Saved ', count, ' / ' , all_count, ' mrna features')
                features = dict()
                exons = list()
            features['length'] = fields[2];
        if fields[0] == 'DEFINITION':
            features['definition'] = ' '.join(fields[1:])
        if fields[0] == 'VERSION':
            features['accession'] = fields[1]
        if len(fields) >= 2 and fields[1] and fields[1].startswith('/gene='):
            features['gene_name'] = fields[1].split('=')[1].replace('\"', "")
        if fields[1] == 'ORGANISM':
            features['organism'] = ' '.join(fields[2:]).strip()
        if fields[1] == 'CDS':
            pts = fields[2].split("..");
            if len (pts)  > 1:
                start = pts[0].strip()
                end = pts[1].strip()
                features['cds'] = { 'start' : start, 'end' : end}
                features['utr_5'] = { 'start' : '1', 'end' : start}
                features['utr_3'] = { 'start' : end, 'end' : features['length']}
        if fields[1] == 'exon':
            pts = fields[2].split("..");
            if len (pts)  > 1:
                start = pts[0].strip()
                end = pts[1].strip()
                exons.append({ 'start' : start, 'end' : end})
            