import urllib.request
import shutil  
import requests

class Urich:
	def __init__ (self, location, urichness, sequence):
		self.loc = location
		self.urich = urichness
		self.seq = sequence
#this is urich finder
#count-polyA uses relative length after polyA site
def URichFinder(data, char,PolyA):
	urich = []
	for count, nt in enumerate(data[char], PolyA):
		uscore = 0
		if count+4 < len(data[char]):
			for i in range(count, count+5):
				if data[char][i] == 'U':
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
	uDiff = abs(n.urich-m.urich)
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
	score = .5*overlap + .5*uDiff
	return score 
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

mcursor = collect.find(spec = {'organism':'Homo sapiens'}, snapshot = True)

for record in mcursor:
	human = record['accession']
	url = 'http://localhost:3000/homologene/mrna/' + record['accession']
	response = requests.get(url)
	if response.status_code == requests.codes.ok :
		data = response.json()
		if len(data) > 0 and 'homologs' in data[0]:
			for homolog in data[0]['homologs'] :
				mouse = homolog['mrna_accession_ver']

				seq1 = None
				seq2 = None

				#get length for polyA site
				url = 'http://localhost:3000/mrna/' + human + "/sequence"
				response = requests.get(url)
				if response.status_code == requests.codes.ok :
				    data = response.json()
				    seq1PolyA = len(data['sequence'])
				    print (seq1PolyA)
				url = 'http://localhost:3000/mrna/' + mouse + "/sequence"
				response = requests.get(url)
				if response.status_code == requests.codes.ok :
				    data = response.json()
				    seq2PolyA = len(data['sequence'])
				    print (seq2PolyA)

				#retrieve sequence data
				url = 'http://localhost:3000/mrna/' + human + "/sequence?downstream=65"
				response = requests.get(url)
				if response.status_code == requests.codes.ok :
				    data = response.json()
				    seq1 = data['sequence'];

				url = 'http://localhost:3000/mrna/' + mouse + "/sequence?downstream=65"
				response = requests.get(url)
				if response.status_code == requests.codes.ok :
				    data = response.json()
				    seq2 = data['sequence'];
				#turn T into U
				seq1 = seq1.replace('T', 'U')
				seq2 = seq2.replace('T', 'U')

				seq1urich = []
				seq2urich = []

				post_data = {'seqa' : seq1,
					      'seqb' : seq2}

				url = 'http://localhost:3000/alignment/'
				response = requests.post(url, data=post_data)
				if response.status_code == requests.codes.ok :
					data = response.json()
					print("Sequence Alignment Result")
					print("=======================\nSequence A\n=======================")
					print(data['a'])
					print("=======================\nSequence B\n=======================")
					print(data['b'])


				#need to find polyA site post alignment
				#cycle through post alignment sequence (ignoring -'s) until that number is reached?
				temp = 0;
				for count, nt in enumerate(data['a']):
					if (nt != '-'):
						temp = temp+1
					if (temp == seq1PolyA):
						seq1PolyA = count
						break

				temp = 0;
				for count, nt in enumerate(data['b']):
					if (nt != '-'):
						temp = temp+1
					if (temp == seq2PolyA):
						seq2PolyA = count
						break
	

				seq1urich = URichFinder(data, 'a', seq1PolyA)
				seq2urich = URichFinder(data, 'b', seq2PolyA)


				for count,val in enumerate (seq1urich):
					bestMatch = 0
					bestScore = 0
					for count2,val2 in enumerate (seq2urich):
						if UCons(val, val2) > bestScore:
							bestMatch = count2
							bestScore = UCons(val, val2)
					if (bestScore != 0):
						print ("Best match for Urich", val.seq," @ ", val.loc, " is ", seq2urich[bestMatch].seq, " @ ",seq2urich[bestMatch].loc, " at ", bestScore, "points\n")

