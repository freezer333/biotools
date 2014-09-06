Sped
=========

ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdmp.zip
Download, unzip, and read names.dmp

Split into four trimmed fields, split by |

First field is ID

    Group all records by ID
    For each record, the 4th field describes the record, so it will be
    the NAME of the property.  The property value is always the second field.

    If there is a third field, use it as the property instead.

    Name class => 4th fields
    For scientific name, enbank common name assume this is unique for the ID, so
    it will be a flat property.

    For all other types, common name, misspelling, synonym, etc. the property needs
    to be an array.
    