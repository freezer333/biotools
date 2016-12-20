### test the retrieve as a module
### ensure this program can get the return
### Marty Osterhoudt

import sys
import retrieve_altsplicesites as alt

#-------------------------------------------------------------------------------
#### begin mainline

# try some of the following gene accession numbers for test data
# 820   # single mRNA
# 6402  # single mRNA
# 6003  # simple example of mixed exon start/end positions
# 6628  # for two mRNA, from exon pos. is same, but end pos. is different
# 862   # complex example of mixed exon start/end positions
# 8913  # probably the most complex, has 28 mRNA associated with this gene accession#

for x in [99999999999,820,6402,6628]:
    rtn_list = alt.get_altsplice(str(x), '')
    print('\n** From within testmodule, print for:',x,'  ',rtn_list,'\n**---------------------------------------------------')
