
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
            #    reworks the entries to store mRNA accession into a list
            dict_exons = {}  # reset dictionary entries if multiple genes are initially read step #1
            for y in return_list:
                # check if entry exists in dict_exons,
                # if it does, retrieve the value and place in wrk_mrna,
                #    otherwise initialize wrk_mrna list
                # Then append current mRNA to wrk_mrna and update the key's value
                # NOTE: use '-' as a separator between key components
                tmp_key = str(y[1]) +'-'+ str(y[2]) +'-'+ str(y[3]) +'-'+ str(y[4])
                if(tmp_key in dict_exons):
                    wrk_mrna = dict_exons[tmp_key]
                else:
                    wrk_mrna = []
                wrk_mrna.append(y[0])
                dict_exons[tmp_key] = wrk_mrna
                if(arg_print == 'Y'):
                    print('Individual read of list/tuple from module: ',y[0],' ',y[1],' ', y[2],' ', y[3],' ',y[4])
                    print("Key ", tmp_key, " is in dict_exons, value is: ", dict_exons[tmp_key])
            # once dict_exons is fully loaded, print debugging info
            if(arg_print == 'Y'):
                print("\nAfter dictionary is built, print the following:")
                print("Summarized wrk_mrna: ", wrk_mrna)
                print("Summarized Keys in dict_exons: ", dict_exons.keys())
                print("Summarized Values in dict_exons: ", dict_exons.values())

            # 4. retrieve mRNA collection document info, summarized by gene_id, organism, etc.
            #  This aggregate method call should return only one row
            readthis = collect_mrna.aggregate([ {"$match":{"gene_id":x['_id']['gid'], "organism":x['_id']['org'] }}, {"$group":{"_id":{"gene_id":"$gene_id", "organism":"$organism", "orientation":"$orientation", "build":"$build", "chrom":"$chrom" }}}  ])
            tmp_counter = 0
            for z in readthis:
                tmp_counter += 1
                if(arg_print == 'Y'):
                    print("Within z loop, list/tuple of second loop: ",z, "\ntmp_counter: ",tmp_counter," should only be 1  !!!!!!")

                #5. write the full "exons" collection document
                #   loop thru dictionary keys and values, match-up with previous
                #   "readthis" aggregate in Step #4 
                for k in dict_exons:
                    # parse out the '-' used as a separator between key fields
                    wk_splitkey = k.split('-')
                    wk_mRNA = dict_exons[k]
                    if(arg_print == 'Y'):
                        print("K: ", k, "value: ", dict_exons[k])
                        print("split key: ",wk_splitkey)

                    ### FINALLY insert the row into the exons collection
                    insert_confirm = collect_exons.insert({"gene_id":z['_id']['gene_id'], "exons_start":int(wk_splitkey[1]), "exons_end":int(wk_splitkey[2]), "mRNA":wk_mRNA, "organism":z['_id']['organism'], "orientation":z['_id']['orientation'], "build":z['_id']['build'], "chrom":z['_id']['chrom'], "alternative_spliced":wk_splitkey[3] })


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
