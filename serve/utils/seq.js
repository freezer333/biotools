exports.reverse_complement = function (sequence){
    rev = sequence.split("").reverse();
    sequence = rev.map(function (c){
                if ( c == 'A' ) return 'T';
                if ( c == 'T' ) return 'A';
                if ( c == 'C' ) return 'G';
                if ( c == 'G' ) return 'C';
                return c;
            }).join("");
    return sequence;
}
