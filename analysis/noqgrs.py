

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

#db.mrna.find({$and : [{'organism':'Homo sapiens'}, {'g4s':{$size:0}}]}, {'accession':1, 'gene_name':1}).count()
spec = {'$and':[{'organism':'Homo sapiens'}, {'g4s':{'$size':0}}]}
mcursor = collect.find(spec=spec,snapshot=True, timeout=False)
count = 0
#process_mrna(mcursor[0])
for record in mcursor:
    print(record['accession'], "\t", record['gene_name'])
    count += 1
mcursor.close()
print(count)

