import math

def find(sequence, min_tetrads=2, min_score=13, log=False) :
    raw_g4s = list()

    cands = seedQ(sequence, min_tetrads)
    if log:
        print ( len(cands) , " initial candidates found at seed time")
    
    while len(cands) > 0:
        cand = cands.pop()
        if log:
            print("Candidate G4:  ", cand.asString(), "  -> ",  end="")
        if cand.complete():
            if cand.viable(min_score):
                if log:
                    print("Complete")
                raw_g4s.append(makeG4(cand))
            elif log:
                print("Not viable, discarded")
        else :
            expanded = cand.expand()
            if len(expanded) is 0 and log:
                print("Discarded, no expansion possible")
            elif log:
                print("Expanded into ", len(expanded), " new candidates")
            for c in expanded:
                cands.append(c)

    if log:
        print("Found " , len(raw_g4s) , " g4s, now grouping into families")

    fams = list()
    for g in raw_g4s :
        newfam = True
        for f in fams:
            if belongsin(g, f):
                f.append(g)
                newfam = False
        if newfam:
            f = list()
            f.append(g)
            fams.append(f)


    if log:
        print ("Grouped into " , len(fams) , " families, now building g4 list with overlaps")

    g4s = list()
    for fam in fams:
        # select best
        best = select_best(fam)
        fam.remove(best)
        best['overlaps'] = fam
        g4s.append(best)

    return g4s;


def select_best(family):
    highest = 0
    best = None
    for g4 in family:
        if g4['gscore'] > highest:
            highest = g4['gscore']
            best = g4

    
    return best

def belongsin(g4, family):
    for member in family:
        if overlapped(g4, member):
            return True

    return False

def overlapped(a, b):
    a_start = a['start']
    a_end = a_start + a['length']

    b_start = b['start']
    b_end = b_start + b['length']

    if a_start >= b_start and a_start <= b_end:
        return True
    if a_end >= b_start and a_end <= b_end:
        return True
    if b_start >= a_start and b_start <= a_end:
        return True
    if b_end >= a_start and b_end <= a_end:
        return True
    return False

def seedQ(sequence, min_tetrads) :
    g = min_tetrads
    starts = list()
    cands = list()
    done = False

    while not done :
        starts = getStartingPoints(sequence, g)
        for start in starts:
            cands.append(Cand(sequence, g, start))
        g+= 1
        done = len(starts) is 0

    return cands


def getStartingPoints(sequence, g):
    tstring = "G" * g;
    p = 0;
    done = False
    starts = list()

    while not done:
        p = sequence.find(tstring, p)
        if p >= 0:
            starts.append(p)
        else :
            done = True
        p += 1

    return starts

def maximumLength (numTetrads) :
    if numTetrads < 3 : 
        return 30
    else : 
        return 45

def makeG4(candidate) :
    g4 = dict()
    g4['start'] = candidate.start
    g4['tetrads'] = candidate.numTetrads
    g4['tetrad1'] = candidate.t1()
    g4['tetrad2'] = candidate.t2()
    g4['tetrad3'] = candidate.t3()
    g4['tetrad4'] = candidate.t4()
    g4['y1'] = candidate.y1
    g4['y2'] = candidate.y2
    g4['y3'] = candidate.y3
    g4['length'] = candidate.length()
    g4['gscore'] = candidate.score()
    g4['sequence'] = candidate.sequence[candidate.start:candidate.start+candidate.length()]
    return g4


class Cand:
    def __init__(self, sequence, tetrads, start_pos):
        self.y1 = -1
        self.y2 = -1
        self.y3 = -1
        self.sequence = sequence
        self.numTetrads = tetrads
        self.start = start_pos
        self.tstring = "G"  * self.numTetrads
        self.maxLength = maximumLength(tetrads)

    def score(self) :
        assert self.complete(), "Can't compute g-score for incomplete G4 candidate"

        gavg = (math.fabs(self.y1-self.y2) + math.fabs(self.y2-self.y3) + math.fabs(self.y1-self.y3))/3.0

        return math.floor(self.gmax() - gavg + self.gmax() * (self.numTetrads-2))

    def gmax(self):
        return self.maxLength - (self.numTetrads * 4 + 1)

    def length(self):
        assert self.complete(), "Can't compute length of incomplete G4 candidate"
        return 4 * self.numTetrads + self.y1 + self.y2 + self.y3

    def expand(self) :
        assert not self.complete(), "Cannot expand complete G4 motif"
        cands = list()
        ys = self.findLoopLengthsFrom(self.cursor())
        for y in ys:
            cand = Cand(self.sequence, self.numTetrads, self.start)
            cand.y1 = self.y1
            cand.y2 = self.y2
            cand.y3 = self.y3
            if self.y1 < 0 :
                cand.y1 = y
            elif self.y2 < 0:
                cand.y2 = y
            elif self.y3 < 0:
                cand.y3 = y
            
            if cand.partialLength() <= cand.maxLength :
                cands.append(cand)

        return cands

    def asString(self) :
        if self.complete() :
            return "[" + str(self.numTetrads) + "]:  " + self.sequence[0:self.start] + "[" + self.sequence[self.start:self.start+self.length()] + "]" + self.sequence[self.start+self.length():] + " -> " + str(self.score())
        else:
            return "[" + str(self.numTetrads) + "]:  " + self.sequence[0:self.start] + "[" + self.sequence[self.start:self.cursor()] + "*"

    def t1(self):
        return self.start

    def t2(self) :
        assert self.y1 >= 0, "Tetrad 2 position can't be computed until loop 1 is found"
        return self.t1() + self.numTetrads + self.y1

    def t3(self) :
        assert self.y2 >= 0, "Tetrad 3 position can't be computed until loop 2 is found"
        return self.t2() + self.numTetrads + self.y2

    def t4(self) :
        assert self.y3 >= 0, "Tetrad 4 position can't be computed until loop 3 is found"
        return self.t3() + self.numTetrads + self.y3

    def cursor(self):
        assert not self.complete(), "Cursor cannot be computed on a complete G4"
        
        if self.y1 < 0 :
            return self.t1() + self.numTetrads
        elif self.y2 < 0:
            return self.t2() + self.numTetrads
        elif self.y3 < 0:
            return self.t3() + self.numTetrads

    def partialLength(self) :
        length = self.numTetrads * 4
        if self.y1 > 0 :
            length += self.y1
        if self.y2 > 0:
            length += self.y2
        if self.y3 > 0:
            length += self.y3

        return length

    


    def findLoopLengthsFrom(self, i):
        ys  = list()
        p = i
        done = False
        while not done:
            p = self.sequence.find(self.tstring, p)
            if p >= 0:
                y = p - i
                if y >= self.minAcceptableLoopLength() :
                    ys.append(y)
            else:
                done = True
            p += 1

        return ys

    def minAcceptableLoopLength(self):
        if self.y1 == 0 or self.y2 == 0 or self.y3 == 0:
            return 1
        else:
            return 0

    def complete(self) :
        if self.y1 < 0 or self.y2 < 0 or self.y3 < 0 : 
            return False
        else:
            return True
    
    def viable(self, min_score) :
        if self.score() < min_score : 
            return False
        if self.length() > self.maxLength :
            return False

        # only one loop is allowed to have a 0 length
        count = 0
        if self.y1 < 1:
            count+= 1
        if self.y2 < 1:
            count+= 1
        if self.y3 < 1:
            count+= 1
        return count < 2