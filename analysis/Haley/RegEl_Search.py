#!usr/bin/python3
import urllib.request
import shutil
import requests

from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna

#u_g

#colOne
five_four = 0
five_three = 0
five_two= 0
five_zero= 0

#colTwo 
four_four = 0
four_three = 0
four_two= 0
four_zero= 0


#colThree
three_four = 0
three_three = 0
three_two= 0
three_zero= 0

#colFour
zero_four = 0
zero_three = 0
zero_two= 0
zero_zero= 0

NothingDone = 0

Five_uR = 0
Four_uR= 0
Three_uR = 0
Zero_uR = 0

d = dict();

mcursor = collect.find(spec={'organism' : 'Homo sapiens' },snapshot=True)

def convert(n):
    try:
        return int(n)
    except ValueError:
        return float(n + 0.5)

def highestU (record):
    if 'u_rich_downstream' in record:
        u_Elements = record['u_rich_downstream']
        highestOrder = 0
        for u in u_Elements:
            order = convert (u['order'])
            if order > highestOrder:
                highestOrder = order
        return highestOrder
    else:
        if('cds' in record):
            return 0
        else:
            return -1


def highestG (record):
    highestG = 0
    if 'g4s' in record:
        g4s = record['g4s']
        for g in g4s:
          if g ['isDownstream']:
             tetrads = convert (g['tetrads'])
             if tetrads > highestG:
                highestG = tetrads
    return highestG


gene_id = ""
doubles = 0
for record in mcursor:
    g = highestG (record)
    uType = highestU(record)
    gene_id = record ['gene_id']

    if gene_id in d:
        doubles += 1
    else:
        d[gene_id] = 1
        #colOne
        if uType == 5:
            Five_uR += 1
            if g == 4:
                five_four += 1
            if g == 3:
                five_three+= 1
            if g == 2:
                five_two +=1
            if g == 0:
                five_zero += 1 
           

        #colTwo
        if uType == 4:
            Four_uR += 1
            if g == 4:
                four_four += 1
            if g == 3:
                four_three+= 1
            if g == 2:
                four_two +=1
            if g == 0:
                four_zero += 1 
            


        #colThree
        if uType == 3:
            Three_uR += 1
            if g == 4:
                three_four += 1
            if g == 3:
                three_three+= 1
            if g == 2:
                three_two +=1
            if g == 0:
                three_zero += 1 
           

        #col4
        if uType == 0:
            Zero_uR +=1
            if g == 4:
                zero_four += 1
            if g == 3:
                zero_three+= 1
            if g == 2:
                zero_two +=1
            if g == 0:
                zero_zero += 1 
            

        else:
            NothingDone += 1

#show results
print ("\t5 \t\t\t 4 \t  \t\t\t 3 \t\t\t 0\t\t\t [U]")
print ("\n4:\t",five_four, "\t\t\t", four_four, "\t\t\t", three_four, "\t\t\t",zero_four)
print ("\n3:\t", five_three, "\t\t\t", four_three, "\t\t\t", three_three, "\t\t\t",zero_three )
print ("\n2:\t",five_two, "\t\t\t", four_two, "\t\t\t", three_two, "\t\t\t",zero_two )
print ("\n0:\t",five_zero, "\t\t\t", four_three, "\t\t\t", three_zero , "\t\t\t", zero_zero)



print ("\nnothing done: ", NothingDone)
print ("\n:0", Zero_uR) 
print ("\n3:",Three_uR)
print ("\n4:",Four_uR)
print ("\n5:",Five_uR)
print ("DOUBLES:", doubles)
