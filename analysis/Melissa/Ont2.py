# Run this after running Ontologies.py for an Ontology term distribution
import urllib.request
import shutil
import requests
import xlwt
import mmap
from operator import itemgetter

#global variables
cols = 5 # number of columns reserved for each section in the table
compnum = 0
funcnum = 1
procnum = 2

# add new colour to palette and set RGB colour value
book = xlwt.Workbook()
sheet = book.add_sheet("Sheet")

xlwt.add_palette_colour("top5", 0x21)
xlwt.add_palette_colour("top25", 0x3a)
xlwt.add_palette_colour("bot25", 0x38)
xlwt.add_palette_colour("bot5", 0x2e)
book.set_colour_RGB(0x21, 250, 176, 176)
book.set_colour_RGB(0x3a, 250, 234, 176)
book.set_colour_RGB(0x38, 194, 224, 194)
book.set_colour_RGB(0x2e, 197, 223, 243)

top5s = xlwt.easyxf('pattern: pattern solid, fore_colour top5')
top25s = xlwt.easyxf('pattern: pattern solid, fore_colour top25')
bot25s = xlwt.easyxf('pattern: pattern solid, fore_colour bot25')
bot5s = xlwt.easyxf('pattern: pattern solid, fore_colour bot5')
mids = xlwt.easyxf('pattern: pattern solid, fore_colour white')

minHits = int(input('Minimum mRNA cutoff for listed Ontologies (e.g. 50): '))

### START function definitions ###

def printtitle( str, num ):
    sheet.write(0, 0 + num * cols, "Term (" + str + ")")
    sheet.write(0, 1 + num * cols, "Number with QGRS")
    sheet.write(0, 2 + num * cols, "Total mRNA with term")
    sheet.write(0, 3 + num * cols, "Percent with QGRS")
    return

def addTerms( type, dic, ontNum, isQGRS ):
    #if QGRS is in this mRNA...
    #add 1 to "Number with QGRS" and "Total mRNA with term" for each associated term
    addNum = 0
    if isQGRS:
        addNum = 1
    else:
        addnum = 0
    for item in record['ontology'][type]:
        if item in dic:
            dic[item] = [dic[item][0]+addNum,dic[item][1]+1]
        else:
            dic[item] = [addNum,1] # add ontology term to dicitonary
            ontNum[0] = ontNum[0] + 1 # add 1 to ontology list

def printinfo( dic, num ):
    # print the term, # with QGRS, and total for all terms
    dicNum = 0
    for name in dic:
        # add percent column
        dic[name] = [dic[name][0],dic[name][1],dic[name][0]/dic[name][1]]
        # count total in dictionary
        if dic[name][1] >= minHits:
            dicNum = dicNum + 1

    in5 = round(dicNum*0.05)
    in25 = round(dicNum*0.25)
    
    i = 1
    for name in sorted(dic, key=lambda name: dic[name][2], reverse=True):
        if dic[name][1] < minHits:
            continue
        if i <= in5:
            style = top5s
        elif i <= in25:
            style = top25s
        elif i > dicNum - in5:
            style = bot5s
        elif i > dicNum - in25:
            style = bot25s
        else:
            style = mids
    
        sheet.write(i, 0 + num * cols, name, style)
        sheet.write(i, 1 + num * cols, dic[name][0], style)
        sheet.write(i, 2 + num * cols, dic[name][1], style)
        sheet.write(i, 3 + num * cols, dic[name][2], style)
        i = i + 1

### END function definitions ###

yesfile = open('genelist.txt', 'r')
nofile = open('notgenelist.txt', 'r')

printtitle("Components", compnum)
printtitle("Functions", funcnum)
printtitle("Processes", procnum)

comp = {}
func = {}
proc = {}
ontNum = [0]

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)

yessearch = mmap.mmap(yesfile.fileno(), 0, access=mmap.ACCESS_READ)
nosearch = mmap.mmap(nofile.fileno(), 0, access=mmap.ACCESS_READ)

for record in mcursor:
    if 'ontology' in record:
        #search for accession in file listing mRNA with QGRS
        if yessearch.find(str.encode(record['accession'])) != -1:
            addTerms('components',comp, ontNum, True)
            addTerms('functions',func, ontNum, True)
            addTerms('processes',proc, ontNum, True)
        #search for accession in file listing mRNA withOUT QGRS
        elif nosearch.find(str.encode(record['accession'])) != -1:
            addTerms('components',comp, ontNum, False)
            addTerms('functions',func, ontNum, False)
            addTerms('processes',proc, ontNum, False)
        else:
            continue

print("Number of Ontologies: ")
print(ontNum)

printinfo(comp, compnum)
printinfo(func, funcnum)
printinfo(proc, procnum)

nofile.close()
yesfile.close()

book.save("OntologyInfo.xls")