import configparser
import urllib.request
import shutil
import os
import numpy as np
import zipfile


class Line:
    def __init__(self, line):
        fields = line.split('|');
        self.taxid = fields[0].strip()
        self.value = fields[1].strip()
        self.value_alt = fields[2].strip()
        self.type = fields[3].strip()

def fill(tax_entry, line) :
    value = ""
    if not line.value_alt:
        value = line.value
    else:
        value = line.value_alt

    if line.type == 'scientific name':
        tax_entry['scientific name'] = value
    elif line.type == 'genbank common name':
        tax_entry['genbank common name'] = value
    elif line.type in tax_entry:
        tax_entry[line.type].append(value)
    else:
        tax_entry[line.type] = list()
        tax_entry[line.type].append(value)


config = configparser.ConfigParser()
config.read('seed_sources.ini')

url = config['taxon']['base_url'] + config['taxon']['download_filename']
local_path = config['local']['download_dir'] + "/" + config['taxon']['download_filename'];

if os.path.isfile(local_path):
    print("- Local file [", local_path, "] already exists.");
    choice = input("- Delete and re-download?  (y/n)")
    if choice == 'y':
        os.remove(local_path)

if not os.path.isfile(local_path):
    print("\t+ Downloading source file from:  ", url)
    with urllib.request.urlopen(url) as response, open(local_path, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)

local_extracted_folder = config['local']['download_dir'] + "/" + config['taxon']['extract_directory']
with zipfile.ZipFile(local_path, "r") as z:
    z.extractall(local_extracted_folder)

namefilename = local_extracted_folder + "/" + config['taxon']['names_file']


#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client[config['db']['name']]
collect = db[config['taxon']['collection']]
#------------------------------------------------------------
print("+ Processing " , namefilename )

tax = 0
count = 0
with open(namefilename) as f:
    for line in f:
        fields = Line(line)
        if int(fields.taxid) != int(tax):
            #new taxonomy entry
            if tax > 0 :
                collect.insert(current)
                count += 1
                print ("Processed - ", count, " : " , current)
            tax = int(fields.taxid)
            current = dict()
            current['id'] = fields.taxid
        
        fill(current, fields)
print("+ Taxon collection built to database successfully, ", count, " taxons loaded.")
