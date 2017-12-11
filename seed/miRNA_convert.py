import urllib.request
import shutil  
import requests
import pymongo
import sys
import os
import configparser
import gzip
import json
import math
import time

from pymongo import MongoClient
client = MongoClient()

#mirna = open("target_locations.txt", "r") 
test = open('/home/brett/Documents/miRNA/test.txt', 'r+') #it only works if I put exact directory
test.truncate(0)
mirna = open('/home/brett/Documents/miRNA/target_locations.txt', 'r+') #do I have to do -  with open(/targetlocations.txt) as bed_file miRNA=bed.load(json_file)


def get_chrom_accession(common, seed):

	for record in seed['chromosomes']:
		v = "chr" + record['common_id']
		if v==common:
			return record['accession']
	return False #I just copied this to get accession number

with open("/home/brett/biotools/seed/seeds/9606.json") as json_file: #
	seeds = json.load(json_file)

with open(mirna) as f: #mirna is the BED file with target sites
	for line in f:
		# name.split() Not sure if correctly splitting, does it only split with spaces or tabs
		name = line.split()[3] #gets the miRNA name


		ch = line.split()[0]
		acc = get_chrom_accession(ch,seeds) #just copying from polya
		orientation = line.split()[5]

		if orientation == "+":
			start_pos = line.split()[1]
			end_pos = line.split()[2]
            # print ("positive")
		elif orientation == "-":
			start_pos = line.split()[2]
			end_pos = line.split()[1]
             # print ("neg")
		else:
			print ("uh oh")
			
		url = 'http://localhost:3000/chrom/' + acc + '/' + str(start_pos) + '/' + str(end_pos) #+ "?orientation=-"  I don't know what this orientation is for
		 #this is assuming start could be higher
		response = requests.get(url)
		if response.status_code == requests.codes.ok : #what is this doing exactly? I am assuming it is just checking for errors but how?
			sequence = response.json()


		test.write(name, acc, start_pos, end_pos, sequence) #should I be converting to strings? Also I didnt do the db.polyA.insert_one(record) yet, can you
# does this put spacing?