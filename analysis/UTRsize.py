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

sheet.write(0, 0, "Length")
sheet.write(0, 1, "Number of 5'-UTRs")

list1 = [0] * 6000

for record in mcursor:
    url = 'http://localhost:3000/qgrs/mrna/' + record['accession'] + '/density'
    filter = {}
    response = requests.get(url, params=filter)
    if response.status_code == requests.codes.ok :
        data = response.json()
        if 'length' in data['density']['utr5']:
            list1[data['density']['utr5']['length']] = list1[data['density']['utr5']['length']] + 1
    else:
        print("Error")

i = 1

for item in list1:
    if list1 != 0 :
        sheet.write(i, 0, item)
        sheet.write(i, 1, record['accession'])
        i = i + 1


book.save("UTR5lengths.xls")