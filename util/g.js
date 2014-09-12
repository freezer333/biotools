
/* Example of running the python g-quadruplex identification script from Node.js*/

var spawn = require('child_process').spawn;

var g = spawn('python3',['grun.py']);
g.stdin.setEncoding('utf8');
g.stdout.setEncoding('utf8');
g.stdin.write('GGGAAAGGGAGGGGAGGGCCCCCCCCCCAAAAAAAACCCCCCAACACCACACACGGGGNNNNGGGGGAAGGGGAGGGGG');
g.stdin.end()

g.stdout.on('data', function(data) {
    console.log(data);
})
        
g.on('exit', function(code){
    console.log("g exited with code " + code);
})