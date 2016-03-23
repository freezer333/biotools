import urllib.request
import shutil
import requests
import xlsxwriter
import random
import re

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
polyA = db.polyA

############################
class Nrich:
	def __init__ (self, location, nrichness, sequence):
		self.loc = location
		self.nrich = nrichness
		self.seq = sequence
def UCons(n,m):
	CONST_EXTENDURS = 15
	CONST_34 = .1
	CONST_35 = .5
	CONST_45 = .75
	score = 0
	diff = abs(n.loc-m.loc)
	if diff >= CONST_EXTENDURS:
		return 0
	else:
		overlap = (CONST_EXTENDURS-diff)/CONST_EXTENDURS
	#uDiff = abs(n.urich-m.urich)
	if overlap > 1:
		print("wtf\n")
	nDiff = 0
	if n.nrich == 3:
		if m.nrich == 3:
			nDiff = 0
		elif m.nrich == 4:
			nDiff = CONST_34
		elif m.nrich == 5:
			nDiff = CONST_35
	elif n.nrich == 4:
		if m.nrich == 3:
			nDiff = CONST_34
		elif m.nrich == 4:
			nDiff = 1
		elif m.nrich == 5:
			nDiff = CONST_45
	elif n.nrich == 5:
		if m.nrich == 3:
			nDiff = CONST_35
		elif m.nrich == 4:
			nDiff = CONST_45
		elif m.nrich == 5:
			nDiff = 1
	else:
		nDiff = 0
	score = .5*overlap + .5*nDiff
	return score 


############################

log = open('nrich_distrib_homology_log.txt', 'w')

MAX_SEARCH_LENGTH = 200+1
ulist = [0]*MAX_SEARCH_LENGTH
alist = [0]*MAX_SEARCH_LENGTH
clist = [0]*MAX_SEARCH_LENGTH
glist = [0]*MAX_SEARCH_LENGTH

mcursor = collect.find({'organism':'Homo sapiens'}, no_cursor_timeout = True)
############
#DOWNSTREAM#
############

#The species we are looking at
CONS_SPECIES = 'Mus musculus'

try:
	for record in mcursor:
		human = record['accession']
		url = 'http://localhost:3000/homologene/mrna/' + record['accession']
		response = requests.get(url)
		if response.status_code == requests.codes.ok :
			data = response.json()
			if len(data) > 0 and 'homologs' in data[0]:
				for homolog in data[0]['homologs'] :
					mouse = homolog['mrna_accession_ver']
					if CONS_SPECIES != homolog['tax_name']:
						continue

					seq1PolyA = None
					seq2PolyA = None

					data = response.json()
					seq1PolyA = polyA.find({'mrna' : human }, no_cursor_timeout = True)
					if seq1PolyA.count() == 0:
						log.write('Sequence ' + human + ' has no polyA sites mapped\n')
						continue
					seq2PolyA = polyA.find({'mrna' : mouse } , no_cursor_timeout = True )
					if seq2PolyA.count() == 0:
						log.write('Sequence ' + mouse + ' has no polyA sites mapped\n')
						continue
					seq1urich = []
					seq2urich = []
					seq1arich = []
					seq2arich = []
					seq1crich = []
					seq2crich = []
					seq1grich = []
					seq2grich = []
					##############MOUSE################
					for record in seq2PolyA:
						for NRS in record['URS']:
							seq2urich.append(Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq']))
						for NRS in record['ARS']:
							seq2arich.append(Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq']))
						for NRS in record['CRS']:
							seq2crich.append(Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq']))
						for NRS in record['GRS']:
							seq2grich.append(Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq']))

					##############HUMAN###############
					for record in seq1PolyA:
						index = -1
						for NRS in record['URS']:
							index += 1
							pat1 = Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq'])
							for pat2 in seq2urich:
								if UCons(pat1, pat2) == 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'URS.'+ str(index)+'.conserved' : False}})
								if UCons(pat1, pat2) != 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'URS.'+ str(index)+'.conserved' : True}})
									ulist[pat1.loc] = ulist[pat1.loc]+1
									break
						index = -1
						for NRS in record['ARS']:
							index += 1
							pat1 = Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq'])
							for pat2 in seq2arich:
								if UCons(pat1, pat2) == 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'ARS.'+ str(index)+'.conserved' : False}})
								if UCons(pat1, pat2) != 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'ARS.'+ str(index)+'.conserved' : True}})
									alist[pat1.loc] = alist[pat1.loc]+1
									break
						index = -1
						for NRS in record['CRS']:
							index += 1
							pat1 = Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq'])
							for pat2 in seq2crich:
								if UCons(pat1, pat2) == 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'CRS.'+ str(index)+'.conserved' : False}})
								if UCons(pat1, pat2) != 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'CRS.'+ str(index)+'.conserved' : True}})
									clist[pat1.loc] = clist[pat1.loc]+1
									break
						index = -1
						for NRS in record['GRS']:
							index += 1
							pat1 = Nrich(NRS['downstream_rel_pos'], NRS['order'], NRS['seq'])
							for pat2 in seq2grich:
								if UCons(pat1, pat2) == 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'GRS.'+ str(index)+'.conserved' : False}})
								if UCons(pat1, pat2) != 0:
									polyA.update_one({"_id": record['_id']}, { "$set": { 'GRS.'+ str(index)+'.conserved' : True}})
									glist[pat1.loc] = glist[pat1.loc]+1
									break
						
					


except Exception as e:
	print(e)
	print("\nHuman: " + human + "| Mouse: " + mouse + "\n")
	print("Something terrible has happened\n")


#for x in range(1, MAX_SEARCH_LENGTH):
#	sheet.write(1+x,0, x)
#	sheet.write(1+x,1, ulist[x])
#	sheet.write(1+x,2, x)
#	sheet.write(1+x,3, alist[x])
#	sheet.write(1+x,4, x)
#	sheet.write(1+x,5, clist[x])
#	sheet.write(1+x,6, x)
#	sheet.write(1+x,7, glist[x])

log.close()
