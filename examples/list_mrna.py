
import urllib.request
import shutil  
import requests

from pymongo import MongoClient
client = MongoClient()
db = client.chrome_test
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)
for record in mcursor:
    print(record['accession'])
    url = 'http://localhost:3000/homologene/mrna/' + record['accession']
    response = requests.get(url)
    if response.status_code == requests.codes.ok :
        data = response.json()
        if len(data) > 0 and 'homologs' in data[0]:
            for homolog in data[0]['homologs'] :
                print ("\t", homolog['tax_name'] + " -> ", homolog['mrna_accession_ver'])

