
# Create program to write alternative splice site collection.

# arguments:
# 1. organism (e.g., Homo sapiens)
# 2. gene_id: (optional) can enter a single gene_id, or pass in an empty string
# 3. print flag: (optional) if "Y" will print debugging information

# process is as follows:
# From the chrome database,
# 1. read the mrna collection, group by gene_id
# 2. call the "retrieve_altsplicesites" module using gene_id
# 3. load dictionary based on information returned from module call,
#    key:from/to exon, alt splice flag  value: mRNA accession#s
# 4. retrieve detailed mRNA collection info
# 5. combine subet of mRNA info with dictionary info, INSERT to exons collection
#    (mRNA accession numbers now in list)
#

### Marty Osterhoudt
### independent research project with Dr. Frees
### Fall 2016 semester
### Ramapo College of NJ

import sys, retrieve_altsplicesites as alt

def get_data(arg_organism, arg_gene='', arg_print=''):

    # create objects required to access MongoDB
    from pymongo import MongoClient
    client = MongoClient()
    db = client.chrome
    collect_mrna = db.mrna
    collect_exons = db.exons

    return_list = []  # list returned from "retrieve_altsplicesites" module call
    dict_exons = {}  # data structure key: from/to exons, flag, value: tuple of mRNA accession#s
    wrk_mrna = []  # list of mRNA used as dict_exons values

    # 1. read mrna collection, group by organism and (optionally) gene
    #    This just sets up which organism and gene should be included
    if(arg_gene == ''):
        result = collect_mrna.aggregate([{"$match":{"organism":arg_organism}},                     {"$group":{"_id":{"gid":"$gene_id", "org":"$organism"}}}, {"$sort":{"org":1, "gid":1}}])
    else:
        result = collect_mrna.aggregate([{"$match":{"organism":arg_organism, "gene_id":arg_gene}}, {"$group":{"_id":{"gid":"$gene_id", "org":"$organism"}}}])

    # 2. retrieve alt splice site info for gene_id
    for x in result:
        return_list = alt.get_altsplice(x['_id']['gid'])
        # if anything is returned, continue
        if(return_list):
            if(arg_print == 'Y'):
                print("\nEntire tuple returned from retrieve_altsplicesites module: ",x,"\nreturn_list:  ",return_list)

            # 3. load dictionary based on information returned from module call
            for y in return_list:
                # check if entry exists in dict_exons,
                # if it does, retrieve the value
                # Then append current mRNA to value
                if((str(y[1]) + str(y[2]) + str(y[3]) + str(y[4])) in dict_exons):
                    wrk_mrna = dict_exons[(str(y[1]) + str(y[2]) + str(y[3]) + str(y[4]))]
                else:
                    wrk_mrna = []
                wrk_mrna.append(y[0])
                dict_exons[(str(y[1]) + str(y[2]) + str(y[3]) + str(y[4]))] = wrk_mrna
                if(arg_print == 'Y'):
                    print('Individual read of list/tuple from module: ',y[0],' ',y[1],' ', y[2],' ', y[3],' ',y[4])
                    print("Key ", (str(y[1]) + str(y[2]) + str(y[3]) + str(y[4])), " is in dict_exons: ", dict_exons[(str(y[1]) + str(y[2]) + str(y[3]) + str(y[4]))])

                # 4. retrieve mRNA collection document info by gene_id
                readthis = collect_mrna.find({"gene_id":str(y[1]), "accession":str(y[0]), "exons.start":int(y[2]), "exons.end":int(y[3])},{"_id":0, "organism":1, "orientation":1, "build":1, "chrom":1 })
                for z in readthis:
                    if(arg_print == 'Y'):
                        print("Within z loop, list/tuple of second loop: ",z)

                    #5. now write the full "exons" collection document
                    insert_confirm = collect_exons.insert({"gene_id":str(y[1]), "exons_start":int(y[2]), "exons_end":int(y[3]), "mRNA":dict_exons[(str(y[1]) + str(y[2]) + str(y[3]) + str(y[4]))], "organism":z['organism'], "orientation":z['orientation'], "build":z['build'], "chrom":z['chrom'], "alternative_spliced":str(y[4]) })


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

get_data(tmp_organism, tmp_gene, tmp_input_print)
