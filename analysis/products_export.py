
from pymongo import MongoClient
client = MongoClient()
db = client['chrome']
collect = db['mrna']

results = db.mrna.aggregate(
 [{'$match': {'organism':'Homo sapiens'}},
  {'$group': { '_id':'$gene_id', 'products' : { '$sum':1}, 'transcript' : {'$push' : '$accession'}, 'cds' : {'$push':'$cds'}}},
  {'$match' :{'products': {'$gt': 1}}}]);

for result in results:
  print(result)
  for cds in result['cds']:
    print (result['_id'], '\t', result['products'], "\t", cds['start'], '\t', cds['end'])
