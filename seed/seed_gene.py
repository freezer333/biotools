
import pymongo
import sys
import os
import urllib.request
import shutil
import gzip

from pymongo import ASCENDING, DESCENDING


#--------------------
# database stuff...
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
gene_collect = db.gene
mrna_collect = db.mrna
#--------------------


organisms = dict()

organisms['Homo sapiens'] = dict()
organisms['Homo sapiens']['url'] = 'ftp://ftp.ncbi.nlm.nih.gov/genomes/H_sapiens/GFF/ref_GRCh38_top_level.gff3.gz'
organisms['Homo sapiens']['build'] = 38


organisms['Mus musculus'] = dict()
organisms['Mus musculus']['url'] = 'ftp://ftp.ncbi.nlm.nih.gov/genomes/Mus_musculus/GFF/ref_GRCm38.p2_top_level.gff3.gz'
organisms['Mus musculus']['build'] = 38


base_dir = os.getcwd() + '/external_data/top_level_annotations/'
os.makedirs(base_dir, exist_ok=True)


gene_collect.create_index([("organism", ASCENDING), ("build", ASCENDING), ("gene_id", ASCENDING)])
mrna_collect.create_index([("organism", ASCENDING), ("build", ASCENDING), ("accession", ASCENDING)])


def purge_organism(organism):
    spec = {
        "organism" : organism, 
        "build": organisms[organism]['build']
    }
    mrna_collect.remove(spec)
    gene_collect.remove(spec)
    print('\t- Removed existing records for ', organism, ' build # ', organisms[organism]['build'], ' in gene and mrna collections....')
    

def process_file(file, organism):
    num_genes = 0;
    num_mRNA = 0;
    current_mrna = None

    mRNA = set()
    genes = set()

    for data in file:
        line = data.decode('utf-8')
        if not line.startswith("##") :
            fields = line.split('\t')
                
            if len(fields) > 2 and fields[2] == 'gene' and (fields[1] == 'BestRefSeq' or fields[1] == 'RefSeq'):
                info = fields[8];
                info_fields = info.split(';');
                num_genes += 1
                genes.add(info_fields[0])

                index = info.find('GeneID:')
                index2 = info.find(',', index)
                index3 = info.find(';', index)
                index_end = index3
                if index2 < index3 :
                    index_end = index2
                gene_id = info[index+7:index_end]
                if gene_id.find(';') >= 0:
                    gene_id = gene_id.split(';')[0]
                # record name, gene id, chromosome, start, end

                chrome = fields[0].split('.')[0]
                name = info_fields[1].split('=')[1]
               # print ("\tInserting gene", chrome, " -> ", gene_id, '(', name, ') from ' , fields[3], ' to ', fields[4])

                record = {
                    "chrom" : chrome, 
                    "start" : fields[3],
                    "end" : fields[4], 
                    "gene_id" : gene_id, 
                    "gene_name" : name, 
                    "orientation" : fields[6], 
                    "organism" : organism, 
                    "build" : organisms[organism]['build']
                }
                spec  = {
                    "organism" : organism, 
                    "build" : organisms[organism]['build'],
                    "gene_id" : gene_id
                }

                gene_collect.update(spec, record, True)

            if len(fields) > 2 and fields[2] == 'mRNA' and (fields[1] == 'BestRefSeq' or fields[1] == 'RefSeq'):
                if not current_mrna is None:
                   # print ("\tInserting mRNA", current_mrna['accession'] , " with " , len(current_mrna['exons']) , " exons")
                    if len(current_mrna['exons']) < 1 :
                        print ("Failure - can't save an mRNA without exons!")

                    spec  = {
                        "organism" : organism, 
                        "build" : organisms[organism]['build'],
                        "accession" : current_mrna['accession']
                    }

                    mrna_collect.update(spec, current_mrna, True)
                    current_mrna = None

                info = fields[8];
                info_fields = info.split(';');
                num_mRNA += 1
                mRNA.add(info_fields[1].split('=')[1])

                accession_num = info_fields[1].split('=')[1]
                #Dbxref=GeneID:79501,Genbank:NM_001005484.1,HGNC:14825,HPRD:14974
                index = info.find('GeneID:')
                index2 = info.find(',', index)
                index3 = info.find(';', index)
                index_end = index3
                if index2 < index3 :
                    index_end = index2
                gene_id = info[index+7:index_end]
                if gene_id.find(';') >= 0:
                    gene_id = gene_id.split(';')[0]
                # name (accession), gene id, chromosome, start, end

                chrome = fields[0].split('.')[0]
                    
                current_mrna = {
                    "chrom" : chrome, 
                    "start" : fields[3],
                    "end" : fields[4], 
                    "gene_id" : gene_id, 
                    "accession" : accession_num,
                    "orientation" : fields[6],
                    "exons" : list(), 
                    "organism" : organism, 
                    "build" : organisms[organism]['build']
                }

                    
            if len(fields) > 2 and fields[2] == 'exon' and (fields[1] == 'BestRefSeq' or fields[1] == 'RefSeq'):
                info = fields[8];
                info_fields = info.split(';');
                #Dbxref=GeneID:79501,Genbank:NM_001005484.1,HGNC:14825,HPRD:14974
                index = info.find('Genbank:')
                index2 = info.find(',', index)
                index3 = info.find(';', index)
                index_end = index3
                if index2 < index3 :
                    index_end = index2
                accession = info[index+8:index_end]
                if accession.find(';') >= 0:
                    accession = accession.split(';')[0]
                # name (accession), gene id, chromosome, start, end

                chrome = fields[0].split('.')[0]
                if current_mrna and current_mrna['accession'] == accession:
                    # print ("Exon for ", accession, " found -> ", fields[3], " - ", fields[4])
                    current_mrna['exons'].append({"start" : fields[3], "end" : fields[4]})
                    

   # print ('\t+ Processed ', num_genes, ' genes')
   # print ('\t+ Processed ', num_mRNA, ' mRNA')

    print ('\t+ Added ', len(genes), ' gene records for ', organism)
    print ('\t+ Added ', len(mRNA), ' mRNA records for ', organism)



for organism in sorted(organisms) :
    print("############################################################")
    print('Processing top-level annotations for ', organism)
    local = base_dir + organism
    if not os.path.isfile(local):
        print('\t  -  Downloading ' , organism, ' from ftp.ncbi.nlm.nih.gov')
        with urllib.request.urlopen(organisms[organism]['url']) as response, open(local, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
    
    purge_organism(organism)
    file = gzip.open(local, 'rb')
    process_file(file, organism)
    file.close()
    print("############################################################")