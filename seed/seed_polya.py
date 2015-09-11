import pymongo
import sys
import os
import configparser
import urllib.request
import shutil
import gzip
import json
import requests


# only working with human
with open('seeds/9606.json') as json_file:
    seed = json.load(json_file)

def get_chrom_accession(common):

    for record in seed['chromosomes']:
        v = "chr" + record['common_id']
        if v==common:
            return record['accession']
    return False


config = configparser.ConfigParser()
config.read('seed_sources.ini')

seq_url = config['chrom']['serve_url']
url = config['polyA']['base_url'] + config['polyA']['download_filename']
local_path = config['local']['download_dir'] + "/" + config['polyA']['download_filename'];

if os.path.isfile(local_path):
    print("- Local file [", local_path, "] already exists.");
    choice = input("- Delete and re-download?  (y/n)")
    if choice == 'y':
        os.remove(local_path)

if not os.path.isfile(local_path):
    print("\t+ Downloading source file from:  ", url)
    print('\t  -  Saving to ', local_path)
    with urllib.request.urlopen(url) as response, open(local_path, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)

print("Now processing APADB - make sure your webapp is running!")

processed = 0
with_mrna = 0
with open(local_path) as f:
    for line in f:
        ch = line.split()[0]
        acc = get_chrom_accession(ch)
        start_pos = line.split()[1]

        url = seq_url + '/chrom/locusmap/' +acc + "/" + start_pos
        response = requests.get(url)
        if response.status_code == requests.codes.ok :
            data = response.json()
            status = "NOT FOUND"
            if len(data['mrna']) > 0:
                status = "INTRON"
                for mrna in data['mrna']:
                    if mrna['locus'] >= 0:
                        status = "MAPPED TO " + str(mrna['locus'])
                        with_mrna += 1
            processed += 1

            # MAKE THE POLYA record and insert it into the collection
            print (with_mrna , " / " , processed, "   -  Accession ", acc, "Locus = ", start_pos, " - ", status)