import zlib
import binascii
import pymongo
import os
import urllib.request
import shutil
import gzip
import json
import sys

#--------------------
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
ont_collect = db.ontologies
#--------------------

def addTerms( type, dic, acc, nums ):
    # dic[item][0] = array of mRNA
    # dic[item][1] = type
    for item in record['ontology'][type]:
        nums[1] = nums[1] + 1 # add 1 to mRNA with ontologies
        if item in dic:
            lis = dic[item][0]
            if acc not in lis:
                lis.append(acc)
            # print(item + " updated, " + str(nums[1]) + " mRNA")
        else:
            dic[item]= [[acc], type]
            nums[0] = nums[0] + 1 # add 1 to number of ontologies
            # print(item + " added, " + str(nums[0]) + " ont terms")

onts = {}
count = [0, 0] # [0] is ontNum, [1] is mRNAnum

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)

for record in mcursor:
    if 'ontology' in record:
        addTerms('components',onts, record['accession'], count)
        addTerms('functions',onts, record['accession'], count)
        addTerms('processes',onts, record['accession'], count)

print("Number of Ontologies: ")
print(count[0])
print("Number of mRNA processed: ")
print(count[1])

for ont in onts:
    record = {
        "term" : ont,
        "type" : onts[ont][1],
        "num_mrna" : len(onts[ont][0]),
        "mrna_list" : onts[ont][0]
    }
    
    ont_collect.insert(record)

print("records added")

print("Creating indexes on ontology collection");
print(" + term")
ont_collect.create_index([("term", pymongo.DESCENDING)])
print(" + num_mrna")
ont_collect.create_index([("num_mrna", pymongo.DESCENDING)])

print("Ontology collection is complete");
