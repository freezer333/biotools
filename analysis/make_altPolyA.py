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
firstSiteID = None


def convert(n):
    try:
        return int(n)
    except ValueError:
        return float(n + 0.5)
        
for gene in db.gene.find({"organism": "Homo sapiens", 'polyASite' : {'$exists':'true'}, '$where':'this.polyASite.length>0'}):
    pGene = gene['gene_id']
    polyASites = gene['polyASite']
    orientation = gene['orientation']

    firstSiteID = polyASites[0]

    firstSiteEntry = db.polyA.find_one({"_id":firstSiteID})
    firstEnd = firstSiteEntry['end']
    distal = ""
    distal = []

    if orientation is "+":

        d = dict()
        lowestEnd = convert(firstEnd)

        for site_id in polyASites:
            polyA = db.polyA.find_one({"_id":site_id})
            end = polyA['end']
            end = convert(end)
            d[end] = site_id

            if end < lowestEnd:
                lowestEnd = end

        proximal = d[lowestEnd]
        del d[lowestEnd]
        for key in d:
            distal.append(d[key])

        record = {
            "gene_id": pGene,
            "proximal" : proximal,
            "distal" : distal
        }
        db.altPolyA.insert_one(record)
        print ("AltPolyA site added")


    else:
        d = dict()
        highestEnd = convert(firstEnd)

        for site_id in polyASites:
            polyA = db.polyA.find_one({"_id":site_id})
            end = polyA['end']
            end = convert(end)
            d[end] = site_id

            if end > highestEnd:
                lowestEnd = end

        proximal = d[highestEnd]
        del d[highestEnd]
        for key in d:
            distal.append(d[key])

        print ("The proximal polyASite for gene " ,pGene ,"is ", distal)
        record = {
            "gene_id": pGene,
            "distal" : distal,
            "proximal" : proximal
        }
        db.altPolyA.insert_one(record)
        print ("AltPolyA site added")
