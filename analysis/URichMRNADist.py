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

mcursor = collect.find({'organism':'Homo sapiens'})


TotalConsmRNA = {}
RegionConsmRNA = {}

ConsGene = {}
RegionConsGene = {}

TotalmRNA = {}
TotalGene = {}

REGION_START = 22
REGION_END = 33


for record in mcursor:
	gene = record["gene_id"]
	if record["gene_id"] in TotalGene:
		TotalGene[gene] += 1
	else:
		TotalGene[gene] = 1
	for mrna in record["mrna"]:
		if mrna in TotalmRNA:
			TotalmRNA[mrna] += 1
		else:
			TotalmRNA[mrna] = 1
	for URS in record["URS"]:
		pos = URS["downstream_rel_pos"]
		if "conserved" in URS:
			gene = record["gene_id"]
			if record["gene_id"] in ConsGene:
				ConsGene[gene] += 1
			else:
				ConsGene[gene] = 1
			for mrna in record["mrna"]:
				if mrna in TotalConsmRNA:
					TotalConsmRNA[mrna] += 1
				else:
					TotalConsmRNA[mrna] = 1
			break
	for URS in record["URS"]:
		pos = URS["downstream_rel_pos"]
		if "conserved" in URS:
			if pos <= REGION_END and pos >= REGION_START:
				gene = record["gene_id"]
				if record["gene_id"] in RegionConsGene:
					RegionConsGene[gene] += 1
				else:
					RegionConsGene[gene] = 1
				for mrna in record["mrna"]:
					if mrna in RegionConsmRNA:
						RegionConsmRNA[mrna] += 1
					else:
						RegionConsmRNA[mrna] = 1
				break
print ("Total mRNA w/ Cons URS : " + str(len(TotalConsmRNA)))
print ("mRNA w/ Cons URS in Region (" + str(REGION_START) + "-"+ str(REGION_END) + ") nt : "+ str(len(RegionConsmRNA)))
print ("Total genes w/ Cons URS : " + str(len(ConsGene)))
print ("genes w/ Cons URS in Region (" + str(REGION_START) + "-"+ str(REGION_END) + ") nt : "+ str(len(RegionConsGene)))
print ("Total mRNA we have polyA data for: " + str(len(TotalmRNA)))
print ("Total genes we have polyA data for: " + str(len(TotalGene)))