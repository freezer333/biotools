#!usr/bin/python3

import urllib.request
import shutil
import requests

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

#create a string made up of the highest u as the
#0th index and the g score as the following indexes of
#the hash. Thats the key and the values are the amount
#of times that permutation occurs. Worked from there



mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)
d = dict();
IDs = dict();


def convert(n):
    try:
        return int(n)
    except ValueError:
        return float(n + 0.5)


def highestU (record):
    if 'u_rich_downstream' in record:
        u_Elements = record['u_rich_downstream']
        highestOrder = 0
        for u in u_Elements:
            order = convert (u['order'])
            if order > highestOrder:
                highestOrder = order
        return highestOrder
    else:
        if('cds' in record):
            return 0
        else:
            return 9

def highestG (record):
    highestG = 0
    if 'g4s' in record:
        g4s = record['g4s']
        for g in g4s:
          if g ['isDownstream']:
             score = convert (g['gscore'])
             if score> highestG:
                highestG = score
    return highestG


regEl = ""
idNum = ""
doubles = 0
for record in mcursor:
    reg= record['gene_id']
	uScore = str(highestU(record)) 
	gScore = str(highestG(record))
	regEl = uScore + gScore



	if regEl in d:
        if reg in IDs:
            doubles += 1
            
		else:
            d[regEl] += 1
            IDs[reg] = 1

	else:
		d[regEl] =1
    	



numU = "-1"
for key in sorted(d.keys()):

	temp= d[key]
	
	if (key[0] != numU):
		print ("\n********************  ", key[0], "u's  **************************\n")
		numU = key[0]

	print (key[1:],"\t",temp)


	