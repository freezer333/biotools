#! /usr/bin/env python
import sys
import subprocess
import atexit
import os
def showopts() :
  print('-----------------------------------------------------------------------')
  print('help:          Show commands')
  print('start:         Starts biotools (database and web server, locally)')
  print('-----------------------------------------------------------------------')
  print('type \'biotools [command]\'');
  print(" ");

if len(sys.argv) is 1 or sys.argv[1] == 'help':
  showopts();
elif sys.argv[1] == 'start':
  print ('Starting biotools services');
  print ('\tStarting MongoDB (please make sure mongodb is on your path)')
  mongo = subprocess.Popen(['mongod'])
  atexit.register(mongo.terminate)
  print ('\tStarting node.js web services')
  os.chdir('serve')
  node = subprocess.Popen(['supervisor', 'app.js'])
  atexit.register(node.terminate)

  mongo.wait()
  node.wait()
else:
  print ('Invalid biotools command [', sys.argv[1], '] - type \'apex help\' for supported commands')
