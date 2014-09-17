import zlib
import binascii
import pymongo
import os
import urllib.request
import shutil
import gzip

#--------------------
# database stuff...
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
seq_collect = db.seq
#--------------------

page_size = 10000
root = os.getcwd() + '/external_data/chromosome_data/'
os.makedirs(root, exist_ok=True)

organisms = dict()
builds = dict()

human = dict()
base = 'ftp://ftp.ncbi.nlm.nih.gov/genbank/genomes/Eukaryotes/vertebrates_mammals/Homo_sapiens/GRCh38/Primary_Assembly/assembled_chromosomes/FASTA/'
human['NC_000001'] = base + 'chr1.fa.gz'
human['NC_000002'] = base + 'chr2.fa.gz'
human['NC_000003'] = base + 'chr3.fa.gz'
human['NC_000004'] = base + 'chr4.fa.gz'
human['NC_000005'] = base + 'chr5.fa.gz'
human['NC_000006'] = base + 'chr6.fa.gz'
human['NC_000007'] = base + 'chr7.fa.gz'
human['NC_000008'] = base + 'chr8.fa.gz'
human['NC_000009'] = base + 'chr9.fa.gz'
human['NC_000010'] = base + 'chr10.fa.gz'
human['NC_000011'] = base + 'chr11.fa.gz'
human['NC_000012'] = base + 'chr12.fa.gz'
human['NC_000013'] = base + 'chr13.fa.gz'
human['NC_000014'] = base + 'chr14.fa.gz'
human['NC_000015'] = base + 'chr15.fa.gz'
human['NC_000016'] = base + 'chr16.fa.gz'
human['NC_000017'] = base + 'chr17.fa.gz'
human['NC_000018'] = base + 'chr18.fa.gz'
human['NC_000019'] = base + 'chr19.fa.gz'
human['NC_000020'] = base + 'chr20.fa.gz'
human['NC_000021'] = base + 'chr21.fa.gz'
human['NC_000022'] = base + 'chr22.fa.gz'
human['NC_000023'] = base + 'chrX.fa.gz'
human['NC_000024'] = base + 'chrY.fa.gz'
organisms['Homo sapiens'] = human
builds['Homo sapiens'] = 38

mouse = dict()
base = 'ftp://ftp.ncbi.nlm.nih.gov/genbank/genomes/Eukaryotes/vertebrates_mammals/Mus_musculus/GRCm38/Primary_Assembly/assembled_chromosomes/FASTA/'
mouse['NC_000067'] = base + 'chr1.fa.gz'
mouse['NC_000068'] = base + 'chr2.fa.gz'
mouse['NC_000069'] = base + 'chr3.fa.gz'
mouse['NC_000070'] = base + 'chr4.fa.gz'
mouse['NC_000071'] = base + 'chr5.fa.gz'
mouse['NC_000072'] = base + 'chr6.fa.gz'
mouse['NC_000073'] = base + 'chr7.fa.gz'
mouse['NC_000074'] = base + 'chr8.fa.gz'
mouse['NC_000075'] = base + 'chr9.fa.gz'
mouse['NC_000076'] = base + 'chr10.fa.gz'
mouse['NC_000077'] = base + 'chr11.fa.gz'
mouse['NC_000078'] = base + 'chr12.fa.gz'
mouse['NC_000079'] = base + 'chr13.fa.gz'
mouse['NC_000080'] = base + 'chr14.fa.gz'
mouse['NC_000081'] = base + 'chr15.fa.gz'
mouse['NC_000082'] = base + 'chr16.fa.gz'
mouse['NC_000083'] = base + 'chr17.fa.gz'
mouse['NC_000084'] = base + 'chr18.fa.gz'
mouse['NC_000085'] = base + 'chr19.fa.gz'
mouse['NC_000086'] = base + 'chrX.fa.gz'
mouse['NC_000087'] = base + 'chrY.fa.gz'
organisms['Mus musculus'] = mouse
builds['Mus musculus'] = 38

def insertPage(organism, start, end, accession, seq):
    record = {
        "accession" : accession, 
        "start" : start,
        "end" : end, 
        "seq" : seq,
        "organism" : organism, 
        "build": builds[organism]
    }

    seq_collect.insert(record)

def purge(organism, accession) :
    spec = {
        "accession" : accession, 
        "organism" : organism, 
        "build": builds[organism]
    }
    retval = seq_collect.remove(spec)
    if not retval is None:
        print ("\t  -  Removed ", retval['n'], " existing pages for ", organism, " - " , accession, " build # ", builds[organism])


def processFile(organism, accession, file):
    line_num = 0
    start = 0
    buffer = ""
    page_count = 0
    acc = accession
    
    for data in file:
        line = data.decode('utf-8')
        if line_num > 0:
            seq = line.strip()
            cur_len = len(seq)
            if ( len(buffer) + cur_len == page_size ) :
                buffer += seq
                compressed = zlib.compress(bytes(buffer, 'ascii'))
                insertPage (organism, start, start+page_size, acc, compressed)
                page_count += 1
                buffer = ""
                start += page_size
            elif (len(buffer) + cur_len > page_size ) :
                remain = page_size - len(buffer)
                a = seq[:remain]
                b = seq[remain:]
                buffer += a
                compressed = zlib.compress(bytes(buffer, 'ascii'))
                insertPage (organism, start, start+page_size, acc, compressed)
                page_count += 1
                buffer = b
                start += page_size
            else :
                buffer += seq
        line_num += 1

    if len(buffer) > 0 :
        compressed = zlib.compress(bytes(buffer, 'ascii'))
        insertPage(organism, start, start+len(buffer), acc, compressed)
        page_count += 1

    print ("\t  +  Inserted ", page_count, " pages into sequence collection for chromosome", acc)




for organism in sorted(organisms) :
    print ("#####################################")
    print ('Building ' , organism, ' - build # ', builds[organism])
    folder = root + organism
    if not os.path.exists(folder):
        print ('Creating folder for ' , organism)
        os.makedirs(folder, exist_ok=True)
    for chromosome in sorted(organisms[organism]):
        local = folder + "/" + chromosome + '.fa.gz'
        print (" -  Processing Chromosome " , chromosome)
        if not os.path.isfile(local):
            print('\t  -  Downloading ' , chromosome, ' from ftp.ncbi.nlm.nih.gov')
            with urllib.request.urlopen(organisms[organism][chromosome]) as response, open(local, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
    
        purge(organism, chromosome)
        file = gzip.open(local, 'rb')
        processFile(organism, chromosome, file)
        file.close()
    print ("#####################################")
    print ("Chromosome data for ", organism, " built successfully")