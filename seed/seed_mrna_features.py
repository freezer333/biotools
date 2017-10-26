# This program will add mRNA sequence features to mRNA listings into a MongoDb.
# Note - the mRNA listings must already be present - if the mRNA referred to
# in the sequence file read does not already exist in the mRNA collection, it
# is ignored.
import urllib.request
import shutil
import os
import numpy as np
import re
import configparser
import gzip
import json

config = configparser.ConfigParser()
config.read('seed_sources.ini')

urls = config['human features']['url'].split(",")

#------------------------------------------------------------
# Sequence features download variables
#------------------------------------------------------------
root = os.getcwd() + '/' + config['human features']['download_directory'] + '/'
os.makedirs(root, exist_ok=True)

seq_features_files = root + config['human features']['download_filename']
#------------------------------------------------------------

#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
#------------------------------------------------------------


print("++++++++++++++++++++++++++++++++++++++++++++++")
print("mRNA Sequence Features (Homo sapien) -> MongoDb")
print("----------------------------------------------")

i = 0
count = 0
all_count = 0
for url in urls:
    print("PROCESSING " + url)
    seq_features_file = root + config['human features']['download_filename']
    seq_features_file = seq_features_file + str(i)
    if not os.path.isfile(seq_features_file):
        print("\t+ Downloading source file from:  ", url)
        with urllib.request.urlopen(url) as response, open(seq_features_file, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)

    seq_features_file = gzip.open(seq_features_file, 'rb')

    features = dict()
    # with open(seq_features_file) as f:
    for data in seq_features_file:
        line = data.decode('utf-8')
        fields = re.split('\s+', line)
        fields = [x.strip() for x in fields]
        if fields[0] == 'LOCUS':
            if len(features) > 0:
                # save features
                all_count += 1
                up = dict()

                if collect.find_and_modify(
                    {'accession': features['accession']},
                        {'$set': features}) != None:
                    count += 1
                print('Saved ', count, ' / ', all_count,
                      ' mrna features - ', url)
                features = dict()

            features['length'] = fields[2]
        if fields[0] == 'DEFINITION':
            features['definition'] = ' '.join(fields[1:])
        if fields[0] == 'VERSION':
            features['accession'] = fields[1]
        if len(fields) >= 2 and fields[1] and fields[1].startswith('/gene='):
            features['gene_name'] = fields[1].split('=')[1].replace('\"', "")
        if fields[1] == 'CDS':
            pts = fields[2].split("..")
            if len(pts) > 1:
                start = pts[0].strip()
                end = pts[1].strip()
                features['cds'] = {'start': start, 'end': end}
                features['utr_5'] = {'start': '1', 'end': start}
                features['utr_3'] = {'start': end, 'end': features['length']}

    seq_features_file.close()
