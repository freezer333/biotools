import urllib.request
import shutil
import requests
import re

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna


#our DB with polyA count
ourDB = dict();
mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)
for record in mcursor:
    reg= record['gene_id']
    if reg in ourDB:
    	ourDB[reg] += 1
    else:
    	ourDB[reg] = 1


#APADB genes with polyA count
d = dict();
with open('HUGO.txt','r') as f:
	 for line in f:
		  line = re.sub('\s+',' ', line)

		 
		  if line in d:
			   d[line] += 1
		  else:
			   d[line]= 1


#collection of HUGO names with Entrez Gene ID
translator = dict();
with open ('ID_HUGO.txt', 'r') as fi:
	for line in fi:
		k, v = line.split (',')
		
		translator[v] = k


for key, value in translator.items():
	 print (key,value)


f.close()
fi.close()