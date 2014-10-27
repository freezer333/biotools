import urllib.request
import shutil
import os
import numpy as np
import re
import requests

#------------------------------------------------------------
# Note:     This seeding script requires the chromosome sequence
#           service to be up and running, with a fully populated
#           sequence database.  Use the URL field below to direct
#           the script to an alternative endpoint for sequence
#           data.
#
#           mRNA listings are pulled directly from the mrna collection
#           in mongo.
seq_url = 'http://localhost:3000'
#------------------------------------------------------------



#------------------------------------------------------------
# u-rich calc parameters
upstream = 5
downstream = 65
#------------------------------------------------------------



#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
#------------------------------------------------------------


def process_mrna(count, mrna):
    if 'chrom' in mrna and 'start' in mrna and 'end' in mrna :
        #ex. http://localhost:3000/chrom/NC_000023/149592512/149595310
        url = ""
        if mrna['orientation'] == '+':
            start = int(mrna['end']) + upstream
            end = int(mrna['end']) + downstream
            url = seq_url + '/chrom/' + mrna['chrom'] + '/' + str(start) + '/' + str(end);
        else :
            start = int(mrna['start']) - downstream
            end = int(mrna['start']) - upstream
            url = seq_url + '/chrom/' + mrna['chrom'] + '/' + str(start) + '/' + str(end) + "?orientation=-";

        
        response = requests.get(url)
        if response.status_code == requests.codes.ok :
            data = response.json()
            if  'seq' in data :
                #print (data['seq'])
                us = get_urich_motifs(data['seq'])
                #print (us)
                up = dict()
                up['u_rich_downstream'] = us
                ret = collect.update({'_id':mrna['_id']}, {'$set': {'u_rich_downstream': us}})

                #collect.find_and_modify({'accession' : mrna['accession']}, up)
                print('Updated\t' , '{0: <15}'.format(mrna['accession']), " with ", len(us), ' u-rich motifs\t', mrna['organism'])

def get_urich_motifs(seq):
    seq = seq.replace('T', 'U')
    #sliding window of 5, count U's.  if >= 3, add to return array.
    motifs = []
    i = 0
    while i <= len(seq) - 5:
        hexamer = seq[i:(i+5)]
        if hexamer.count('U') >= 3 :
            motif = dict()
            motif['order'] = hexamer.count('U')
            motif['seq'] = hexamer
            motif['downstream_rel_pos'] = upstream + i
            motifs.append(motif)
        i += 1
    return motifs

mcursor = collect.find(spec={},snapshot=True, timeout=False)
count = 1
#process_mrna(mcursor[0])
for record in mcursor:
    process_mrna(count, record)
    count += 1
mcursor.close()
