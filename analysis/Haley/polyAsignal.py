#A(A/T)TAAA

def get_polyA_sig(seq):
    i = 0
    while i <= len(seq) - 6:
        heptamer = seq[i:(i+6)]
        if heptamer == "AATAAA":
            print (heptamer)
        if heptamer == "ATTAAA":
            print (heptamer)
            print(i)
        i+=1


test1 = "GKDJFKAJENFBDAATAAADKJFHA"
test2="AATTAAANNNNNNN"
test3="CNIAATAAA"
test4="FGHA;RKLFDGJL;SKRNG"

get_polyA_sig(test1)
get_polyA_sig(test2)
get_polyA_sig(test3)
get_polyA_sig(test4)
