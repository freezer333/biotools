#  This program will build homologene into a MongoDb.
import urllib.request
import shutil
import os
import numpy as np

#------------------------------------------------------------
# Homologene download variables
#------------------------------------------------------------
download_dir = 'tmp/'
url_root = 'ftp://ftp.ncbi.nih.gov/pub/HomoloGene/current/'

taxid_taxname_url = url_root + 'build_inputs/taxid_taxname'
taxid_taxname_file = download_dir + 'taxid_taxname';

protein_url = url_root + 'build_inputs/all_proteins.data'
protein_file = download_dir + 'all_proteins.data'

homologene_url = url_root + 'homologene.data'
homologene_file = download_dir + 'homologene.data'
#------------------------------------------------------------


#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.homologene
#------------------------------------------------------------

class Protein:
    def __init__(self, line):
        fields = line.split('\t');
        self.taxid = fields[0].strip()
        self.gene_id = fields[1].strip()
        self.gene_symbol = fields[2].strip()
        self.gene_description = fields[3].strip()
        self.protein_accession_ver = fields[4].strip()
        self.mrna_accession_ver = fields[5].strip()
        self.protein_length = fields[6].strip()
        self.gi_source = fields[7].strip()
        self.start = fields[8].strip()
        self.end = fields[9].strip()
        self.strand = fields[10].strip()

class Homologene:
    def __init__(self, line):
        fields = line.split('\t')
        self.hid = fields[0].strip()
        self.tax_id = fields[1].strip()
        self.gene_id = fields[2].strip()
        self.gene_symbol = fields[3].strip()
        self.protein_gi = fields[4].strip()
        self.protein_accession = fields[5].strip()

def makeHomolog(homologene, tax_map, protein_map):
    retval = dict()
    prot = protein_map[homologene.protein_accession];
    retval['tax_id'] = homologene.tax_id.strip()
    retval['tax_name'] = tax_map[homologene.tax_id].strip()
    retval['gene_id'] = homologene.gene_id.strip()
    retval['gene_symbol'] = homologene.gene_symbol.strip()
    retval['protein_gi'] = homologene.protein_gi.strip()
    retval['protein_accession'] = homologene.protein_accession.strip()
    retval['mrna_accession_ver'] = prot.mrna_accession_ver.strip()
    retval['protein_length'] = prot.protein_length.strip()
    retval['gi_source'] = prot.gi_source.strip()
    retval['start'] = prot.start.strip()
    retval['end'] = prot.end.strip()
    retval['strand'] = prot.strand.strip()
    return retval

def inject (homologene_list, taxon_map, protein_map):
    hid = homologene_list[0].hid
    homologs = list()
    for h in homologene_list:
        homolog =makeHomolog(h, taxon_map, protein_map)
        homologs.append(homolog)

        
    
    record = { 'hid' : hid, 'homologs' : homologs };
    collect.insert(record)
    

if os.path.isdir(download_dir):
    s = input('Local source directory exists - keep existing data? (yes or no - download):  ')
    if ( s != 'yes' ) :
        shutil.rmtree(download_dir) 

if not os.path.isdir(download_dir):
    os.mkdir(download_dir);

print ("++++++++++++++++++++++++++++++++++++++++++++++")
print ("Homologene -> MongoDb")
print ("----------------------------------------------")
print ('Downloading source data from ' + url_root)

if not os.path.isfile(taxid_taxname_file):
    print ('\t= Downloading tax_id_taxname')
    with urllib.request.urlopen(taxid_taxname_url) as response, open(taxid_taxname_file, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)

if not os.path.isfile(protein_file):
    print ('\t= Downloading all_proteins.data')
    with urllib.request.urlopen(protein_url) as response, open(protein_file, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)

if not os.path.isfile(homologene_file):
    print ('\t= Downloading homologene.data')
    with urllib.request.urlopen(homologene_url) as response, open(homologene_file, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)

print ('\t+ Download of current Homologene build complete')

print ('Processing files')

print ('\t= Processing protein file')
proteins = dict()
with open(protein_file) as f:
        for line in f:
            p = Protein(line)
            proteins[p.protein_accession_ver] = p
print ('\t+ Loaded ', len(proteins), ' proteins')

print ('\t= Processing taxonomy file')
taxons = dict()
with open(taxid_taxname_file) as f:
        for line in f:
            fields = line.split('\t')
            taxons[fields[0]] = fields[1]
print ('\t+ Loaded ', len(taxons), ' taxons')

print ('\t= Assembling Homologene groups')
homologenes = dict()
with open(homologene_file) as f:
        for line in f:
            h = Homologene(line)
            if h.hid in homologenes:
                homologenes[h.hid].append(h)
            else:
                homologenes[h.hid] = list()
                homologenes[h.hid].append(h)
print ('\t+ Loaded ', len(homologenes), ' homologene groups')


print ('Building MongoDB collection')
for hid in homologenes:
    inject(homologenes[hid], taxons, proteins)

print('Homologene DB build completed successfully (chrome/homologene)')


