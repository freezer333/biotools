import g



def test(t, y1, y2, y3, expectedScore) :
    cand = g.Cand("", t, 0)
    cand.y1 = y1
    cand.y2 = y2
    cand.y3 = y3

    assert cand.score() == expectedScore, 'Score should be %d, was %d' % (expectedScore, cand.score())#, "Score was %i " %  cand.score())


test(3, 1, 1, 1, 64)
test(2, 2, 1, 14, 12)
test(4, 1, 1, 1, 84)
test(3, 1, 10, 2, 58)
test(2, 2, 3, 3, 20)