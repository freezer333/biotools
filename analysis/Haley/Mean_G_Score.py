#!usr/bin/python3
import urllib.request
import shutil
import requests

from pymongo import MongoClient
client = MongoClient()
db = client.chrome

def convert(n):
    try:
        return int(n)
    except ValueError:
        return float(n + 0.5)

distal_gScores =[]
proximal_gScores =[]
noAlt_gScores[]


for gene in db.altPolyA.find():
    distal_sites = gene['distal']
    proximal_id = gene['proximal']

    #no alternative polyadenylation
    if not distal_sites:
        

    #distal sites are there
    else:
