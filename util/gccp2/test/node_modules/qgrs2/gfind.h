
#include <iostream>
#include <string>
#include <queue>
#include <cmath>
#include <sstream>
#include <ctime>
#include <algorithm>
using namespace std;

typedef unsigned short nt;
class G4Candidate;

class G4 {
public:
    G4() ;
    G4(G4Candidate &candidate) ;
    bool isequal(const G4 & other);
    void makejson(string name, nt value, stringstream &out) ;
    void makejson(string name, short value, stringstream &out);
    void makejson(string name, string value, stringstream &out);
    string toString(bool print_overlaps=true) ;
    nt start;
    nt tetrad1;
    nt tetrad2;
    nt tetrad3;
    nt tetrad4;
    short y1;
    short y2;
    short y3;
    short tetrads;
    short length;
    short gscore;
    string sequence;
    vector<G4> overlaps;
};


vector<G4> find(string, short min_tetrads=2, short min_score=17);
string makeJSON(vector<G4> g4s, bool overlaps=true);
