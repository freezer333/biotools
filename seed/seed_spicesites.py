# This is a post processing script to create a new collection
# derived from the 'exon' collection created by the seed_altsplice
# module.

# This script transforms the shape to each document, and adds sequence
# data and QGRS records.

# This script requires the web server to be running locally
# in order to acquire sequence data and QGRS mining.

import configparser
import requests
import g


config = configparser.ConfigParser()
config.read('seed_sources.ini')
#------------------------------------------------------------
# Note:     This seeding script requires the chromosome sequence
#           service to be up and running, with a fully populated
#           sequence database.  Use the URL field below to direct
#           the script to an alternative endpoint for sequence
#           data.
#
#           mRNA listings are pulled directly from the mrna collection
#           in mongo.
seq_url = config['chrom']['serve_url']
#------------------------------------------------------------


#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client[config['db']['name']]
exons = db['exons']
splice_sites = db['splice_sites']
#------------------------------------------------------------

alts = 0
non_alts = 0


def process_exon(exon):
    global alts
    global non_alts
    site = dict()
    site['gene_id'] = exon['gene_id']
    site['organism'] = exon['organism']
    site['build'] = exon['build']
    site['chromosome'] = exon['chrom']
    site['locus'] = exon['exons_start']
    site['exon'] = dict()
    site['exon']['start'] = exon['exons_start']
    site['exon']['end'] = exon['exons_end']

    orientation = '+'
    if 'orientation' in exon:
        orientation = exon['orientation']
    site['orientation'] = orientation

    is_alt_spliced = False
    if exon['alternative_spliced'] == 'Y':
        is_alt_spliced = True
    site['is_alt_spliced'] = is_alt_spliced

    window = 100
    url = seq_url + '/chrom/' + exon['chrom'] + '/' + str(exon['exons_start'] - window) + "/" + str(
        exon['exons_start'] + window) + "?orientation=" + site['orientation']
    response = requests.get(url)
    if response.status_code == requests.codes.ok:
        data = response.json()
        site['sequence'] = data['seq']
        qgrs = g.find(data['seq'], 3, 17)
        for q in qgrs:
            q['start'] = q['start'] - window
            q['tetrad1'] = q['tetrad1'] - window
            q['tetrad2'] = q['tetrad2'] - window
            q['tetrad3'] = q['tetrad3'] - window
            q['tetrad4'] = q['tetrad4'] - window
        site['qgrs'] = qgrs

    url = seq_url + '/gene/' + site['gene_id']
    response = requests.get(url)
    if response.status_code == requests.codes.ok:
        data = response.json()
        if data:
            site['gene_name'] = data['gene_name']

    url = seq_url + '/gene/' + site['gene_id'] + '/products'
    response = requests.get(url)
    if response.status_code == requests.codes.ok:
        data = response.json()
        if data:
            products = [o['accession'] for o in data]
        _products = []
        for product in products:
            p = dict()
            p['mrna'] = product
            p['contains'] = (product in exon['mRNA'])
            _products.append(p)
            if p['contains'] == False:
                alts = alts + 1
            else:
                non_alts = non_alts + 1
            print(alts, " alternative spliced out of total",
                  (alts + non_alts),  "->", alts / (alts + non_alts) * 100)
        site['products'] = _products

    splice_sites.insert(site)
    # print('Processed exon from gene ' + site['gene_id'])
    return True


mcursor = exons.find(filter={}, modifiers={
                     "$snapshot": True}, no_cursor_timeout=True)
count = 1
for record in mcursor:
    if process_exon(record):
        count += 1
mcursor.close()
print('Processed ', count, " exons ->  Splice site seeding")
