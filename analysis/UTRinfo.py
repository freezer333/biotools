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

sheet.write(0, 0, "5' UTR Length")
sheet.write(0, 1, "Number of mRNA")
sheet.write(0, 2, "Number of g4s >= 17")
sheet.write(0, 3, "Number of g4s >= 19")
sheet.write(0, 4, "Number of g4s >= 20")
sheet.write(0, 5, "Number of g4s >= 22")

sheet.write(0, 6, "Mean of g4s (17)")
sheet.write(0, 7, "Min g4s (17)")
sheet.write(0, 8, "Max g4s (17)")

sheet.write(0, 10, "g4s")
sheet.write(0, 11, "Number of qgrs with this score")

lenlist = [0] * 900000
g4_17 = [0] * 900000
g4_19 = [0] * 900000
g4_20 = [0] * 900000
g4_22 = [0] * 900000
g4lenscore = [0] * 900000
g4lenmaxscore = [0] * 900000
g4lenminscore = [101] * 900000
g4list = [0] * 101

for record in mcursor:
    if 'utr_3' in record:
        try:
            end = int(record['utr_3']['end'])
            start = int(record['utr_3']['start'])
        except ValueError:
            continue
        utr_len = end-start
        lenlist[utr_len] = lenlist[utr_len] + 1

        if 'g4s' in record:
            for g4 in record['g4s']:
                if g4['is3Prime']:
                    gscore = int(g4['gscore'])
                    if gscore >= 17:
                        g4list[gscore] = g4list[gscore] + 1
                        g4_17[utr_len] = g4_17[utr_len] + 1
                        if gscore >= 19:
                            g4_19[utr_len] = g4_19[utr_len] + 1
                            if gscore >= 20:
                                g4_20[utr_len] = g4_20[utr_len] + 1
                                if gscore >= 22:
                                    g4_20[utr_len] = g4_20[utr_len] + 1
                        g4lenscore[utr_len] = g4lenscore[utr_len] + gscore
                        if g4lenminscore[utr_len] > gscore:
                            g4lenminscore[utr_len] = gscore
                        if g4lenmaxscore[utr_len] < gscore:
                            g4lenmaxscore[utr_len] = gscore


i = 0
j = 0
lensequence = iter(lenlist)
next(lensequence)
for item in lensequence:
    i = i + 1
    if item == 0:
        continue
    j = j + 1
    sheet.write(j, 0, i)
    sheet.write(j, 1, item)
    sheet.write(j, 2, g4_17[i])
    sheet.write(j, 3, g4_19[i])
    sheet.write(j, 4, g4_20[i])
    sheet.write(j, 5, g4_22[i])
    if g4_17[i] != 0:
        avg = g4lenscore[i] / g4_17[i]
        sheet.write(j, 6, avg)
        sheet.write(j, 7, g4lenminscore[i])
        sheet.write(j, 8, g4lenmaxscore[i])

i = 0
for score in g4list:
    if i == 0:
        i = i + 1
        continue
    sheet.write(i, 10, i)
    sheet.write(i, 11, score)
    i = i + 1


book.save("3PrimeInfo.xls")