
import pymongo
import sys
#--------------------
# database stuff...
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
gene_collect = db.gene
mrna_collect = db.mrna
#--------------------


file = '/Users/sfrees/projects/bio-data/top_level'
num_genes = 0;
num_mRNA = 0;
current_mrna = None

mRNA = set()
genes = set()
with open(file) as f:
        for line in f:
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
                    print (chrome, " -> ", gene_id, '(', name, ') from ' , fields[3], ' to ', fields[4])

                    record = {
                        "chrom" : chrome, 
                        "start" : fields[3],
                        "end" : fields[4], 
                        "gene_id" : gene_id, 
                        "gene_name" : name, 
                        "orientation" : fields[6]
                    }

                    gene_collect.insert(record)

                if len(fields) > 2 and fields[2] == 'mRNA' and (fields[1] == 'BestRefSeq' or fields[1] == 'RefSeq'):
                    if not current_mrna is None:
                        print ("Inserting ", current_mrna['accession'] , " with " , len(current_mrna['exons']) , " exons")
                        if len(current_mrna['exons']) < 1 :
                            print ("Failure - can't save an mRNA without exons!")
                        mrna_collect.insert(current_mrna)

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
                        "exons" : list()
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
                    

print ('Processed ', num_genes, ' genes')
print ('Processed ', num_mRNA, ' mRNA')

print ('Processed ', len(genes), ' unique genes')
print ('Processed ', len(mRNA), ' unique mRNA')