
# THIS NEEDS TO BE MADE DRAMATICALLY MORE EFFICIENT

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
ont_collect = db.ontrelate
#--------------------

def getParents( ontlist ):
    retlist = []
    for item in ontlist:
        parent_recs = ont_collect.find(spec={'child' : item, 'relation' : "is_a" },snapshot=True)
        newlist = []
        for rel in parent_recs:
            if rel["parent"] == "all":
                continue
            if rel["parent"] not in retlist:
                retlist.append(rel["parent"])
                newlist.append(rel["parent"])
        addlist = getParents( newlist )
        for adding in addlist:
            if adding not in retlist:
                retlist.append(adding)
    return retlist


mcursor = collect.find(spec={'organism' : 'Homo sapiens' },timeout=False,snapshot=True)

for record in mcursor:
    if 'ontology' in record:
        shouldChange = False
        ont = dict()
        ont['functions'] = record['ontology']["functions"];
        ont['components'] = record['ontology']["components"];
        ont['processes'] = record['ontology']["processes"];
        parentcomps = parentfuncs = parentprocs = []
        print(record['accession'] + " updating...")
        parentcomps = getParents(record['ontology']["components"])
        if parentcomps:
            shouldChange = True
            ont['components'] = parentcomps + ont['components']
        parentfuncs = getParents(record['ontology']["functions"])
        if parentfuncs:
            shouldChange = True
            ont['functions'] = parentfuncs + ont['functions']
        parentprocs = getParents(record['ontology']["processes"])
        if parentprocs:
            shouldChange = True
            ont['processes'] = parentprocs + ont['processes']
        if shouldChange:
            collect.update({"accession": record['accession']}, {'$set': {'ontology': ont }})
        print(record['accession'] + " updated")

print("all records added")


