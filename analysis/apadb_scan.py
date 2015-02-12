#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client['chrome']
collect = db['mrna']
#------------------------------------------------------------

genes = dict()

with open("Human.apadb.bed", "r") as apa_file:
    for apa in apa_file:
        fields = apa.split('\t')
        symbol_and_count = fields[4]
        symbol = symbol_and_count.split('.')[0].upper();
        if symbol in genes :
            genes[symbol] = genes[symbol] + 1
        else :
            genes[symbol] = 1;

'''
for gene in genes :
    print (gene + "\t=>\t" + str(genes[gene]))

print(str(len(genes)) + " total genes");
'''

genes_in_db = dict()
mcursor = collect.find(spec={'organism':'Homo sapiens'},snapshot=True, timeout=False)
count = 1
for record in mcursor:
    if 'gene_name' in record:
        symbol = record['gene_name'].upper()
        if symbol not in genes_in_db:
            if symbol in genes :
                genes_in_db[symbol] = genes[symbol];
            else: 
                genes_in_db[symbol] = 0
        print(str(count) + "\tProcessed " + record['accession'])
    else:
        print(str(count) + "\tNo gene_name associated with " + record['accession'])
    count += 1
mcursor.close()

with_none = 0;
with_one = 0;
with_n = 0;

for gene in genes_in_db :
    if genes_in_db[gene] == 0:
        with_none += 1
    elif genes_in_db[gene] == 1:
        with_one += 1
    else:
        with_n += 1



in_db = 0
not_in_db = 0
for gene in genes:
    if gene in genes_in_db:
        in_db += 1
    else :
        not_in_db += 1
        print(gene)

print("Scan of all genes complete");
print(str(with_none) + " of " + str(len(genes_in_db)) + " have no records")
print(str(with_one) + " of " + str(len(genes_in_db)) + " have one record")
print(str(with_n) + " of " + str(len(genes_in_db)) + " have more than one records")
print (str(in_db) + " adadb genes are in our db")
print (str(not_in_db) + " adadb genes are NOT in our db")
