def parse_info(info):
  retval = dict();
  info_fields = info.split(';');
  for field in info_fields :
    nv = field.split('=');
    retval[nv[0].strip()] = nv[1].strip();


  if 'Dbxref' in retval :
    vals = retval['Dbxref'].split(',');
    dbxref = dict();
    for val in vals:
      nv = val.split(':');
      dbxref[nv[0]] = nv[1];
    retval['Dbxref'] = dbxref;
    
  return retval;
