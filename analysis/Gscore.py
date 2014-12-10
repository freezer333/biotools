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

dir1 = {}

for record in mcursor:
    url = 'http://localhost:3000/qgrs/mrna/' + record['accession'] + '/density'
    filter = {'minGScore' : 17}
    response = requests.get(url, params=filter)
    if response.status_code == requests.codes.ok :
        print(record['accession'])
    else:
        print("Error")

i = 0

for item in dir1:
    if dir1 != 0 :
        sheet.write(i, 0, record['accession'])
        sheet.write(i, 0, record['accession'])
        i = i + 1


book.save("UTR5lengths.xls")