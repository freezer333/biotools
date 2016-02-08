#!usr/bin/python3
import urllib.request
import shutil
import requests

from pymongo import MongoClient
client = MongoClient()
db = client.chrome


objectID = ""
pGene = ""
count = 0
for site in db.polyA.find():
    pGene = site['gene_id']
    objectID= site['_id']


    geneCursor = db.gene.find({"gene_id":pGene, "organism": "Homo sapiens"})

    for g in geneCursor:
        print ("polyA:", pGene)
        print ("gene: ", g['gene_id'])

        if 'polyASite' in g:
            db.gene.update({"gene_id":pGene},{'$push': {'polyASite' : objectID}},True)
            count += 1
            print(count, "polyASites added")
        else:
            pIDList = []
            pIDList.append(objectID)
            db.gene.update({"gene_id":pGene}, {'$set': {'polyASite': pIDList}})
            count +=1
            print(count, "polyASite added")
