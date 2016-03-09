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
#--------------------


collect.update( { "organism": 'Homo sapiens', "ontology": { "$exists": True } }, { "$set": { "hasontology": True} }, multi=True )
collect.update( { "organism": 'Homo sapiens', "ontology": { "$exists": False } }, { "$set": { "hasontology": False} }, multi=True )
collect.update( { "organism": 'Homo sapiens', "g4s": { "$exists": True } }, { "$set": { "hasg4s": True} }, multi=True )
collect.update( { "organism": 'Homo sapiens', "g4s": { "$exists": False } }, { "$set": { "hasg4s": False} }, multi=True )

print("records updated")

print("Creating indexes on ontology collection");
print(" + hasontology")
collect.create_index([("hasontology", pymongo.ASCENDING)])
print(" + hasg4s")
collect.create_index([("hasg4s", pymongo.ASCENDING)])
print(" + hasg4s, hasontology")
collect.create_index([("hasg4s", pymongo.ASCENDING), ("hasontology", pymongo.ASCENDING)])
print(" + hasg4s, hasontology, organism")
collect.create_index([("hasg4s", pymongo.ASCENDING), ("hasontology", pymongo.ASCENDING), ("organism", pymongo.ASCENDING)])

print("Modifications are complete");
