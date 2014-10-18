import urllib.request
import shutil  
import requests

class Urich:
	def __init__ (self, location, urichness, sequence):
		self.loc = location
		self.urich = urichness
		self.seq = sequence

#TODO need to add to both sides for overlap
#do they need to overlap 65nt is still mostly within optimal region?
#do something about 0 score
def UCons(n,m):
	score = 0
	overlap = abs(n.loc-m.loc)
	if overlap > 4:
		return score
	else:
		overlap = (5-overlap)/5
	uDiff = abs(n.urich-m.urich)
	if uDiff > 1:
		uDiff = .5
	if uDiff == 1:
		uDiff = .75
	if uDiff == 0:
		uDiff = 1
	score = .5*overlap + .5*uDiff
	return score 

human = 'NM_003196.1'  # human TCEA3 transcript
mouse = 'NM_011542.2'  # mouse TCEA3 transcript

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
	
#this is urich finder
#count-polyA uses relative length after polyA site
for count, nt in enumerate(data['a'], seq1PolyA):
	uscore = 0
	if count+4 < len(data['a']):
		for i in range(count, count+5):
			if data['a'][i] == 'U':
				uscore +=1
	if uscore >= 3: 
		seq1urich.append(Urich(count-seq1PolyA, uscore, data['a'][count:count+5]))
for count, nt in enumerate(data['b'], seq2PolyA):
	uscore = 0
	if count+4 < len(data['b']):
		for i in range(count, count+5):
			if data['b'][i] == 'U':
				uscore +=1
	if uscore >= 3: 
		seq2urich.append(Urich(count-seq2PolyA, uscore, data['b'][count:count+5]))
#end urich finder

for count,val in enumerate (seq1urich):
	bestMatch = 0
	bestScore = 0
	for count2,val2 in enumerate (seq2urich):
		if UCons(val, val2) > bestScore:
			bestMatch = count2
			bestScore = UCons(val, val2)
	print ("Best match for Urich", val.seq," @ ", val.loc, " is ", seq2urich[bestMatch].seq, " @ ",seq2urich[bestMatch].loc, " at ", bestScore, "points\n")

