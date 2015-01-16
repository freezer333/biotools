
import zlib

def parse_fasta(fasta) :
    lines = fasta.splitlines()
    header_line = lines[0][1:];
    headers = header_line.split('|')
    ret = dict()
    ret['headers'] = headers;
    ret['body'] = lines[1:];
    return ret

class SequencePageBuilder:
    def __init__(self, seq_collect, organism, taxon, build, page_size):
        self.seq_collect = seq_collect
        self.organism = organism
        self.taxon = taxon
        self.build = build
        self.page_size = page_size

    def insertPage(self, start, end, accession, seq):
        record = {
            "accession" : accession,
            "start" : start,
            "end" : end,
            "seq" : seq,
            "organism" : self.organism,
            "taxon_id" : self.taxon,
            "build": self.build
        }

        self.seq_collect.insert(record)
        
    def purge(self, accession) :
        spec = {
            "accession" : accession,
            "organism" : self.organism,
            "build": self.build
        }
        retval = self.seq_collect.remove(spec)


    def process(self, accession, line_list, encoded=True):
        line_num = 0
        start = 0
        buffer = ""
        page_count = 0
        acc = accession
        try:
          for data in line_list:
              if encoded:
                  line = data.decode('utf-8')
              else:
                  line = data
              if line_num > 0:
                  seq = line.strip()
                  cur_len = len(seq)
                  if ( len(buffer) + cur_len == self.page_size ) :
                      buffer += seq
                      compressed = zlib.compress(bytes(buffer, 'ascii'))
                      self.insertPage (start, start+self.page_size, acc, compressed)
                      page_count += 1
                      buffer = ""
                      start += self.page_size
                  elif (len(buffer) + cur_len > self.page_size ) :
                      remain = self.page_size - len(buffer)
                      a = seq[:remain]
                      b = seq[remain:]
                      buffer += a
                      compressed = zlib.compress(bytes(buffer, 'ascii'))
                      self.insertPage (start, start+self.page_size, acc, compressed)
                      page_count += 1
                      buffer = b
                      start += self.page_size
                  else :
                      buffer += seq
              line_num += 1

          if len(buffer) > 0 :
              compressed = zlib.compress(bytes(buffer, 'ascii'))
              self.insertPage(start, start+len(buffer), acc, compressed)
              page_count += 1
          print ("  +  Inserted ", page_count, " pages into sequence collection for chromosome", acc)
          return True
        except EOFError:
          print ("  x  An error occurred while processing this chromosome file - please verify that the file was downloaded entirely (or simply manually delete it)")
          return False
