# I run this as follows, but do what you want
# python make_index.py > index.json

import sys, json, csv

encountered = {}
csvfile = open('ATBI_records.csv', 'rb')
csvreader = csv.reader(csvfile)
csvreader.next()
for line in csvreader:
    if len(line) != 8:
        sys.stderr.write('error: invalid CSV file\n')
        exit(1)
    else:
        latin_name = line[0].capitalize()
        common_name = line[3]
        id_num = int(line[2].replace(',', ''))
        encountered[latin_name] = {
            'common': common_name,
            'id': str(id_num).zfill(7)
        }

print json.dumps(encountered)
