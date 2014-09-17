
import urllib.request
import shutil  
import requests

human = 'NM_003196.1'  # human TCEA3 transcript
mouse = 'NM_011542.2'  # mouse TCEA3 transcript

human_sequence = None
mouse_sequence = None

url = 'http://localhost:3000/mrna/' + human + "/sequence"
response = requests.get(url)
if response.status_code == requests.codes.ok :
    data = response.json()
    human_sequence = data['sequence'];

url = 'http://localhost:3000/mrna/' + mouse + "/sequence"
response = requests.get(url)
if response.status_code == requests.codes.ok :
    data = response.json()
    mouse_sequence = data['sequence'];

post_data = { 'seqa' : human_sequence,
              'seqb' : mouse_sequence}

if human_sequence is not None and mouse_sequence is not None:
    url = 'http://localhost:3000/alignment/'
    response = requests.post(url, data=post_data)
    if response.status_code == requests.codes.ok :
        data = response.json()
        print("Sequence Alignment Result")
        print("=======================\nSequence A\n=======================")
        print(data['a'])
        print("=======================\nSequence B\n=======================")
        print(data['b'])

else:
    print ('Sequences could not be found')



