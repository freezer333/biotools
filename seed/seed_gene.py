
import pymongo
import sys
import os
import urllib.request
import shutil
import gzip
import json

from pymongo import ASCENDING, DESCENDING


#--------------------
# database stuff...
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
gene_collect = db.gene
mrna_collect = db.mrna
#--------------------

from seed_utils import parse_info



base_dir = os.getcwd() + '/external_data/top_level_annotations/'
os.makedirs(base_dir, exist_ok=True)



def purge_organism(organism, build):
    spec = {
        "organism" : organism,
        "build": build
    }
    mrna_collect.remove(spec)
    gene_collect.remove(spec)
    print('\t- Removed existing records for ', organism, ' build # ', build, ' in gene and mrna collections....')


def process_file(file, organism, build):
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
                mapped_info = parse_info(info);


                if 'Dbxref' in mapped_info and 'GeneID' in mapped_info['Dbxref']:
                  gene_id = mapped_info['Dbxref']['GeneID'];
                else :
                  gene_id = mapped_info['Name'];
                num_genes += 1
                genes.add(gene_id)

                chrome = fields[0].split('.')[0]
                name = mapped_info['Name']

                print ("\tInserting gene", chrome, " -> ", gene_id, '(', name, ') from ' , fields[3], ' to ', fields[4])

                record = {
                    "chrom" : chrome,
                    "start" : fields[3],
                    "end" : fields[4],
                    "gene_id" : gene_id,
                    "gene_name" : name,
                    "orientation" : fields[6],
                    "organism" : organism,
                    "build" : build
                }
              #  print(record)
                spec  = {
                    "organism" : organism,
                    "build" : build,
                    "gene_id" : gene_id
                }

                gene_collect.update(spec, record, True)

            if len(fields) > 2 and fields[2] == 'mRNA' and (fields[1] == 'BestRefSeq' or fields[1] == 'RefSeq'):
                if not current_mrna is None:
                    print ("\tInserting mRNA", current_mrna['accession'] , " with " , len(current_mrna['exons']) , " exons")
                  #  print(current_mrna)
                    if len(current_mrna['exons']) < 1 :
                        print ("Failure - can't save", current_mrna['accession'], "without exons!")
                        print(current_mrna['accession'] )
                        print (line)
                        sys.exit(1);

                    spec  = {
                        "organism" : organism,
                        "build" : build,
                        "accession" : current_mrna['accession']
                    }

                    mrna_collect.update(spec, current_mrna, True)
                    current_mrna = None

                info = fields[8];
                mapped_info = parse_info(info);

                if 'gene' in mapped_info and 'Name' in mapped_info:
                  accession_num = mapped_info['Name'];

                  if 'Dbxref' in mapped_info and 'GeneID' in mapped_info['Dbxref']:
                    gene_id = mapped_info['Dbxref']['GeneID'];
                  else :
                    gene_id = mapped_info['gene'];

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
                      "build" : build
                  }
                  mRNA.add(accession_num)
                else :
                  # we aren't going to store the mRNA since it doesn't have a proper name or accession
                  current_mrna = None


            if len(fields) > 2 and fields[2] == 'exon' and (fields[1] == 'BestRefSeq' or fields[1] == 'RefSeq'):
                info = fields[8];

                mapped_info = parse_info(info);
                if 'transcript_id' in mapped_info :
                  accession = mapped_info['transcript_id'];
                  chrome = fields[0].split('.')[0]
                  if current_mrna and current_mrna['accession'] == accession:
                      # print ("Exon for ", accession, " found -> ", fields[3], " - ", fields[4])
                      current_mrna['exons'].append({"start" : fields[3], "end" : fields[4]})



   # print ('\t+ Processed ', num_genes, ' genes')
   # print ('\t+ Processed ', num_mRNA, ' mRNA')

    print ('\t+ Added ', len(genes), ' gene records for ', organism)
    print ('\t+ Added ', len(mRNA), ' mRNA records for ', organism)




if len(sys.argv) > 1 :
  taxon_ids = sys.argv[1:]
else :
  print("You must specify taxon id's of the organism you want to build.")
  print("For example:  '",sys.argv[0]," 9606' would install Homo sapiens")
  print("        and:  '",sys.argv[0]," 9598 9593' would install chimps and gorillas")
  sys.exit(0);



for taxon_id in sorted(taxon_ids) :
  #try :
  with open('seeds/' + taxon_id + ".json") as json_file:
      seed = json.load(json_file)
      organism = seed['organism']
      build = seed['genes']['build']
      print("############################################################")
      print('Processing top-level annotations for ', organism)
      local = base_dir + organism
      if not os.path.isfile(local):
          print('\t  -  Downloading ' , organism, ' from ftp.ncbi.nlm.nih.gov')
          with urllib.request.urlopen(seed['genes']['url']) as response, open(local, 'wb') as out_file:
              shutil.copyfileobj(response, out_file)
      purge_organism(organism, build)
      file = gzip.open(local, 'rb')
      process_file(file, organism, build)
      file.close()
      print("############################################################")
#  except KeyError:
#  print("Genes for", organism, "not supported by the seed file");

gene_collect.create_index([("organism", ASCENDING), ("build", ASCENDING), ("gene_id", ASCENDING)])
mrna_collect.create_index([("organism", ASCENDING), ("build", ASCENDING), ("accession", ASCENDING)])
