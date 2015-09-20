import urllib.request
import shutil
import requests
import xlsxwriter
import random
import re


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
			urich.append(Urich(count, uscore, data[char][count:count+5]))
	return urich


output = open('urich_samples.html', 'w')
output.write("<html>\n<head>\n")
output.write("<style>\n")
output.write("table, th, td { white-space: nowrap; border: 1px solid black; border-collapse: collapse; width: 100%; height: 20px;}\n")
output.write("body { font-family: \"Courier New\", monospace}")
output.write("</style>")
output.write("<body>\n")

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
aligned = db.alignedseq

mcursor = collect.find(spec = {'organism':'Homo sapiens'}, snapshot = True, timeout = False)

#The species we are looking at
CONS_SPECIES = 'Mus musculus'

XLSpos = 1

SeqCount = 0
while SeqCount <= 15:
	record = mcursor[random.randrange(0,mcursor.count(),1)]
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
				url = 'http://localhost:3000/mrna/' + human + "/sequence"
				response = requests.get(url)
				if response.status_code == requests.codes.ok :
				    data = response.json()
				    seq1CDS_start = data['mrna']['features']['cds']['start']
				    seq1CDS_end = data['mrna']['features']['cds']['end']
				    seq1CDS_start = int(seq1CDS_start)
				    seq1CDS_end = int(seq1CDS_end)
				    #print (seq1PolyA)
				else:
					continue
				url = 'http://localhost:3000/mrna/' + mouse + "/sequence"
				response = requests.get(url)
				if response.status_code == requests.codes.ok :
				    data = response.json()
				    #get mouse cds
				    eutils = "http://www.ncbi.nlm.nih.gov/entrez/eutils/"
				    esearch = "esearch.fcgi?db=nucleotide&term=" + mouse
				    respObj = requests.get(eutils+esearch)
				    if respObj.status_code == requests.codes.ok :
                       			searchResult = re.search("\<Id\>(?P<idKey>\d+)\<\/Id\>",respObj.text)
                        		efetch = "efetch.fcgi?db=nucleotide&id="+searchResult.group('idKey')+"&rettype=ft&retmode=text"
                        		respObj = requests.get(eutils+efetch)
                        		if respObj.status_code == requests.codes.ok :
                            			fetchResult = re.search("(?P<CDSstart>\d+)\t(?P<CDSend>\d+)\tCDS",respObj.text)
                            			seq2CDS_start = fetchResult.group('CDSstart')
                            			seq2CDS_end = fetchResult.group('CDSend')
                            			seq2CDS_start = int(seq2CDS_start)
                            			seq2CDS_end = int(seq2CDS_end)
                            			#seq2PolyA = data['mrna']['features']['length']
				    #print (seq2PolyA)
				else:
					continue

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
				if seq1 != "":
					seq1 = seq1.replace('T', 'U')
				if seq2 != "":
					seq2 = seq2.replace('T', 'U')
				else:
					continue

				seq1urich = []
				seq2urich = []

				post_data = {'seqa' : seq1,
					      'seqb' : seq2}
				AlignDBcursor = aligned.find(spec = {'principle':human, 'homolog':mouse}, snapshot = True, timeout = False)
				if AlignDBcursor.count() != 0:
					data = {'a': '', 'b':''}
					data['a'] = AlignDBcursor[0]["principle_seq"]
					data['b'] = AlignDBcursor[0]["homolog_seq"]
					seq1PolyA = AlignDBcursor[0]["principle_polya"]
					seq2PolyA = AlignDBcursor[0]["homolog_polya"]
				else:
					print("Alignment not found!\n")
					continue
				temp = 0;
				for count, nt in enumerate(data['a']):
					if (nt != '-'):
						temp = temp+1
					if (temp == seq1CDS_start):
						seq1CDS_start = count
						break
				temp = 0;
				for count, nt in enumerate(data['a']):
					if (nt != '-'):
						temp = temp+1
					if (temp == seq1CDS_end):
						seq1CDS_end = count
						break
				temp = 0;
				for count, nt in enumerate(data['b']):
					if (nt != '-'):
						temp = temp+1
					if (temp == seq2CDS_start):
						seq2CDS_start = count
						break
				temp = 0;
				for count, nt in enumerate(data['b']):
					if (nt != '-'):
						temp = temp+1
					if (temp == seq2CDS_end):
						seq2CDS_end = count
						break
				seq1urich = URichFinder(data, 'a', seq1PolyA)
				seq2urich = URichFinder(data, 'b', seq2PolyA)
				output.write("<table>\n<tr>\n")
				output.write("<td>"+ human + "</td>\n")
				output.write("<td>")
				output.write(data['a'][0:seq1CDS_start])
				output.write("<b style=\"color: #FFD700\">"+data['a'][seq1CDS_start:seq1CDS_end]+"</b>")
				output.write(data['a'][seq1CDS_end:seq1PolyA])
				output.write("<b style=\"color: #DC143C\">"+data['a'][seq1PolyA]+"</b>")
				cursor = seq1PolyA+1
				for urich in seq1urich:
					output.write(data['a'][cursor:urich.loc])
					if (cursor < urich.loc):
						cursor = urich.loc
					output.write("<b style=\"background-color: #00FF00\">"+data['a'][cursor:urich.loc+5]+"</b>")
					cursor = urich.loc+5
				output.write(data['a'][cursor:])
				output.write("</td>")
				output.write("</tr>\n")
				output.write("<tr>\n")
				output.write("<td>"+ mouse + "</td>\n")
				output.write("<td>")
				output.write(data['b'][0:seq2CDS_start])
				output.write("<b style=\"color: #FFD700\">"+data['b'][seq2CDS_start:seq2CDS_end]+"</b>")
				output.write(data['b'][seq2CDS_end:seq2PolyA])
				output.write("<b style=\"color: #DC143C\">"+data['b'][seq2PolyA]+"</b>")
				cursor = seq2PolyA+1
				for urich in seq2urich:
					output.write(data['b'][cursor:urich.loc])
					if (cursor < urich.loc):
						cursor = urich.loc
					output.write("<b style=\"background-color: #00FF00\">"+data['b'][cursor:urich.loc+5]+"</b>")
					cursor = urich.loc+5
				output.write(data['b'][cursor:])
				output.write("</td>")
				output.write("</tr>\n")
				output.write("</table>\n")
				output.write("<br>")
				SeqCount += 1



output.write("</body>\n</html>")
output.close()

