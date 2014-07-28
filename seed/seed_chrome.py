import zlib
import binascii
import pymongo

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
seq_collect = db.seq

page_size = 10000
line_num = 0
start = 0
buffer = ""
page_count = 0


def insertPage(start, end, meta, seq):
    record = {
        "accession" : meta, 
        "start" : start,
        "end" : end, 
        "seq" : seq
    }

    seq_collect.insert(record)
    






with open("../chromosomes_sequence_data/chr9.fa/chr9.fa") as f:
    for line in f:
        if line_num == 0:
            fields =  line.split("|")
            print ("Proccessing Chromosome " , fields[3])
        else:
            seq = line.strip()
            cur_len = len(seq)
            if ( len(buffer) + cur_len == page_size ) :
                buffer += seq
                compressed = zlib.compress(bytes(buffer, 'ascii'))
                insertPage (start, start+page_size, fields[3], compressed)
                page_count += 1
                #print binascii.hexlify(compressed)
                #print len(buffer)
                buffer = ""
                start += page_size

            elif (len(buffer) + cur_len > page_size ) :
                remain = page_size - len(buffer)
                a = seq[:remain]
                b = seq[remain:]
                buffer += a
                compressed = zlib.compress(bytes(buffer, 'ascii'))
                insertPage (start, start+page_size, fields[3], compressed)
                page_count += 1
                #print binascii.hexlify(compressed)
                #print len(buffer)
                buffer = b
                start += page_size
            else :
                buffer += seq
        line_num += 1

    if len(buffer) > 0 :
        compressed = zlib.compress(bytes(buffer, 'ascii'))
        insertPage(start, start+len(buffer), fields[3], compressed)
        page_count += 1

    print ("Inserted ", page_count, " pages into sequence collection for chromosome", fields[3])