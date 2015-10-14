#run this program before Ontologies2.py

import urllib.request
import shutil
import requests
import xlwt

yesfile = open('genelist.txt', 'w+')
nofile = open('notgenelist.txt', 'w+')

loc = int(input("5'-UTR (5), 3'-UTR (3), or CDS (1): "))
minScore = int(input("Minimum g-score: "))
if loc == 5:
    geneLoc = 'utr_5'
    g4Loc = 'is5Prime'
elif loc == 3:
    geneLoc = 'utr_3'
    g4Loc = 'is3Prime'
elif loc == 1:
    geneLoc = 'cds'
    g4Loc = 'isCDS'
else:
    print("Failed at reading directions")

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)

totalGenes = 0
g4Genes = 0

for record in mcursor:
    if geneLoc in record and 'ontology' in record:
        isg4 = False
        if 'g4s' in record:
            # look for AT LEAST one g4 in the gene with that score
            for g4 in record['g4s']:
                if g4[g4Loc]:
                    gscore = int(g4['gscore'])
                    if gscore >= minScore:
                        isg4 = True
                        break
        if isg4 == True:
            yesfile.write(record['accession']+'\n')
            g4Genes = g4Genes + 1
            totalGenes = totalGenes + 1
            continue
        else:
            nofile.write(record['accession']+'\n')
            totalGenes = totalGenes + 1

print(totalGenes)

nofile.close()
yesfile.close()