from pymongo import MongoClient
import requests
import g
import threading


class QGRSCounter (threading.Thread):
    def __init__(self, threadID, name, genes):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.genes = genes
        self.samples = 0
        self.samples_with_qgrs2 = 0
        self.samples_with_qgrs3 = 0
        self.count = 0
    def run(self):
        print ("Starting " + self.name)
        for record in self.genes:
            self.count += 1
            url = seq_url + '/chrom/' + record['chrom'] + '/' + str(record['start']) + '/' + str(record['end'])
            if record['orientation'] == '-':
                url += "?orientation=-";
                
                response = requests.get(url)
                if response.status_code == requests.codes.ok :
                    data = response.json()
                    if 'seq' in data :
                        for i in range(0, len(data['seq'])):
                            results = g.find(data['seq'][i:i+sample_length], 2, 17)
                            self.samples += 1
                            passes2 = False
                            passes3 = False
                            for result in results:
                                passes2 = True
                                if result['tetrads'] >= 3:
                                     passes3 = True
                            
                            if passes2:
                                self.samples_with_qgrs2 += 1
                            if passes3:
                                self.samples_with_qgrs3 += 1
            
                            print(self.name + " - " + '{:6.2f}'.format(self.count/len(self.genes)*100) + "%", " 2+ ->", '{:6.2f}'.format(self.samples_with_qgrs2/self.samples*100) + "%", "   |    3+ ->", '{:6.2f}'.format(self.samples_with_qgrs3/self.samples*100) + "%")
            
        print ("Exiting " + self.name)

    



client = MongoClient()
db = client.chrome
collect = db.gene
sample_length = 200
seq_url = 'http://localhost:3000'

spec = {'$and':[{'organism':'Homo sapiens'}, {'build':"37"}]}
mcursor = collect.find(spec,modifiers={"$snapshot": True, "$timeout":False})
count = 0

genes = []
for record in mcursor:
    print(record['gene_id'], "\t", record['gene_name'])
    # go get the sequence ...
    genes.append(record)
    count += 1
mcursor.close()
print(count, "genes")

counters = [];

threads = 40
per_batch = len(genes)//threads

for batch in range(0, threads):
    start = batch * per_batch
    end = batch * per_batch + per_batch
    print(start, "-", end)
    counters.append(QGRSCounter(1, "Thread-"+str(batch).zfill(3), genes[start:end]))

for t in counters:
    t.start()

samples = 0
samples_with_qgrs2 = 0
samples_with_qgrs3 = 0
count = 0
for t in counters:
    t.join();
    samples += t.samples
    samples_with_qgrs2 += t.samples_with_qgrs2
    samples_with_qgrs3 += t.samples_with_qgrs3
    count += t.count

print("(",count, ")", samples_with_qgrs2, "/", samples, ":  ", samples_with_qgrs2/samples*100, " - 3+ - ",samples_with_qgrs3/samples*100)
                        


