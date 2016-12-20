#-----------------------------------
# Script for updating
# alternative splice sites of mRNA
#
# Based on seed_chrome.py file (MO)
#-----------------------------------

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
seq_collect = db.altsplice
seedlog_collect = db.seedlog
#--------------------
page_size = 10000
root = os.getcwd() + '/external_data/altsplicesite_data/'
os.makedirs(root, exist_ok=True)


def insertPage(organism, start, end, accession, seq, seed):
    record = {
        "accession" : accession,
        "start" : start,
        "end" : end,
        "seq" : seq,
        "organism" : organism,
        "taxon_id" : seed['taxon_id'],
        "build": seed['build']
    }

    seq_collect.insert(record)

def purge(organism, accession, seed) :
    spec = {
        "accession" : accession,
        "organism" : organism,
        "build": seed['build']
    }
    retval = seq_collect.remove(spec)
    if not retval is None:
        print ("  -  Removed ", retval['n'], " existing pages for ", organism, " - " , accession, " build # ", seed['build'])


def make_log(organism, accession, seed):
  return {
      "entry_type" : "Alternative splice site seed completion",
      "accession" : accession,
      "organism" : organism,
      "build": seed['build']
  };

def already_exists(organism, accession, seed) :
  spec = make_log(organism, accession, seed)
  ret = list(seedlog_collect.find(spec))
  if len(ret) < 1  :
    return False
  return True

def record_complete(organism, accession, seed) :
  spec = make_log(organism, accession, seed)
  seedlog_collect.insert(spec);


#def processURL(organism, accession, seed, url) :
    #this is similar to processing a file, but we are downloading the
    #FASTA based on the access instead.  This is because lots of genes
    #seem to link back to chromosomes that are not "NC".

    #http://www.ncbi.nlm.nih.gov/nuccore/NT_187005.1?report=fasta&log$=seqview&format=text

def processFile(organism, accession, seed, file):
    line_num = 0
    start = 0
    buffer = ""
    page_count = 0
    acc = accession
    try:
      for data in file:
          line = data.decode('utf-8')
          if line_num > 0:
              seq = line.strip()
              cur_len = len(seq)
              if ( len(buffer) + cur_len == page_size ) :
                  buffer += seq
                  compressed = zlib.compress(bytes(buffer, 'ascii'))
                  insertPage (organism, start, start+page_size, acc, compressed, seed)
                  page_count += 1
                  buffer = ""
                  start += page_size
              elif (len(buffer) + cur_len > page_size ) :
                  remain = page_size - len(buffer)
                  a = seq[:remain]
                  b = seq[remain:]
                  buffer += a
                  compressed = zlib.compress(bytes(buffer, 'ascii'))
                  insertPage (organism, start, start+page_size, acc, compressed, seed)
                  page_count += 1
                  buffer = b
                  start += page_size
              else :
                  buffer += seq
          line_num += 1

      if len(buffer) > 0 :
          compressed = zlib.compress(bytes(buffer, 'ascii'))
          insertPage(organism, start, start+len(buffer), acc, compressed, seed)
          page_count += 1

      print ("  +  Inserted ", page_count, " pages into sequence collection for Alternative splice sites", acc)
      return True
    except EOFError:
      print ("  x  An error occurred while processing this alternative splice site file - please verify that the file was downloaded entirely (or simply manually delete it)")
      return False


########################################################################
###   start of mainline
########################################################################

if len(sys.argv) > 1 :
  taxon_ids = sys.argv[1:]
else :
  print("You must specify taxon id's of the organism you want to build.")
  print("For example:  '",sys.argv[0]," 9606' would install Homo sapiens")
  print("        and:  '",sys.argv[0]," 9598 9593' would install chimps and gorillas")
  sys.exit(0);

for taxon_id in sorted(taxon_ids) :
  try:
    with open("./seeds/9606.json") as json_file:
        seed = json.load(json_file)
        organism = seed['organism']
        folder = root + organism
        if not os.path.exists(folder):
          print ('Creating folder for ' , organism)
          os.makedirs(folder, exist_ok=True)
        for chromosome in seed['chromosomes']:
          print ("-------------------------------------")
          if already_exists(seed['organism'],chromosome['accession'], seed) :
            print (" #  Skipping ", seed['organism'], "chromosome " , chromosome['common_id'], " - already complete")
            continue
          local = folder + "/" + chromosome['url_suffix']
          print (" -  Processing ", seed['organism'], "chromosome " , chromosome['common_id'])
          if not os.path.isfile(local):
              print('  -  Downloading ' , chromosome['accession'], ' from ftp.ncbi.nlm.nih.gov')
              url = seed['url_base'] + chromosome['url_suffix']
              print(url)
              with urllib.request.urlopen(url) as response, open(local, 'wb') as out_file:
                  shutil.copyfileobj(response, out_file)
          purge(seed['organism'], chromosome['accession'], seed)
          file = gzip.open(local, 'rb')
          if processFile(seed['organism'], chromosome['accession'], seed, file) is False :
            print(" xx Error processing ", seed['organism'], chromosome['accession'], "(chromosome ", chromosome['common_id'], ") - local file at ", local)
            sys.exit(0);
          else :
            record_complete(seed['organism'], chromosome['accession'], seed)
          file.close()
        print ("#####################################")
        print ("Chromosome data for ", organism, " built successfully")
        print ("#####################################")
  except FileNotFoundError:
    print ('Error:  Corresponding json file for organism with taxon id', taxon_id, "could not be found in 'chromosome_seeds/'")

print("Creating indexes on seq collection");
print(" + accession/start")
seq_collect.create_index([("accession", pymongo.DESCENDING),("start", pymongo.ASCENDING)])
seq_collect.create_index([("accession", pymongo.ASCENDING),("start", pymongo.ASCENDING)])
seq_collect.create_index([("accession", pymongo.DESCENDING)])
print(" + organism")
seq_collect.create_index([("organism", pymongo.DESCENDING)])
seq_collect.create_index([("organism", pymongo.ASCENDING)])
print(" + build")
seq_collect.create_index([("build", pymongo.DESCENDING)])
print(" + taxon_id")
seq_collect.create_index([("taxon_id", pymongo.DESCENDING)])

print("Sequence collection is complete");
