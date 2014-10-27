#------------------------------------------------------------
# MongoDB configuration / initialization
from pymongo import MongoClient
client = MongoClient()
db = client.chrome
collect = db.mrna
#------------------------------------------------------------



def process_mrna(mrna):
  count = 0;
  start = -1;
  end = -1;
  if 'u_rich_downstream' in mrna :
    for u in mrna['u_rich_downstream'] :
      if start == -1 :
        start = u['downstream_rel_pos']
        end = start + 5
        count+= 1
      else :
        if u['downstream_rel_pos'] > end :
          count += 1
          start = u['downstream_rel_pos']
          end = start + 5
        else :
          end = u['downstream_rel_pos'] + 5

  return count

def process_mrna_o(mrna):
  if 'u_rich_downstream' in mrna :
    return len(mrna['u_rich_downstream'])
  else:
    return 0


mcursor = collect.find(spec={'organism':'Homo sapiens'},snapshot=True, timeout=False)
count = 0
oc = 0
mrna_count = 0
for record in mcursor:
    print (' processes mrna ', mrna_count)
    mrna_count += 1
    count += process_mrna(record)
    oc += process_mrna_o(record)
mcursor.close()

print(count , 'unique urs found in database', oc, 'overlapped')
