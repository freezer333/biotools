# Run this after running Ontologies.py for an Ontology term distribution
import urllib.request
import shutil
import requests
import xlwt
import mmap

#global variables
cols = 5 # number of columns reserved for each section in the table
compnum = 0
funcnum = 1
procnum = 2

### START function definitions ###

def printtitle( str, num ):
    sheet.write(0, 0 + num * cols, "Term (" + str + ")")
    sheet.write(0, 1 + num * cols, "Number with QGRS")
    sheet.write(0, 2 + num * cols, "Total mRNA with term")
    return

def found( type, dic ):
    #if QGRS is in this mRNA...
    #add 1 to "Number with QGRS" and "Total mRNA with term" for each associated term
    for item in record['ontology'][type]:
        if item in dic:
            dic[item] = [dic[item][0]+1,dic[item][1]+1]
        else:
            dic[item] = [1,1]

def notfound( type, dic ):
    #if QGRS is NOT in this mRNA...
    #only add 1 to "Total mRNA with term" for each associated term
    for item in record['ontology'][type]:
        if item in dic:
            dic[item] = [dic[item][0],dic[item][1]+1]
        else:
            dic[item] = [0,1]

def printinfo( dic, num ):
    # print the term, # with QGRS, and total for all terms
    i = 1
    for key in dic:
        if dic[key][1] < 50:
            continue
        sheet.write(i, 0 + num * cols, key)
        sheet.write(i, 1 + num * cols, dic[key][0])
        sheet.write(i, 2 + num * cols, dic[key][1])
        i = i + 1

### END function definitions ###

yesfile = open('genelist.txt', 'r')
nofile = open('notgenelist.txt', 'r')

book = xlwt.Workbook()
sheet = book.add_sheet("Sheet")

printtitle("Components", compnum)
printtitle("Functions", funcnum)
printtitle("Processes", procnum)

comp = {}
func = {}
proc = {}

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)

yessearch = mmap.mmap(yesfile.fileno(), 0, access=mmap.ACCESS_READ)
nosearch = mmap.mmap(nofile.fileno(), 0, access=mmap.ACCESS_READ)

for record in mcursor:
    if 'ontology' in record and 'nucleus' in record['ontology']['components']:
        #search for accession in file listing mRNA with QGRS
        if yessearch.find(str.encode(record['accession'])) != -1:
            found('components',comp)
            found('functions',func)
            found('processes',proc)
        #search for accession in file listing mRNA withOUT QGRS
        elif nosearch.find(str.encode(record['accession'])) != -1:
            notfound('components',comp)
            notfound('functions',func)
            notfound('processes',proc)
        else:
            continue

printinfo(comp, compnum)
printinfo(func, funcnum)
printinfo(proc, procnum)

nofile.close()
yesfile.close()

book.save("OntologyInfo.xls")