import pymongo
import sys
import os
import configparser
import urllib.request
import shutil
import gzip
import json
import requests
import math
import time
from g import *

#------------------------------------------------------------
# u-rich calc parameters
upstream = 5
downstream = 200
#------------------------------------------------------------



#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
#------------------------------------------------------------




def get_chrom_accession(common, seed):

    for record in seed['chromosomes']:
        v = "chr" + record['common_id']
        if v==common:
            return record['accession']
    return False

def get_Seq(start,end, accession):
    query_end = "";

    #+ orientation
    if(start < end):
        query_end = int(start)+200
        url='http://localhost:3000/chrom/'+accession+"/"+str(start)+'/' + str(query_end)

    #- orientation
    else:
        query_end= int(start)-200
        url = 'http://localhost:3000/chrom/' + accession + '/' + str(start) + '/' + str(query_end) + "?orientation=-"

    response = requests.get(url)
    if response.status_code == requests.codes.ok:
        data = response.json()
        return data['seq']

    return 'no sequence found'
        



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
    

# check taxon id
if len(sys.argv) > 1 :
    taxon_ids = sys.argv[1:]
else :
    print("You must specify taxon id's of the organism you want to build.")
    print("For example:  '",sys.argv[0]," 9606' would install Homo sapiens")
    print("Currently only supporting 9606 (Homo sapiens) and 10090 (Mus musculus)")
    sys.exit(0);
for taxon_id in sorted(taxon_ids) :
    with open("seeds/"+ taxon_id + ".json") as json_file:
        seeds = json.load(json_file)


    config = configparser.ConfigParser()
    config.read('seed_sources.ini')
    
    seq_url = config['chrom']['serve_url']
    #url = config['polyA']['base_url'] + config['polyA']['download_filename']
    local_path = config['local']['download_dir'] + "/" + seeds["apadb_seed"];
    
    
    print("Now processing APADB - make sure your webapp is running and you have the polyA bed file in temp!")
    
    processed = 0
    with_mrna = 0
    with open(local_path) as f:
        for line in f:
            ch = line.split()[0]
            acc = get_chrom_accession(ch, seeds)
            start_pos = line.split()[1]
            end_pos = line.split()[2]
            status="NOT FOUND"
            url =""
            region= line.split()[6]
            if (region == "UTR3" or region =="Extension") and abs(int(end_pos)-int(start_pos)) <= 25: 
                    url = seq_url + '/chrom/locusmap/' +acc + "/" + start_pos
                    response = requests.get(url)
                    if response.status_code == requests.codes.ok :
                        data = response.json()
                        found=0
                        mapped_mrna = []
                        #print(data)
                        final_pos = start_pos
                        if len(data['mrna']) > 0:
                            status = "INTRON"
                            for mrna in data['mrna']:
                                if mrna['locus'] >= 0:
                                    status = "MAPPED TO " + str(mrna['locus'])
                                    with_mrna += 1
                                    mapped_mrna.append(mrna['accession'])
                                    
    
                                #check the end position   
                                else:
                                    url = seq_url + '/chrom/locusmap/' +acc + "/" + end_pos
                                    response = requests.get(url)
                                    if response.status_code == requests.codes.ok :
                                        data = response.json()
                                        status = "NOT FOUND"
                                        final_pos = end_pos
                                        if len(data['mrna']) > 0:
                                            status = "INTRON"
                                            for mrna in data['mrna']:
                                                if mrna['locus'] >= 0:
                                                    status = "MAPPED TO " + str(mrna['locus'])
                                                    with_mrna += 1
                                                    mapped_mrna.append(mrna['accession'])
                                         
                                     
                                                
                    else:
                        url = seq_url + '/chrom/locusmap/' +acc + "/" + end_pos
                        response = requests.get(url)
                        if response.status_code == requests.codes.ok :
                            data = response.json()
                            status = "NOT FOUND"
                            final_pos = end_pos
                            if len(data['mrna']) > 0:
                                status = "INTRON"
                                for mrna in data['mrna']:
                                    if mrna['locus'] >= 0:
                                        status = "MAPPED TO " + str(mrna['locus'])
                                        with_mrna += 1
                                        mapped_mrna.append(mrna['accession'])
    
                    processed += 1
    
                    # MAKE THE POLYA record and insert it into the collection
                    print (with_mrna , " / " , processed, "   -  Accession ", acc, "Locus = ", final_pos, " - ", status)
    
                                     
            if (status.split()[0] == "MAPPED"):
                #extract gene id from data
                genes=data['genes']
                gene_id=""
                for g in genes:
                    gene_id =g['gene_id'] 
                        #make sure mrna accessions are distinct
                mrna_set= set(mapped_mrna)
                seq = get_Seq(start_pos,end_pos,acc)
                us= get_urich_motifs(seq)
                    #the find g4 has lots of extra info, make less cluttered
                g4= find(seq)
                g_quad = []
                for g in g4:
                    tmp_g = dict()
                    tmp_g['gscore']= g['gscore']
                    tmp_g['tetrads']= g['tetrads']
                    tmp_g['length']= g['length']
                    tmp_g['sequence']= g['sequence']
                    tmp_g['start']= g['start']
                    g_quad.append(tmp_g)
    
                       
        
                record = {
                    "gene_id": gene_id,
                    "start":start_pos,
                    "end":end_pos,
                    "mrna": list(mrna_set),
                    "URS": us,
                    "g_quad":g_quad,
                    "region":region
                }
                db.polyA.insert_one(record)

               