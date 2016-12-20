
# Create program to purge the alternative splice site collection.

#--------------------------------------------------------------
# USE WITH CAUTION:
# IF YOU PASS IN ONLY THE ORGANISM ARGUMENT, ALL THE GENE
# INFORMATION WILL BE DELETED
#--------------------------------------------------------------

# arguments:
# 1. organism (e.g., Homo sapiens)
# 2. gene_id: can enter a single gene_id, or pass in an empty string
# 3. print flag: if "Y" will print debugging information

# process is as follows:
# From the chrome database,
# 1. remove either the entire organism's alternative splice site data,
#    or just an organism's specific gene

### Marty Osterhoudt
### independent research project with Dr. Frees
### Fall 2016 semester
### Ramapo College of NJ

import sys

def purge_data(arg_organism, arg_gene='', arg_print=''):

    # create objects required to access MongoDB
    from pymongo import MongoClient
    client = MongoClient()
    db = client.chrome
    collect_exons = db.exons

    # 1. remove alternative splice site data, depending on arguments passed in
    if(arg_gene == ''):
        collect_exons.remove( { "organism":arg_organism } );
    else:
        collect_exons.remove( { "organism":arg_organism, "gene_id":arg_gene } );

#-------------------------------------------------------------------------
### mainline
#-------------------------------------------------------------------------

tmp_organism = ''
tmp_gene = ''
tmp_input_print = ''
if(len(sys.argv) > 1):
    tmp_organism = sys.argv[1]
if(len(sys.argv) > 2):
    tmp_gene = sys.argv[2]
if(len(sys.argv) > 3):
    if(sys.argv[3] == 'Y'):
        tmp_input_print = 'Y'

purge_data(tmp_organism, tmp_gene, tmp_input_print)
