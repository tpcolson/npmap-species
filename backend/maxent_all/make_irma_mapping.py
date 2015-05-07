# I run this as follows, but do what you want
# python make_index.py > index.json

import sys, json, csv

encountered = {}
csvfile = open('../../atbirecords/ATBI_records.csv', 'rb')
csvreader = csv.reader(csvfile)
csvreader.next()
for line in csvreader:
    if len(line) != 8:
        sys.stderr.write('error: invalid CSV file\n')
        exit(1)
    else:
        latin_name = line[0]
        id_num = int(line[2].replace(',', ''))
        encountered[latin_name] = str(id_num).zfill(7)

print json.dumps(encountered)
