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
qgrs_start = 0
qgrs_end = 0
qgrs_mid = 0
num_exons = 0

def process_exon(exon):
    global alts
    global non_alts
    global qgrs_start
    global qgrs_end
    global qgrs_mid
    global num_exons
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

    if is_alt_spliced:
        alts = alts + 1
    else:
        non_alts = non_alts + 1

    window = 100
    url = seq_url + '/chrom/' + exon['chrom'] + '/' + str(exon['exons_start'] - window) + "/" + str(
        exon['exons_end'] + window) + "?orientation=" + site['orientation']
    response = requests.get(url)
    if response.status_code == requests.codes.ok:
        data = response.json()
        exon_length = exon['exons_end']-exon['exons_start']
        site['sequence'] = data['seq']
        qgrs = g.find(data['seq'], 3, 17)
        for q in qgrs:
            q['start'] = q['start'] - window
            q['tetrad1'] = q['tetrad1'] - window
            q['tetrad2'] = q['tetrad2'] - window
            q['tetrad3'] = q['tetrad3'] - window
            q['tetrad4'] = q['tetrad4'] - window
            if q['start'] < 100:
                q['splice'] = 'begin'
                qgrs_start = qgrs_start + 1
            elif q['start'] > (exon_length-100):
                q['splice'] = 'end'
                qgrs_end = qgrs_end + 1
            else  :  
                q['splice'] = 'no'
                qgrs_mid = qgrs_mid + 1
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
            
            
        site['products'] = _products
    num_exons = num_exons + 1
    print(num_exons, " ->", '{0:.3f}'.format((alts / (alts + non_alts))*100), "% alt spliced",
                  (alts + non_alts),  "->", qgrs_start, ' / ', qgrs_end, ' / ', qgrs_mid)
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
