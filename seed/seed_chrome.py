import zlib
import binascii
import pymongo
import os



#--------------------
# database stuff...
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
seq_collect = db.seq
#--------------------

page_size = 10000
root = '/Users/sfrees/projects/bio-data/chromosome_data/'




def insertPage(start, end, accession, seq):
    record = {
        "accession" : accession, 
        "start" : start,
        "end" : end, 
        "seq" : seq, 
    }

    seq_collect.insert(record)


def genAccession (description) :
    fields =  description.split(",")
    words = fields[0].split(' ')
    name = words[-1]

    if name == 'X':
        acc =  'NC_000023'
    elif int(name) > 9 :
        acc =  'NC_0000' + name
    else :
        acc =  'NC_00000' + name
    return acc

def processFile(filename):
    line_num = 0
    start = 0
    buffer = ""
    page_count = 0
    acc = ''
    with open(root + filename) as f:
        for line in f:
            if line_num == 0:
                fields =  line.split("|")
                acc = genAccession(fields[4]);
                print ("Proccessing Chromosome " , acc)
            else:
                seq = line.strip()
                cur_len = len(seq)
                if ( len(buffer) + cur_len == page_size ) :
                    buffer += seq
                    compressed = zlib.compress(bytes(buffer, 'ascii'))
                    insertPage (start, start+page_size, acc, compressed)
                    page_count += 1
                    buffer = ""
                    start += page_size
                elif (len(buffer) + cur_len > page_size ) :
                    remain = page_size - len(buffer)
                    a = seq[:remain]
                    b = seq[remain:]
                    buffer += a
                    compressed = zlib.compress(bytes(buffer, 'ascii'))
                    insertPage (start, start+page_size, acc, compressed)
                    page_count += 1
                    buffer = b
                    start += page_size
                else :
                    buffer += seq
            line_num += 1

        if len(buffer) > 0 :
            compressed = zlib.compress(bytes(buffer, 'ascii'))
            insertPage(start, start+len(buffer), acc, compressed)
            page_count += 1

        print ("Inserted ", page_count, " pages into sequence collection for chromosome", acc)

from os import listdir
files = os.listdir(root)
for file in files :
    processFile(file)