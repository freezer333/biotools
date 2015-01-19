import configparser
config = configparser.ConfigParser()
config.read('seed_sources.ini')

#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client[config['db']['name']]
mrna = db.mrna
from pymongo import version
print(version)
#------------------------------------------------------------

min_tetrads = 3
min_conservation = 0.95
principal = 'Homo sapiens'
comparison = 'Mus musculus'
out_collection = 'g4utr3'

print("=================================================================")
print("Generating g4utr3 collection\n- Hiighly conserved G4 in 3'UTR")
print("=================================================================")
print ("Pipeline parameters")
print("\tTarget organism:             ", principal)
print("\tComparison organism:         ", comparison)
print("\tMinimum # Tetrads in G4:     ", min_tetrads)
print("\tMinimum Conservation Score:  " , min_conservation)
print("=================================================================")
print("Executing aggregation pipeline now... please wait a bit...")
pipeline = [
    {'$match':{'organism' : principal}},
      {'$unwind':'$g4s'},
      {'$match':{'$or' : [{'g4s.isDownstream':True}, {'g4s.is3Prime':True}]}},
      {'$match':{'g4s.tetrads':{'$gte':min_tetrads}}},
      {'$unwind' :'$g4s.conserved'},
      {'$match' : {'g4s.conserved.score.overall' : {'$gte':min_conservation}}},
      {'$match' : {'g4s.conserved.comparison_mrna.organism':comparison}},
      {'$group' : {
               '_id' : '$_id',
               'g4s' : {'$push':'$g4s'},
               'accession' : {'$first': '$accession'},
               'cds' : {'$first': '$cds'},
               'definition' : {'$first': '$definition'},
               'chrom' : {'$first':'$chrom'},
               'gene_id' : {'$first' : '$gene_id'},
               'gene_name':{'$first':'$gene_name'},
               'length' : {'$first':'$length'},
               'organism' : {'$first':'$organism'},
               'start' : {'$first' : '$start'},
               'utr_3' : {'$first' : '$utr_3'},
               'utr_5' : {'$first' : '$utr_5'},
               'orientation' : {'$first' : '$orientation'},
               'exons' : {'$first' : '$exons'},
               'end' : {'$first': '$end'}
              }},
      {'$out' : out_collection}
    ]
mrna.aggregate(pipeline)
print("Aggregation complete.  Results saved to", out_collection)
print("=================================================================")
