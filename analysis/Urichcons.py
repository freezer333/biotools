import urllib.request
import shutil  
import requests
import xlsxwriter

book = xlsxwriter.Workbook("UrichPolyA.xlsx")
sheet = book.add_worksheet("Sheet")
sheet.write(0, 0, "Accession")
sheet.write(0, 1, "Homolog")
sheet.write(0, 2, "Accession U")
sheet.write(0, 3, "Homolog U")
sheet.write(0, 4, "Accession Pos")
sheet.write(0, 5, "Homolog Pos")
sheet.write(0, 6, "AccessionUrichness")
sheet.write(0, 7, "HomologUricness")
sheet.write(0, 8, "Score")

####################TODO#######################
# Location a factor?
# MOUSE XM_006539421.1 not in DB
# NM_001145264.1 broke : pymongo.errors.CursorNotFound: cursor id '70360518217' not valid at server


class Urich:
	def __init__ (self, location, urichness, sequence):
		self.loc = location
		self.urich = urichness
		self.seq = sequence
#this is urich finder
#count-polyA uses relative length after polyA site
def URichFinder(data, PolyA):
	urich = []
	for count, nt in enumerate(data, PolyA):
		uscore = 0
		if count+4 < len(data):
			for i in range(count, count+5):
				if data[i] == 'U':
					uscore +=1
		if uscore >= 3: 
			urich.append(Urich(count-PolyA, uscore, data[char][count:count+5]))
	return urich
	

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
	uDiff = 0
	if n.urich == 3:
		if m.urich == 3:
			uDiff = 0
		elif m.urich == 4:
			uDiff = CONST_34
		elif m.urich == 5:
			ufDiff = CONST_35
	elif n.urich == 4:
		if m.urich == 3:
			uDiff = CONST_34
		elif m.urich == 4:
			uDiff = 1
		elif m.urich == 5:
			uDiff = CONST_45
	elif n.urich == 5:
		if m.urich == 3:
			uDiff = CONST_35
		elif m.urich == 4:
			uDiff = CONST_45
		elif m.urich == 5:
			uDiff = 1
	else:
		uDiff = 0
	score = .5*overlap + .5*uDiff
	return score 

##############################################################################################################
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
polyA = db.polyA

log = open('urich_log.txt', 'w')
mcursor = collect.find({'organism':'Homo sapiens'}, no_cursor_timeout = True)

#The species we are looking at
CONS_SPECIES = 'Mus musculus'

XLSpos = 1
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
					#tax_name filter
					#print (homolog['tax_name'])
					if CONS_SPECIES != homolog['tax_name']:
						continue

					#seq1 = None
					#seq2 = None
					seq1PolyA = None
					seq2PolyA = None

					print(human +"\n" + mouse +"\n")
					
					
					url = 'http://localhost:3000/mrna/' + human #+ "/sequence"
					response = requests.get(url)
					if response.status_code == requests.codes.ok :
						data = response.json()
						seq1PolyA = polyA.find({'mrna' : human }, no_cursor_timeout = True)
						if seq1PolyA.count() == 0:
							log.write('Sequence ' + human + ' has no polyA sites mapped\n')
							continue
					##	#seq1PolyA = len(data['sequence'])
					##	#print (seq1PolyA)
					else:
						log.write('Error: Principle sequence not found '+human+'\n')
						continue
					url = 'http://localhost:3000/mrna/' + mouse #+ "/sequence"
					response = requests.get(url)
					if response.status_code == requests.codes.ok :
						data = response.json()
						seq2PolyA = polyA.find({'mrna' : mouse } , no_cursor_timeout = True )
						if seq2PolyA.count() == 0:
							log.write('Sequence ' + mouse + ' has no polyA sites mapped\n')
							continue
						#seq2PolyA = len(data['sequence'])
						#print (seq2PolyA)
					else:
						log.write('Error: Homolog sequence not found '+mouse+'\n')
						continue
					#retrieve sequence data
					#url = 'http://localhost:3000/mrna/' + human + "/sequence?downstream=65"
					#response = requests.get(url)
					#if response.status_code == requests.codes.ok :
					#	data = response.json()
					#	seq1 = data['sequence'];
					#url = 'http://localhost:3000/mrna/' + mouse + "/sequence?downstream=65"
					#response = requests.get(url)
					#if response.status_code == requests.codes.ok :
					#	data = response.json()
					#	seq2 = data['sequence'];
					#turn T into U
					#if seq1 != "":
					#	seq1 = seq1.replace('T', 'U')
					#if seq2 != "":
					#	seq2 = seq2.replace('T', 'U')
					#else:
					#	log.write('Error: Sequence data not found '+human+' : '+mouse+'\n')
					#	continue
					seq1urich = []
					seq2urich = []

					for record in seq1PolyA:
						for URS in record['URS']:
							seq1urich.append(Urich(URS['downstream_rel_pos'], URS['order'], URS['seq']))
					for record in seq2PolyA:
						for URS in record['URS']:
							seq2urich.append(Urich(URS['downstream_rel_pos'], URS['order'], URS['seq']))


					#seq1urich = URichFinder(data,  seq1PolyA)
					#seq2urich = URichFinder(data,  seq2PolyA)

					for count,val in enumerate (seq1urich):
						bestMatch = 0
						bestScore = 0
						for count2,val2 in enumerate (seq2urich):
							if UCons(val, val2) > bestScore:
								bestMatch = count2
								bestScore = UCons(val, val2)
						if (bestScore != 0):
							sheet.write(XLSpos, 0, human)
							sheet.write(XLSpos, 1, mouse)
							sheet.write(XLSpos, 2, val.seq)
							sheet.write(XLSpos, 3, seq2urich[bestMatch].seq)
							sheet.write(XLSpos, 4, val.loc)
							sheet.write(XLSpos, 5, seq2urich[bestMatch].loc)
							sheet.write(XLSpos, 6, val.urich)
							sheet.write(XLSpos, 7, seq2urich[bestMatch].urich)
							sheet.write(XLSpos, 8, bestScore)
							XLSpos += 1

except Exception as e:
	print(e)
	print("\nHuman: " + human + "| Mouse: " + mouse + "\n")
	print("Something terrible has happened\n")
log.close()
book.close()



