import urllib.request
import shutil
import requests
import xlwt

book = xlwt.Workbook()
sheet = book.add_sheet("Sheet")

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)

sheet.write(0, 0, "Accession")
sheet.write(0, 1, "5'-UTR Density")
sheet.write(0, 2, "Length")

i = 1
j = 0
for record in mcursor:
    if j < 25000:
        j = j+1
        continue
    url = 'http://localhost:3000/qgrs/mrna/' + record['accession'] + '/density'
    filter = {'minTetrad' : 3}
    response = requests.get(url, params=filter)
    if response.status_code == requests.codes.ok :
        data = response.json()
        if 'length' in data['density']['utr5']:
            sheet.write(i, 0, record['accession'])
            sheet.write(i, 1, data['density']['utr5']['density'])
            sheet.write(i, 2, data['density']['utr5']['length'])
            i = i+1
    else:
        print("Density of QGRS could not be calculated")
    j =j+1
    print (j)
    if j == 27000:
        break

book.save("fixeddensitylength6.xls")