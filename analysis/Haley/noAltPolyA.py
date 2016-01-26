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


def highestU (record):
    highestOrder = 0
    if 'URS' in record:
        u_Elements = record['URS']
        highestOrder = 0
        for u in u_Elements:
            order = convert (u['order'])
            if order > highestOrder:
                highestOrder = order
    return highestOrder


def highestG (record):
    highestG = 0
    if 'g_quad' in record:
        g4s= record['g_quad']
        for g in g4s:
            tetrads = convert (g['tetrads'])

            if tetrads > highestG:
                highestG = tetrads
    return highestG

strongUCount = 0
weakUCount = 0
noUCount = 0

strongU_4g = 0
strongU_3g = 0
strongU_2g = 0
strongU_0g = 0

weakU_4g = 0
weakU_3g = 0
weakU_2g = 0
weakU_0g = 0

count = 0
for gene in db.gene.find({"organism": "Homo sapiens", 'polyASite' : {'$exists':'true'}}):
    polyA = gene['polyASite']
    if len(polyA) == 1:
        _id = polyA[0]

        site = db.polyA.find_one({"_id": _id})

        g = highestG(site)
        uType = highestU(site)

        if uType ==5:
            strongUCount +=1
        elif uType < 5 and uType != 0:
            weakUCount +=1
        else:
            noUCount +=1
            next

        if uType == 5:
            if g == 0:
                strongU_0g +=1
            elif g ==2:
                strongU_2g +=1
            elif g == 3:
                strongU_3g +=1
            else:
                strongU_4g +=1
        elif uType < 5 and uType != 0:
            if g == 0:
                weakU_0g +=1
            elif g ==2:
                weakU_2g +=1
            elif g == 3:
                weakU_3g +=1
            else:
                weakU_4g +=1






print (strongUCount, "\t", weakUCount, "\t", noUCount)
print(strongU_0g, "\t",strongU_2g, "\t", strongU_3g, "\t",strongU_4g)

print(weakU_0g, "\t",weakU_2g, "\t", weakU_3g,"\t",weakU_4g)



print (count)
