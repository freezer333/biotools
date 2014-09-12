import sys
import g
import json

'''
g4s = g.find('GGGAAAGGGAGGGGAGGGCCCCCCCCCCAAAAAAAACCCCCCAACACCACACACGGGGNNNNGGGGGAAGGGGAGGGGG')#
for g4 in g4s:
    print (g4['sequence'] , " -> " , g4['gscore'])
print ( len(g4s), " G4s found")

print (json.dumps(g4s))
'''


for line in sys.stdin:
    g4s = g.find(line)
    print ( json.dumps(g4s) )
 
