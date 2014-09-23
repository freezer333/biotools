import configparser
import urllib.request
import shutil
import os
import numpy as np
import re
import requests
import sys
import time

sys.path.append("../util")
import g



skip_existing = True




config = configparser.ConfigParser()
config.read('seed_sources.ini')

#------------------------------------------------------------
# Note:     This seeding script requires the chromosome sequence
#           service to be up and running, with a fully populated
#           sequence database.  Use the URL field below to direct
#           the script to an alternative endpoint for sequence
#           data.
#
#           mRNA listings are pulled directly from the mrna collection
#           in mongo.
seq_url = config['chrom']['serve_url']
#------------------------------------------------------------

# Controls how far into the downstream region (past poly(A)) we will
# map G4 into.
downstream = int(config['g4']['downstream'])

#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client[config['db']['name']]
collect = db[config['g4']['collection']]
#------------------------------------------------------------

def valid_position(s):
    try:
        return int(s)
    except ValueError:
        return -1
    
def process_mrna(count, mrna, start_time):
    start = int(mrna['end'])
    end = int(mrna['end'])
    url = seq_url + '/mrna/' + mrna['accession'] + '/sequence'
    if 'cds' not in mrna : 
        return False
    if valid_position(mrna['cds']['start']) < 0 :
        return False
    if valid_position(mrna['cds']['end']) < 0 :
        return False
    if 'g4s' in mrna and skip_existing:
        print('Skipping ', mrna['accession'], " - g4s already exist")
        return True
    time_sum = 0
    transcript_end = 0
    response = requests.get(url)
    if response.status_code == requests.codes.ok :
        data = response.json()

        if  'sequence' in data:
            before = time.time()
            sequence = data['sequence']
            transcript_end = len(sequence)
            # get downstream sequence data from chrom
            # Note, this is a little tricky because some of these mrna are reverse-compliment.
            start = 0
            end = 0
            
            if data['mrna']['orientation'] == '+':
                start = int(mrna['end'])
                end = int(mrna['end']) + downstream
                url = seq_url + '/chrom/' + mrna['chrom'] + '/' + str(start) + '/' + str(end)
            else:
                start = int(mrna['start']) - downstream
                end = int(mrna['start'])
                url = seq_url + '/chrom/' + mrna['chrom'] + '/' + str(start) + '/' + str(end) + "?orientation=-";
            
            response = requests.get(url)
            if response.status_code == requests.codes.ok :
                data = response.json()
                if  'seq' in data :
                    sequence += data['seq']

            # Find all the G4
            g4s = g.find(sequence)

            g4_list = list()
            # Now annotate all the G4 based on region [Promoter, 5'UTR, CDS, 3'UTR, Downstream, Intron]
            # For now we are not doing promoter or intron
            id = 1
            for g4 in g4s :
                g4['id'] = mrna['accession'] + '.' + str(id)
                cds_start = int(mrna['cds']['start'])
                cds_end = int(mrna['cds']['end'])
                g4_start = int(g4['start'])
                g4_end = g4_start + int(g4['length'])
                g4['is5Prime'] = g4_start <= cds_start
                g4['isCDS'] = g4_start >= cds_start and g4_start <= cds_end or g4_end >= cds_start and g4_end <= cds_end
                g4['is3Prime'] = g4_start >= cds_end and g4_start <= transcript_end or g4_end >= cds_end and g4_end <= transcript_end
                g4['isDownstream'] = g4_end >= transcript_end

                g4_list.append(g4)
                
            collect.update({'_id':mrna['_id']}, {'$set': {'g4s': g4_list}})

            
            after = time.time()
            time_avg = (after-start_time) / count
            print ("Processed ", '{0: <15}'.format(mrna['accession']), "  ->  ", '{0: <5}'.format(str(len(g4s))), " G4s found, in " , '{0:.4f}'.format(after-before), " secs (count = ", '{0:<9}'.format(count), "avg = " , '{0:.4f}'.format(time_avg), " secs)")
            return True
        else:
            return False

start = time.time()
mcursor = collect.find(spec={},snapshot=True, timeout=False)
count = 1
for record in mcursor:
    if process_mrna(count, record, start):
        count += 1
mcursor.close()
print ('Processed ', count, " mRNA ->  G4 Seeding Complete")