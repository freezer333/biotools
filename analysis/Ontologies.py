#run this program before Ontologies2.py

import urllib.request
import shutil
import requests
import xlwt

yesfile = open('genelist.txt', 'w+')
nofile = open('notgenelist.txt', 'w+')

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)

for record in mcursor:
    if 'utr_5' in record and 'ontology' in record:
        isg4 = False
        if 'g4s' in record:
            # look for AT LEAST one g4 in the gene with that score
            for g4 in record['g4s']:
                if g4['is5Prime']:
                    gscore = int(g4['gscore'])
                    if gscore >= 17:
                        isg4 = True
                        break
        if isg4 == True:
            yesfile.write(record['accession']+'\n')
            continue
        else:
            nofile.write(record['accession']+'\n')

nofile.close()
yesfile.close()