import zlib
import binascii
import pymongo
import os
import urllib.request
import shutil
import gzip
import json
import sys
import re

#--------------------
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.ontrelate
#--------------------

foundTerm = False
foundTerm2Term = False
term_dict = {}
relation_ids =[]

for line in open("/Users/Melissa/dev/biotools/seed/external_data/go_daily-termdb-data"):
    if not foundTerm and not foundTerm2Term:
        if "ALTER TABLE `term` DISABLE KEYS" in line:
            foundTerm = True
        elif "ALTER TABLE `term2term` DISABLE KEYS" in line:
            foundTerm2Term = True
    elif foundTerm:
        #create dictionary of term ID to term name
        if "ALTER TABLE `term` ENABLE KEYS" in line:
            foundTerm = False
            continue
        pattern = re.compile(r'\(([0-9]+),\'(.+?[^\\])\',\'[^,]+?\',\'[^,]+?\',[^,]+?,[^,]+?,[^,]+?\)')
        termslist = re.findall(pattern, line)
        for term in termslist:
            term_dict[term[0]] = term[1].replace("\\'", "\'")
    elif foundTerm2Term:
        if "ALTER TABLE `term2term` ENABLE KEYS" in line:
            foundTerm2Term = False
            continue
        pattern = re.compile(r'\([0-9]+,([0-9]+),([0-9]+),([0-9]+),[0-9]+\)')
        relation_ids = relation_ids + re.findall(pattern, line)

print("dictionary compired")

for rel in relation_ids:
    relation = {}
    relation["child"] = term_dict[rel[2]]
    relation["relation"] = term_dict[rel[0]]
    relation["parent"] = term_dict[rel[1]]
    collect.insert(relation)

print("records added")

print("Creating indexes on ontrelate collection");
print(" + child")
collect.create_index([("child", pymongo.DESCENDING)])
print(" + child, relation")
collect.create_index([("child", pymongo.DESCENDING), ("relation", pymongo.DESCENDING)])

print("Ontrelate collection is complete");
