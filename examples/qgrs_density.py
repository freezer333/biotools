
import urllib.request
import shutil  
import requests

accession = 'NM_015719.3'
url = 'http://localhost:3000/qgrs/mrna/' + accession + '/density'
filter = {'minTetrad' : 3, 'maxTetrad': 3}
response = requests.get(url, params=filter)
if response.status_code == requests.codes.ok :
    data = response.json()
    print("Density of QGRS (minimum of 3 tetrads) in 3'UTR is " , data['density']['utr3']['density'])
else:
    print("Density of QGRS could not be calculated")