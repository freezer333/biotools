#include <iostream>
#include <string>
#include <queue>
#include <cmath>
#include <sstream>
#include <ctime>
#include <algorithm>
using namespace std;



#include <node.h>
using namespace v8;




typedef unsigned short nt;
class G4Candidate;
class G4;

string find(string, short min_tetrads=2, short min_score=17);
void seedQ(queue<G4Candidate> &, string, int);
std::vector<G4>::iterator select_best(vector<G4> fam);
bool belongsin(G4 g4, vector<G4> family);


Handle<Value> find(const Arguments& args) {
  HandleScope scope;

  if (args.Length() < 1) {
    ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  String::AsciiValue input(args[0]->ToString());
  string output = find(*input);
  return scope.Close(String::New(output.c_str()));
}

void Init(Handle<Object> exports) {
  exports->Set(String::NewSymbol("find"),
      FunctionTemplate::New(find)->GetFunction());
}

NODE_MODULE(qgrs, Init)


/*
int main() {
  string input = "GGGGAGGGGGAGGGGGGGAGGGGGG";
  //getline(cin, input);
  string output = find(input, 2, 17);
}*/

inline int maximumLength (int numTetrads) {
    return (numTetrads < 3)  ? 30 : 45;
}

class G4Candidate {
public:
    G4Candidate(string sequence, short tetrads, nt start_pos) {
        this->y1 = -1;
        this->y2 = -1;
        this->y3 = -1;
        this->sequence = sequence;
        this->numTetrads = tetrads;
        this->start = start_pos;
        this->tstring = "";
        for ( int i = 0; i < tetrads; i++ ) tstring.append("G");
        this->maxLength = maximumLength(tetrads);
        //cout << "Created candidate with " << numTetrads << " -> " << tstring << endl;
    }
    short y1 ;
    short y2 ;
    short y3 ;
    string sequence;
    short numTetrads;
    nt start ;
    string tstring;
    short maxLength;
    string toString() {
        stringstream sstr;
        sstr << "Start = " << start << ", numtetrads = " << numTetrads;
        return sstr.str();
    }
    short score() {
        double gavg = (abs(y1-y2) + abs(y2-y3) + abs(y1-y3))/3.0;
        return floor(gmax() - gavg + gmax() * (numTetrads-2));
    }
    short gmax(){
        return maxLength - (numTetrads * 4 + 1);
    }

    short length() {
       return 4 * numTetrads + y1 + y2 + y3;
    }

    nt t1(){
        return start;
    }

    nt t2() {
        return t1() + numTetrads + y1;
    }

    nt t3() {
        return t2() + numTetrads + y2;
    }

    nt t4() {
        return t3() + numTetrads + y3;
    }

    nt cursor() {
        if (y1 < 0 ) return t1() + numTetrads;
        else if (y2 < 0) return t2() + numTetrads;
        else if (y3 < 0) return t3() + numTetrads;
        else return -1;
    }

    short partialLength() {
        short length = numTetrads * 4;
        // add the minimum loops left
        if (y1 >= 0 && y2 <0 ) {
            // only first loop is known
            if (y1 == 0)
                // other two must be at least 2
                length += 2;
            else
                length += 1;
        }
        else if (y2 >= 0 && y3 <0) {
            //first two loop lengths are known
            if (y1 == 0 || y2 == 0 ) {
                length+= 1;
            }
        }
        // add the current loops
        if (y1 > 0 ) length += y1;
        if (y2 > 0 ) length += y2;
        if (y3 > 0 ) length += y3;
        return length;
    }

    short minAcceptableLoopLength(){
        if (y1 == 0 || y2 == 0 || y3 == 0) return 1;
        else return 0;
    }

    bool complete() {
        if (y1 < 0 || y2 < 0 || y3 < 0 ) return false;
        return true;
    }

    bool viable(int min_score) {
        if (score() < min_score )
            return false;
        if (length() > maxLength )
            return false;

        // only one loop is allowed to have a 0 length
        short count = 0;
        if (y1 < 1) count+= 1;
        if (y2 < 1) count+= 1;
        if (y3 < 1) count+= 1;
        return count < 2;
    }

    void findLoopLengthsFrom(queue<int> & ys, int i) {
        int p = i;
        bool done = false;
        while (!done) {
            p = sequence.find(tstring, p);
            if (p < (start+maxLength+1) && p >= 0) {
                int y = p - i;
                if (y >= minAcceptableLoopLength() && (p-start+tstring.length()-1) < maxLength) {
                    ys.push(y);
                }
                else done = true;
            }
            else done = true;
            p += 1;
        }
    }


    void expand(queue<G4Candidate> &cands) {
        queue<int> ys;
        findLoopLengthsFrom(ys, cursor());
        while (!ys.empty() ){
            int y = ys.front();
            ys.pop();
            G4Candidate cand(sequence, numTetrads, start);
            cand.y1 = y1;
            cand.y2 = y2;
            cand.y3 = y3;
            if (y1 < 0 ) cand.y1 = y;
            else if ( y2 < 0 ) cand.y2 = y;
            else if ( y3 < 0 ) cand.y3 = y;

            if (cand.partialLength() <= cand.maxLength )
                cands.push(cand);
        }
    }
};



class G4 {
public:
    G4() {}
    G4(G4Candidate &candidate) {
        start = candidate.start;
        tetrads = candidate.numTetrads;
        tetrad1 = candidate.t1();
        tetrad2 = candidate.t2();
        tetrad3 = candidate.t3();
        tetrad4 = candidate.t4();
        y1 = candidate.y1;
        y2 = candidate.y2;
        y3 = candidate.y3;
        length = candidate.length();
        gscore = candidate.score();
        sequence = candidate.sequence.substr(candidate.start, candidate.length());
    }

    bool isequal(const G4 & other) {
        if ( start != other.start ) return false;
        if ( tetrads != other.tetrads ) return false;
        if ( y1 != other.y1) return false;
        if ( y2 != other.y2) return false;
        if ( y3 != other.y3) return false;
        return true;
    }
    void makejson(string name, nt value, stringstream &out) {
        out << "\"" << name << "\": " << value;
    }
    void makejson(string name, short value, stringstream &out) {
        out << "\"" << name << "\": " << value;
    }
    void makejson(string name, string value, stringstream &out) {
        out << "\"" << name << "\": \"" << value << "\"";
    }
    string toString(bool print_overlaps=true) {
        stringstream out;
        out << "{";
        makejson("start", start, out); out << ",";
        makejson("tetrad1", tetrad1, out); out << ",";
        makejson("tetrad2", tetrad2, out); out << ",";
        makejson("tetrad3", tetrad3, out); out << ",";
        makejson("tetrad4", tetrad4, out); out << ",";
        makejson("y1", y1, out); out << ",";
        makejson("y2", y2, out); out << ",";
        makejson("y3", y3, out); out << ",";
        makejson("tetrads", tetrads, out); out << ",";
        makejson("length", length, out); out << ",";
        makejson("gscore", gscore, out); out << ",";
        makejson("sequence", sequence, out);
        if ( print_overlaps ) {
            out << ",";
            out << "\"overlaps\":  [";
            int i = 0;
            for ( vector<G4>::iterator git = overlaps.begin(); git != overlaps.end(); ++git) {
                out << git->toString(false);
                if ( ++i != overlaps.size()) {
                    out << ",";
                }
            }
            out << "]";
        }
        out << "}";
        return out.str();
    }
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

bool operator< (const G4 &left, const G4 &right) {
    return left.start < right.start;
}


string find(string sequence, short min_tetrads, short min_score) {
    vector <G4> raw_g4s;
    queue <G4Candidate> cands;

    seedQ(cands, sequence, min_tetrads);
    while (!cands.empty()) {
        G4Candidate cand = cands.front();
        cands.pop();
        if ( cand.complete() ) {
            if ( cand.viable(min_score)) {
                G4 g(cand);
                raw_g4s.push_back(g);
            }
        }
        else {
            queue<G4Candidate> expanded;
            cand.expand(expanded);
            while (!expanded.empty()) {
                cands.push(expanded.front());
                expanded.pop();
            }
        }
    }

    std::sort(raw_g4s.begin(), raw_g4s.end());

    vector< vector<G4> > fams;
    while (!raw_g4s.empty() ) {
        G4 g = raw_g4s[0];
        raw_g4s.erase (raw_g4s.begin());
        bool newFam = true;
        for (std::vector< vector<G4> >::iterator it = fams.begin() ; it != fams.end(); ++it) {
            if ( belongsin(g, *it) ) {
                it->push_back(g);
                newFam = false;
            }
        }
        if ( newFam ) {
            vector<G4> f;
            f.push_back(g);
            fams.push_back(f);
        }
    }

    vector<G4> g4s;


    for (vector< vector<G4> >::iterator fam_it = fams.begin() ; fam_it != fams.end(); ++fam_it) {
        short highest = 0;
        G4 final;
        for (vector<G4>::iterator it = fam_it->begin() ; it != fam_it->end(); ++it) {
            if ( it->gscore > highest ) {
                final = *it;
                highest = it->gscore;
            }
        }

        for ( vector<G4>::iterator git = fam_it->begin(); git != fam_it->end(); ++git) {
            if ( !final.isequal(*git)) {
                final.overlaps.push_back(*git);
            }
        }
        g4s.push_back(final);
    }




    stringstream out;
    out << "{\"results\" : [";
    int k = 0;
    for ( vector<G4>::iterator git = g4s.begin(); git != g4s.end(); ++git) {
        out << git->toString() ;
        if ( ++k != g4s.size()) {
            out << "," << endl;
        }
        else {
            out << endl;
        }
    }
    out << "]}";
    return out.str();
}




bool overlapped(G4 & a, G4 & b){
    nt a_start = a.start;
    nt a_end = a_start + a.length;

    nt b_start = b.start;
    nt b_end = b_start + b.length;

    if (a_start >= b_start && a_start <= b_end)  return true;
    if (a_end >= b_start && a_end <= b_end)  return true;
    if (b_start >= a_start && b_start <= a_end)  return true;
    if (b_end >= a_start && b_end <= a_end)  return true;
    return false;
}


bool belongsin(G4 g4, vector<G4> family){
    for (std::vector<G4>::iterator it = family.begin() ; it != family.end(); ++it) {
        if ( overlapped(g4, *it)) {
            return true;
        }
    }
    return false;
}

void getStartingPoints(queue<int> & starts, string sequence, int g){
    string tstring = "";
    for ( int i = 0; i < g; i++ ) tstring.append("G");
    int p = 0;
    bool done = false;
    while (!done) {
        p = sequence.find(tstring, p);
        if (p >= 0)
            starts.push(p);
        else
            done = true;
        p += 1;
    }
}

void seedQ(queue<G4Candidate> & cands, string sequence, int min_tetrads) {
    int g = min_tetrads;

    queue<int> starts;
    bool done = false;

    while (!done){
        getStartingPoints(starts, sequence, g);
        done = starts.size() == 0;
        while ( !starts.empty() ) {
            cands.push(G4Candidate(sequence, g, starts.front()));
            starts.pop();
        }
        g+= 1;
    }
}
