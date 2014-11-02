

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

count = 0
total = 0
mcursor = collect.find(spec={'u_rich_downstream' : {'$exists':True} },snapshot=True)
for record in mcursor:
    accession = record['accession']
    u_rich_count = len(record['u_rich_downstream'])
    total += u_rich_count
    count += 1
    print(accession, " has ", u_rich_count, " U-rich elements downstream of poly(A) site")

print(count, ' total mRNA with U-rich analysis, yielding on average ', total / count, ' U-rich elements')