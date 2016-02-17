import urllib.request
import shutil
import requests
import xlsxwriter
import random
import re

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.polyA

book = xlsxwriter.Workbook("Urich_Distrib.xlsx")
sheet = book.add_worksheet("No homology")
sheet2 = book.add_worksheet("Homology Filter")
sheet3 = book.add_worksheet("Strong Conserved")

MAX_SEARCH_LENGTH = 200+1
ulist = [0]*MAX_SEARCH_LENGTH
alist = [0]*MAX_SEARCH_LENGTH
clist = [0]*MAX_SEARCH_LENGTH
glist = [0]*MAX_SEARCH_LENGTH
ulistcon = [0]*MAX_SEARCH_LENGTH
alistcon = [0]*MAX_SEARCH_LENGTH
clistcon = [0]*MAX_SEARCH_LENGTH
glistcon = [0]*MAX_SEARCH_LENGTH
ulistcon5u = [0]*MAX_SEARCH_LENGTH
alistcon5u = [0]*MAX_SEARCH_LENGTH
clistcon5u = [0]*MAX_SEARCH_LENGTH
glistcon5u = [0]*MAX_SEARCH_LENGTH

mcursor = collect.find({'organism':'Homo sapiens'})

sheet.write(0, 0, "Downstream")
sheet.write(0, 1, "Human")
sheet.write(1, 0, "URS Pos")
sheet.write(1, 1, "# of URS")
sheet.write(1, 2, "# of ARS")
sheet.write(1, 3, "# of CRS")
sheet.write(1, 4, "# of GRS")
sheet2.write(0, 0, "Downstream")
sheet2.write(0, 1, "Human")
sheet2.write(1, 0, "URS Pos")
sheet2.write(1, 1, "# of URS")
sheet2.write(1, 2, "# of ARS")
sheet2.write(1, 3, "# of CRS")
sheet2.write(1, 4, "# of GRS")
sheet3.write(0, 0, "Downstream")
sheet3.write(0, 1, "Human")
sheet3.write(1, 0, "URS Pos")
sheet3.write(1, 1, "# of URS")
sheet3.write(1, 2, "# of ARS")
sheet3.write(1, 3, "# of CRS")
sheet3.write(1, 4, "# of GRS")

for record in mcursor:
	for URS in record["URS"]:
		pos = URS["downstream_rel_pos"]
		if pos < MAX_SEARCH_LENGTH:
			ulist[pos] = ulist[pos]+1
			if "conserved" in URS:
				ulistcon[pos] = ulistcon[pos]+1
				if URS["order"] == 5:
					ulistcon5u[pos] = ulistcon5u[pos]+1
	for URS in record["ARS"]:
		pos = URS["downstream_rel_pos"]
		if pos < MAX_SEARCH_LENGTH:
			alist[pos] = alist[pos]+1
			if "conserved" in URS:
				alistcon[pos] = alistcon[pos]+1
				if URS["order"] == 5:
					alistcon5u[pos] = alistcon5u[pos]+1
	for URS in record["CRS"]:
		pos = URS["downstream_rel_pos"]
		if pos < MAX_SEARCH_LENGTH:
			clist[pos] = clist[pos]+1
			if "conserved" in URS:
				clistcon[pos] = clistcon[pos]+1
				if URS["order"] == 5:
					clistcon5u[pos] = clistcon5u[pos]+1
	for URS in record["GRS"]:
		pos = URS["downstream_rel_pos"]
		if pos < MAX_SEARCH_LENGTH:
			glist[pos] = glist[pos]+1
			if "conserved" in URS:
				glistcon[pos] = glistcon[pos]+1
				if URS["order"] == 5:
					glistcon5u[pos] = glistcon5u[pos]+1

for x in range(1, MAX_SEARCH_LENGTH):
	sheet.write(1+x,0, x)
	sheet.write(1+x,1, ulist[x])
	sheet.write(1+x,2, alist[x])
	sheet.write(1+x,3, clist[x])
	sheet.write(1+x,4, glist[x])
	sheet2.write(1+x,0, x)
	sheet2.write(1+x,1, ulistcon[x])
	sheet2.write(1+x,2, alistcon[x])
	sheet2.write(1+x,3, clistcon[x])
	sheet2.write(1+x,4, glistcon[x])
	sheet3.write(1+x,0, x)
	sheet3.write(1+x,1, ulistcon5u[x])
	sheet3.write(1+x,2, alistcon5u[x])
	sheet3.write(1+x,3, clistcon5u[x])
	sheet3.write(1+x,4, glistcon5u[x])


book.close()
